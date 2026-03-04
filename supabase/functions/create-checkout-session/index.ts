import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

const CREDIT_PACKS: Record<string, { credits: number; amount: number; name: string }> = {
    pack_starter: { credits: 1000, amount: 999, name: 'Pack Starter — 1 000 Crédits' },
    pack_creator: { credits: 3500, amount: 2999, name: 'Pack Creator — 3 500 Crédits' },
    pack_studio: { credits: 8000, amount: 5999, name: 'Pack Studio — 8 000 Crédits' },
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

        if (!supabaseUrl || !serviceRoleKey || !stripeKey)
            return json(500, { ok: false, error: "MISSING_ENV" });

        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) return json(401, { ok: false, error: "MISSING_AUTH" });

        const token = auth.slice("Bearer ".length);
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        const { data: userData, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !userData?.user) return json(401, { ok: false, error: "INVALID_TOKEN" });

        const user = userData.user;

        let body;
        try { body = await req.json(); }
        catch { return json(400, { error: "Invalid JSON body" }); }

        const { returnUrl, plan = 'pro' } = body;

        const { data: profile } = await admin
            .from('profiles')
            .select('free_trial_used, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Helper: resolve or create Stripe customer
        const resolveCustomer = async (): Promise<string | undefined> => {
            if (profile?.stripe_customer_id) {
                try {
                    await stripe.customers.retrieve(profile.stripe_customer_id);
                    return profile.stripe_customer_id;
                } catch { /* customer not found */ }
            }
            return undefined;
        };

        // ── CREDIT PACK (one-time payment) ────────────────────────────────
        if (plan.startsWith('pack_')) {
            const pack = CREDIT_PACKS[plan];
            if (!pack) return json(400, { error: 'INVALID_PACK' });

            const customer = await resolveCustomer();
            const sessionParams: Stripe.Checkout.SessionCreateParams = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: { name: pack.name },
                        unit_amount: pack.amount,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${returnUrl}?success=true&pack=${plan}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${returnUrl}?canceled=true`,
                client_reference_id: user.id,
                metadata: { userId: user.id, type: 'credit_pack', pack: plan, credits: String(pack.credits) },
            };
            if (customer) sessionParams.customer = customer;
            else sessionParams.customer_email = user.email;

            const session = await stripe.checkout.sessions.create(sessionParams);
            console.log(`[CREDIT_PACK] ${plan} (${pack.credits} credits) for user ${user.id}`);
            return json(200, { url: session.url });
        }

        // ── RETENTION PLAN (winback offer, no trial) ──────────────────────
        if (plan === 'retention') {
            const customer = await resolveCustomer();
            const sessionParams: Stripe.Checkout.SessionCreateParams = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Tattoo Vision Pro — Offre Spéciale',
                            description: 'Offre exclusive · 2 000 crédits/semaine · Annulable à tout moment',
                        },
                        recurring: { interval: 'week' },
                        unit_amount: 799,
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
            if (customer) sessionParams.customer = customer;
            else sessionParams.customer_email = user.email;

            const session = await stripe.checkout.sessions.create(sessionParams);
            return json(200, { url: session.url });
        }

        // ── STANDARD PRO PLAN (with 3-day trial) ─────────────────────────
        // NOTE: We check free_trial_used here but do NOT mark it yet.
        // The webhook (checkout.session.completed) is responsible for marking
        // free_trial_used=true AND setting entitled=true, plan='pro'.
        // This avoids the bug where a user's trial is consumed if they abandon Stripe checkout.
        if (profile?.free_trial_used) {
            console.warn(`[TRIAL] User ${user.id} already used free trial`);
            return json(200, { code: 'TRIAL_ALREADY_USED', ok: false });
        }

        // Resolve or create Stripe customer and persist it
        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
            try {
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id },
                });
                customerId = newCustomer.id;
                await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
            } catch (customerErr) {
                console.error('[CHECKOUT] Failed to create Stripe customer:', customerErr);
            }
        } else {
            // Verify the customer still exists in Stripe
            try {
                await stripe.customers.retrieve(customerId);
            } catch {
                // Customer deleted in Stripe — create a new one
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id },
                });
                customerId = newCustomer.id;
                await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
            }
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Tattoo Vision Pro',
                        description: '2 000 crédits/semaine · Accès à toutes les features',
                    },
                    recurring: { interval: 'week' },
                    unit_amount: 999,
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
        if (customerId) sessionParams.customer = customerId;
        else sessionParams.customer_email = user.email;

        console.log(`[CHECKOUT] Pro plan with 3-day trial for user ${user.id} (customer: ${customerId})`);
        const session = await stripe.checkout.sessions.create(sessionParams);
        return json(200, { url: session.url });

    } catch (error) {
        console.error("Error creating checkout session:", error);
        return json(500, { ok: false, error: (error as any).message || "Failed to create checkout session" });
    }
});
