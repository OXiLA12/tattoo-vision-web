-- Update get_all_analytics_users to return subscription_status and
-- current_period_ends_at so the admin panel can display subscription info.

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
        ua.user_id,
        p.email,
        p.full_name,
        p.referred_by::TEXT,
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
        ua.purchase_revenue_cents,
        p.subscription_status,
        p.current_period_ends_at
    FROM public.user_analytics ua
    LEFT JOIN public.profiles p ON p.id = ua.user_id
    ORDER BY ua.registered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
