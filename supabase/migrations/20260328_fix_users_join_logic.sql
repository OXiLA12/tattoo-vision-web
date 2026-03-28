-- Fix: get_all_analytics_users should query from profiles, not user_analytics
-- Problem: user_analytics is LEFT JOINed, so it only returns users WITH analytics records
-- Solution: Query from profiles and LEFT JOIN to user_analytics so ALL users are returned

DROP FUNCTION IF EXISTS public.get_all_analytics_users();

CREATE OR REPLACE FUNCTION public.get_all_analytics_users()
RETURNS TABLE (
    user_id                    UUID,
    email                      TEXT,
    full_name                  TEXT,
    referred_by                TEXT,
    registered_at              TIMESTAMPTZ,
    last_seen_at               TIMESTAMPTZ,
    first_purchase_at          TIMESTAMPTZ,
    marketing_source           TEXT,
    utm_source                 TEXT,
    device                     TEXT,
    session_count              INT,
    total_realistic_renders    INT,
    total_paywall_views        INT,
    total_purchases            INT,
    credits_remaining_at_churn INT,
    purchase_revenue_cents     INT,
    subscription_status        TEXT,
    current_period_ends_at     TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.full_name,
        p.referred_by::TEXT,
        ua.registered_at,
        ua.last_seen_at,
        ua.first_purchase_at,
        ua.marketing_source,
        ua.utm_source,
        ua.device,
        COALESCE(ua.session_count, 0),
        COALESCE(ua.total_realistic_renders, 0),
        COALESCE(ua.total_paywall_views, 0),
        COALESCE(ua.total_purchases, 0),
        ua.credits_remaining_at_churn,
        COALESCE(ua.purchase_revenue_cents, 0),
        p.subscription_status,
        p.current_period_ends_at
    FROM public.profiles p
    LEFT JOIN public.user_analytics ua ON ua.user_id = p.id
    ORDER BY COALESCE(ua.registered_at, p.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
