import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders, status: 200 });

    const json = (status: number, data: any) => new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !serviceRoleKey || !stripeKey)
            return json(500, { ok: false, error: "Missing server configuration" });

        // Auth — get user from JWT (or skip if JWT verif disabled)
        const auth = req.headers.get("Authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        let userId: string | null = null;

        if (token) {
            const { data: userData } = await admin.auth.getUser(token);
            userId = userData?.user?.id ?? null;
        }

        let body: any;
        try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

        const { sessionId } = body;
        if (!sessionId) return json(400, { error: "sessionId is required" });

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Retrieve the Stripe session to confirm it's real
        let session: Stripe.Checkout.Session;
        try {
            session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['subscription', 'customer'],
            });
        } catch (e: any) {
            console.error('[CONFIRM] Failed to retrieve session:', e.message);
            return json(400, { error: "Invalid session ID" });
        }

        // Determine userId — from JWT first, then from session reference
        if (!userId) userId = session.client_reference_id || (session.metadata?.userId ?? null);
        if (!userId) return json(400, { error: "Could not identify user" });

        console.log(`[CONFIRM] Session ${sessionId} for user ${userId} — payment_status: ${session.payment_status}, status: ${session.status}`);

        // Accept if session is completed (trial subscriptions have payment_status = 'no_payment_required')
        const isValid = session.status === 'complete';
        if (!isValid) {
            return json(200, { ok: false, reason: `Session status is '${session.status}', not complete` });
        }

        // Get subscription status
        const sub = session.subscription as Stripe.Subscription | null;
        const subStatus = sub?.status ?? 'trialing';
        const trialEndsAt = sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
        const currentPeriodEndsAt = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const stripeSubscriptionId = typeof sub === 'string' ? sub : sub?.id ?? null;

        // Check if already processed
        const { data: existingProfile } = await admin.from('profiles').select('entitled, free_trial_used').eq('id', userId).single();
        if (existingProfile?.entitled === true) {
            console.log(`[CONFIRM] User ${userId} already entitled — skipping`);
            return json(200, { ok: true, alreadyProcessed: true });
        }

        // Update profile: set Pro + entitled + trial info
        const updates: any = {
            entitled: true,
            plan: 'pro',
            free_trial_used: true,
            subscription_status: subStatus,
        };
        if (trialEndsAt) updates.trial_ends_at = trialEndsAt;
        if (currentPeriodEndsAt) updates.current_period_ends_at = currentPeriodEndsAt;
        if (stripeCustomerId) updates.stripe_customer_id = stripeCustomerId;
        if (stripeSubscriptionId) updates.stripe_subscription_id = stripeSubscriptionId;

        const { error: updateErr } = await admin.from('profiles').update(updates).eq('id', userId);

        if (updateErr) {
            console.error('[CONFIRM] Profile update failed:', updateErr.message);
            return json(500, { ok: false, error: updateErr.message });
        }

        console.log(`[CONFIRM] ✅ User ${userId} → entitled=true, plan=pro, status=${subStatus}`);

        // Grant 2000 credits (only if not already entitled, so not a duplicate)
        try {
            await admin.rpc('add_credits', {
                p_user_id: userId,
                p_amount: 2000,
                p_type: 'purchase',
                p_description: 'Pro subscription start — 2000 credits (confirm-checkout)',
            });
            console.log(`[CONFIRM] ✅ 2000 credits granted to ${userId}`);
        } catch (creditsErr) {
            console.warn('[CONFIRM] Credits grant failed (non-fatal):', creditsErr);
        }

        return json(200, { ok: true, entitled: true, plan: 'pro', credits: 2000 });

    } catch (error: any) {
        console.error("[CONFIRM] Unexpected error:", error);
        return json(500, { ok: false, error: error.message || "Internal server error" });
    }
});
