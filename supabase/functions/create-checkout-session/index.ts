import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

    const json = (status: number, data: any) => new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl) return json(500, { ok: false, error: "MISSING_SUPABASE_URL" });
        if (!serviceRoleKey) return json(500, { ok: false, error: "MISSING_SUPABASE_SERVICE_ROLE_KEY" });
        if (!stripeKey) return json(500, { ok: false, error: "MISSING_STRIPE_KEY" });

        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) return json(401, { ok: false, error: "MISSING_AUTH" });

        const token = auth.slice("Bearer ".length);
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        const { data: userData, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !userData?.user) return json(401, { ok: false, error: "INVALID_TOKEN", details: userErr?.message });

        const user = userData.user;

        let body;
        try { body = await req.json(); }
        catch { return json(400, { error: "Invalid JSON body" }); }

        const { returnUrl, plan = 'pro' } = body;

        const { data: profile } = await admin.from('profiles').select('free_trial_used, stripe_customer_id').eq('id', user.id).single();

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // ── RETENTION PLAN (winback offer, no trial) ──────────────────────
        if (plan === 'retention') {
            console.log(`[RETENTION] Creating discounted offer for user ${user.id}`);

            const sessionParams: Stripe.Checkout.SessionCreateParams = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Tattoo Vision Pro — Offre Spéciale',
                            description: 'Offre exclusive · Accès illimité · Annulable à tout moment',
                        },
                        recurring: { interval: 'week' },
                        unit_amount: 799, // 7,99€
                    },
                    quantity: 1,
                }],
                mode: 'subscription',
                subscription_data: {
                    metadata: { userId: user.id, plan: 'pro', offer: 'retention' },
                },
                success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${returnUrl}?canceled=true`,
                client_reference_id: user.id,
                metadata: { userId: user.id, plan: 'pro', type: 'subscription', offer: 'retention' },
            };

            if (profile?.stripe_customer_id) {
                try {
                    await stripe.customers.retrieve(profile.stripe_customer_id);
                    sessionParams.customer = profile.stripe_customer_id;
                } catch {
                    sessionParams.customer_email = user.email;
                }
            } else {
                sessionParams.customer_email = user.email;
            }

            const session = await stripe.checkout.sessions.create(sessionParams);
            return json(200, { url: session.url });
        }

        // ── STANDARD PRO PLAN (with 3-day trial) ─────────────────────────
        if (profile?.free_trial_used) {
            console.warn(`[TRIAL] User ${user.id} already used free trial`);
            return json(200, { code: 'TRIAL_ALREADY_USED', ok: false });
        }

        // Mark trial as used immediately (anti race-condition)
        await admin.from('profiles').update({ free_trial_used: true }).eq('id', user.id);

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Tattoo Vision Pro',
                        description: 'Accès illimité à toutes les features · Annulable à tout moment',
                    },
                    recurring: { interval: 'week' },
                    unit_amount: 999, // 9,99€
                },
                quantity: 1,
            }],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 3,
                metadata: { userId: user.id, plan: 'pro' },
            },
            success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}?canceled=true`,
            client_reference_id: user.id,
            metadata: { userId: user.id, plan: 'pro', type: 'subscription' },
        };

        if (profile?.stripe_customer_id) {
            try {
                await stripe.customers.retrieve(profile.stripe_customer_id);
                sessionParams.customer = profile.stripe_customer_id;
            } catch {
                sessionParams.customer_email = user.email;
            }
        } else {
            sessionParams.customer_email = user.email;
        }

        console.log(`[CHECKOUT] Pro plan with 3-day trial for user ${user.id}`);
        const session = await stripe.checkout.sessions.create(sessionParams);
        return json(200, { url: session.url });

    } catch (error) {
        console.error("Error creating checkout session:", error);
        return json(500, { ok: false, error: (error as any).message || "Failed to create checkout session" });
    }
});
