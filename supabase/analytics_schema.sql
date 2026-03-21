-- ============================================================
--  TATTOO VISION — ANALYTICS SCHEMA
--  Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  1. RAW EVENTS TABLE  (append-only log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name    TEXT        NOT NULL,
    session_id    TEXT,
    device        TEXT,       -- 'mobile' | 'desktop'
    properties    JSONB       DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id    ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON public.analytics_events USING gin(properties);

-- RLS: users can only insert their own events, admin can read all
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own events"   ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can read all events"    ON public.analytics_events;

CREATE POLICY "Users can insert own events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all events" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ─────────────────────────────────────────────────────────────
--  2. USER ANALYTICS SUMMARY  (materialized per-user metrics)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_analytics (
    user_id                        UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Funnel milestones (first-touch timestamps)
    registered_at                  TIMESTAMPTZ,
    first_image_uploaded_at        TIMESTAMPTZ,
    first_ai_generation_at         TIMESTAMPTZ,
    first_realistic_render_at      TIMESTAMPTZ,
    first_paywall_viewed_at        TIMESTAMPTZ,
    first_purchase_at              TIMESTAMPTZ,
    last_seen_at                   TIMESTAMPTZ,
    -- Counters
    session_count                  INT DEFAULT 0,
    total_ai_generations           INT DEFAULT 0,
    total_realistic_renders        INT DEFAULT 0,
    total_paywall_views            INT DEFAULT 0,
    total_purchases                INT DEFAULT 0,
    purchase_revenue_cents         INT DEFAULT 0,
    -- Credit behavior
    credits_start                  INT DEFAULT 500,
    credits_spent_total            INT DEFAULT 0,
    credits_spent_before_purchase  INT DEFAULT 0,
    credits_remaining_at_churn     INT,
    -- Acquisition
    marketing_source               TEXT,
    utm_source                     TEXT,
    utm_medium                     TEXT,
    utm_campaign                   TEXT,
    referrer                       TEXT,
    device                         TEXT,
    -- Metadata
    updated_at                     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own analytics"   ON public.user_analytics;
DROP POLICY IF EXISTS "Admins read all analytics"  ON public.user_analytics;

CREATE POLICY "Users read own analytics" ON public.user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins read all analytics" ON public.user_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ─────────────────────────────────────────────────────────────
--  3. CORE RPC: track_event
--     Called by the frontend analytics service (fire-and-forget)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.track_event(
    p_user_id    UUID,
    p_event_name TEXT,
    p_session_id TEXT    DEFAULT NULL,
    p_device     TEXT    DEFAULT NULL,
    p_properties JSONB   DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
    v_credits_remaining INT;
BEGIN
    -- 1. Insert raw event
    INSERT INTO public.analytics_events (user_id, event_name, session_id, device, properties)
    VALUES (p_user_id, p_event_name, p_session_id, p_device, COALESCE(p_properties, '{}'));

    -- 2. Get current credits
    SELECT credits INTO v_credits_remaining
    FROM public.user_credits WHERE user_id = p_user_id;

    -- 3. Ensure user_analytics row exists
    INSERT INTO public.user_analytics (user_id, last_seen_at, device)
    VALUES (p_user_id, NOW(), p_device)
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Update summary based on event type
    CASE p_event_name

        WHEN 'user_registered' THEN
            UPDATE public.user_analytics
            SET registered_at = NOW(),
                device = p_device,
                utm_source   = p_properties->>'utm_source',
                utm_medium   = p_properties->>'utm_medium',
                utm_campaign = p_properties->>'utm_campaign',
                referrer     = p_properties->>'referrer',
                updated_at   = NOW()
            WHERE user_id = p_user_id AND registered_at IS NULL;

        WHEN 'session_started' THEN
            UPDATE public.user_analytics
            SET session_count = session_count + 1,
                last_seen_at  = NOW(),
                updated_at    = NOW()
            WHERE user_id = p_user_id;

        WHEN 'first_image_uploaded' THEN
            UPDATE public.user_analytics
            SET first_image_uploaded_at = COALESCE(first_image_uploaded_at, NOW()),
                last_seen_at = NOW(),
                updated_at   = NOW()
            WHERE user_id = p_user_id;

        WHEN 'first_ai_generation_completed' THEN
            UPDATE public.user_analytics
            SET first_ai_generation_at   = COALESCE(first_ai_generation_at, NOW()),
                total_ai_generations     = total_ai_generations + 1,
                credits_spent_total      = credits_spent_total + COALESCE((p_properties->>'credits_spent')::INT, 0),
                last_seen_at             = NOW(),
                updated_at               = NOW()
            WHERE user_id = p_user_id;

        WHEN 'first_realistic_render_completed' THEN
            UPDATE public.user_analytics
            SET first_realistic_render_at  = COALESCE(first_realistic_render_at, NOW()),
                total_realistic_renders    = total_realistic_renders + 1,
                credits_spent_total        = credits_spent_total + 500,
                credits_spent_before_purchase = CASE
                    WHEN first_purchase_at IS NULL
                    THEN credits_spent_before_purchase + 500
                    ELSE credits_spent_before_purchase
                END,
                last_seen_at               = NOW(),
                updated_at                 = NOW()
            WHERE user_id = p_user_id;

        WHEN 'paywall_viewed' THEN
            UPDATE public.user_analytics
            SET first_paywall_viewed_at = COALESCE(first_paywall_viewed_at, NOW()),
                total_paywall_views     = total_paywall_views + 1,
                last_seen_at            = NOW(),
                updated_at              = NOW()
            WHERE user_id = p_user_id;

        WHEN 'purchase_completed' THEN
            UPDATE public.user_analytics
            SET first_purchase_at       = COALESCE(first_purchase_at, NOW()),
                total_purchases         = total_purchases + 1,
                purchase_revenue_cents  = purchase_revenue_cents + COALESCE(((p_properties->>'pack_price')::NUMERIC * 100)::INT, 0),
                last_seen_at            = NOW(),
                updated_at              = NOW()
            WHERE user_id = p_user_id;

        WHEN 'session_ended' THEN
            UPDATE public.user_analytics
            SET credits_remaining_at_churn = v_credits_remaining,
                last_seen_at = NOW(),
                updated_at   = NOW()
            WHERE user_id = p_user_id;

        ELSE
            -- For all other events, just update last_seen
            UPDATE public.user_analytics
            SET last_seen_at = NOW(), updated_at = NOW()
            WHERE user_id = p_user_id;

    END CASE;

EXCEPTION WHEN OTHERS THEN
    -- Silently swallow: analytics must never break the app
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  4. ADMIN RPC: get_analytics_funnel
--     Returns conversion rates per funnel step
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_funnel()
RETURNS TABLE (
    step              TEXT,
    step_order        INT,
    user_count        BIGINT,
    conversion_pct    NUMERIC
) AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.user_analytics;

    RETURN QUERY
    WITH steps AS (
        SELECT 1 AS ord, 'Inscriptions'                 AS step, COUNT(*) AS cnt FROM public.user_analytics
        UNION ALL
        SELECT 2, 'Image uploadée',         COUNT(*) FROM public.user_analytics WHERE first_image_uploaded_at IS NOT NULL
        UNION ALL
        SELECT 3, 'Génération IA',          COUNT(*) FROM public.user_analytics WHERE first_ai_generation_at IS NOT NULL
        UNION ALL
        SELECT 4, 'Rendu réaliste',         COUNT(*) FROM public.user_analytics WHERE first_realistic_render_at IS NOT NULL
        UNION ALL
        SELECT 5, 'Paywall vu',             COUNT(*) FROM public.user_analytics WHERE first_paywall_viewed_at IS NOT NULL
        UNION ALL
        SELECT 6, 'Achat',                  COUNT(*) FROM public.user_analytics WHERE first_purchase_at IS NOT NULL
    )
    SELECT
        steps.step,
        steps.ord,
        steps.cnt,
        CASE WHEN v_total = 0 THEN 0
             ELSE ROUND((steps.cnt::NUMERIC / v_total) * 100, 1)
        END
    FROM steps
    ORDER BY steps.ord;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  5. ADMIN RPC: get_analytics_overview
--     Returns KPIs for the admin dashboard
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_overview()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users',            (SELECT COUNT(*) FROM public.user_analytics),
        'paying_users',           (SELECT COUNT(*) FROM public.user_analytics WHERE first_purchase_at IS NOT NULL),
        'total_revenue_cents',    (SELECT COALESCE(SUM(purchase_revenue_cents), 0) FROM public.user_analytics),
        'avg_credits_at_churn',   (SELECT ROUND(AVG(credits_remaining_at_churn)::NUMERIC, 0) FROM public.user_analytics WHERE credits_remaining_at_churn IS NOT NULL),
        'avg_renders_before_buy', (SELECT ROUND(AVG(total_realistic_renders)::NUMERIC, 1) FROM public.user_analytics WHERE first_purchase_at IS NOT NULL),
        'avg_hours_to_purchase',  (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (first_purchase_at - registered_at)) / 3600)::NUMERIC, 1)
                                   FROM public.user_analytics WHERE first_purchase_at IS NOT NULL AND registered_at IS NOT NULL),
        'users_burned_all_credits', (SELECT COUNT(*) FROM public.user_analytics WHERE credits_remaining_at_churn = 0 OR (credits_start IS NOT NULL AND credits_remaining_at_churn <= 0)),
        'sessions_today',         (SELECT COUNT(DISTINCT session_id) FROM public.analytics_events WHERE created_at >= NOW() - INTERVAL '24 hours'),
        'events_today',           (SELECT COUNT(*) FROM public.analytics_events WHERE created_at >= NOW() - INTERVAL '24 hours'),
        'paywall_to_purchase_rate', (
            SELECT CASE
                WHEN COUNT(*) FILTER (WHERE first_paywall_viewed_at IS NOT NULL) = 0 THEN 0
                ELSE ROUND(
                    COUNT(*) FILTER (WHERE first_purchase_at IS NOT NULL)::NUMERIC /
                    COUNT(*) FILTER (WHERE first_paywall_viewed_at IS NOT NULL) * 100, 1
                )
            END
            FROM public.user_analytics
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  6. ADMIN RPC: get_all_analytics_users
--     For the user table in the dashboard
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_all_analytics_users()
RETURNS TABLE (
    user_id                   UUID,
    email                     TEXT,
    full_name                 TEXT,
    registered_at             TIMESTAMPTZ,
    last_seen_at              TIMESTAMPTZ,
    first_purchase_at         TIMESTAMPTZ,
    marketing_source          TEXT,
    utm_source                TEXT,
    device                    TEXT,
    session_count             INT,
    total_realistic_renders   INT,
    total_paywall_views       INT,
    total_purchases           INT,
    credits_remaining_at_churn INT,
    purchase_revenue_cents    INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.user_id,
        p.email,
        p.full_name,
        ua.registered_at,
        ua.last_seen_at,
        ua.first_purchase_at,
        ua.marketing_source,
        ua.utm_source,
        ua.device,
        ua.session_count,
        ua.total_realistic_renders,
        ua.total_paywall_views,
        ua.total_purchases,
        ua.credits_remaining_at_churn,
        ua.purchase_revenue_cents
    FROM public.user_analytics ua
    LEFT JOIN public.profiles p ON p.id = ua.user_id
    ORDER BY ua.registered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  7. ADMIN RPC: get_events_by_name
--     For event-level drilldown in dashboard
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_events_by_name(
    p_event_name TEXT,
    p_limit      INT DEFAULT 100
)
RETURNS TABLE (
    id         UUID,
    user_id    UUID,
    session_id TEXT,
    device     TEXT,
    properties JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT ae.id, ae.user_id, ae.session_id, ae.device, ae.properties, ae.created_at
    FROM public.analytics_events ae
    WHERE ae.event_name = p_event_name
    ORDER BY ae.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  8. ADMIN RPC: get_source_breakdown
--     Marketing attribution: sources + UTM + device
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_source_breakdown()
RETURNS TABLE (
    source  TEXT,
    device  TEXT,
    count   BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ua.marketing_source, ua.utm_source, 'Direct / Inconnu') AS source,
        COALESCE(ua.device, 'unknown') AS device,
        COUNT(*)::BIGINT
    FROM public.user_analytics ua
    GROUP BY 1, 2
    ORDER BY 3 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  9. ADMIN RPC: get_daily_events
--     Events per day for time-series charts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_events(
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    day         TEXT,
    event_name  TEXT,
    count       BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(ae.created_at AT TIME ZONE 'UTC', 'DD/MM') AS day,
        ae.event_name,
        COUNT(*)::BIGINT
    FROM public.analytics_events ae
    WHERE ae.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY 1, 2
    ORDER BY 1, 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
--  10. Backfill existing users into user_analytics
--      (safe to run multiple times due to ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.user_analytics (user_id, registered_at, marketing_source, last_seen_at)
SELECT
    p.id,
    p.created_at,
    p.marketing_source,
    p.created_at
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- Update purchase data from existing transactions
UPDATE public.user_analytics ua
SET
    first_purchase_at = t.first_purchase,
    total_purchases   = t.purchase_count,
    purchase_revenue_cents = 0 -- no price stored in old transactions
FROM (
    SELECT
        user_id,
        MIN(created_at) AS first_purchase,
        COUNT(*)        AS purchase_count
    FROM public.credit_transactions
    WHERE type = 'purchase'
    GROUP BY user_id
) t
WHERE ua.user_id = t.user_id;

-- Update render data from existing transactions
UPDATE public.user_analytics ua
SET
    first_realistic_render_at = t.first_render,
    total_realistic_renders   = t.render_count,
    credits_spent_total       = t.spent
FROM (
    SELECT
        user_id,
        MIN(created_at) AS first_render,
        COUNT(*) FILTER (WHERE amount = 500) AS render_count,
        SUM(ABS(amount)) AS spent
    FROM public.credit_transactions
    WHERE type = 'usage'
    GROUP BY user_id
) t
WHERE ua.user_id = t.user_id;

-- ─────────────────────────────────────────────────────────────
--  Done! Verify with:
--  SELECT * FROM get_analytics_overview();
--  SELECT * FROM get_analytics_funnel();
-- ─────────────────────────────────────────────────────────────
