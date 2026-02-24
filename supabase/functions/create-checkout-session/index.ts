import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

// Define credit packages
const PACKAGES = {
    // Single render unlock (2.99€) — for price-sensitive users at the paywall
    vp_unlock_single: { credits: 500, price: 299, name: 'Single Render Unlock (500 VP)' },
    unlock_single_render: { credits: 500, price: 299, name: 'Single Render Unlock (500 VP)' },

    // NEW CASh MACHINE PACKAGES
    launch_weekly_trial: { credits: 1000, price: 699, name: '3 Days Free Trial + Weekly Plan', isSubscription: true },
    launch_lifetime: { credits: 5000000, price: 1499, name: 'Lifetime Unlock', isSubscription: false },

    // Vision Points Packs
    vp_pack_3000: { credits: 5000, price: 599, name: '10 Renders Pack (5,000 VP)' },
    vp_pack_7000: { credits: 7000, price: 999, name: 'Popular Pack (7,000 VP)' },
    vp_pack_15000: { credits: 15000, price: 1999, name: 'Pro Pack (15,000 VP)' },
    vp_pack_40000: { credits: 40000, price: 3999, name: 'Studio Pack (40,000 VP)' },
    // Legacy aliases
    starter_pack_5000vp: { credits: 5000, price: 599, name: '10 Renders Pack (5,000 VP)' },
    popular_pack_7000vp: { credits: 7000, price: 999, name: 'Popular Pack (7,000 VP)' },
    pro_pack_15000vp: { credits: 15000, price: 1999, name: 'Pro Pack (15,000 VP)' },
    studio_pack_40000vp: { credits: 40000, price: 3999, name: 'Studio Pack (40,000 VP)' },
    small: { credits: 10, price: 500, name: 'Small Pack (10 Credits)' },
    medium: { credits: 50, price: 2000, name: 'Medium Pack (50 Credits)' },
    large: { credits: 100, price: 3500, name: 'Large Pack (100 Credits)' },
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }

    // Helper to return JSON responses
    const json = (status: number, data: any) => new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Log environment status safely
        console.log("env check", {
            hasUrl: !!supabaseUrl,
            hasServiceRole: !!serviceRoleKey,
            hasStripe: !!stripeKey
        });

        if (!supabaseUrl) return json(500, { ok: false, error: "MISSING_SUPABASE_URL" });
        if (!serviceRoleKey) return json(500, { ok: false, error: "MISSING_SUPABASE_SERVICE_ROLE_KEY" });
        if (!stripeKey) return json(500, { ok: false, error: "MISSING_STRIPE_KEY" });

        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
            console.error("401: Missing or invalid Authorization header");
            return json(401, { ok: false, error: "MISSING_AUTH" });
        }

        const token = auth.slice("Bearer ".length);
        console.log("auth header ok", { tokenLen: token.length });

        // Verify user using the service role key (admin client)
        const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        const { data: userData, error: userErr } = await admin.auth.getUser(token);

        if (userErr || !userData?.user) {
            console.error("401: Auth verification failed", userErr?.message);
            return json(401, { ok: false, error: "INVALID_TOKEN", details: userErr?.message });
        }

        console.log("checkout user ok", { userId: userData.user.id });
        const user = userData.user;

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: "Invalid JSON body" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const { plan, packageId, returnUrl } = body;

        // Support both plan (new) and packageId (old/credits)
        const id = plan || packageId;

        // Ensure id exists in either PACKAGES or new sub plans
        if (!id || (!PACKAGES[id] && !['plus', 'pro', 'studio'].includes(id))) {
            console.error("400: Invalid plan or package ID:", id);
            return json(400, { ok: false, error: "Plan or Package ID is required" });
        }

        // Stripe Price IDs from Stripe Dashboard
        const PLAN_PRICE_IDS = {
            plus: 'price_1StEXVEJuCXjTiQrWjZEOSYw',
            pro: 'price_1StEY0EJuCXjTiQruod4ehPc',
            studio: 'price_1StEaIEJuCXjTiQrftzwd5Z7',
        };

        // Metadata for tracking
        const PLAN_METADATA = {
            plus: { credits: 1000, name: 'Plus Plan' },
            pro: { credits: 5000, name: 'Pro Plan' },
            studio: { credits: 15000, name: 'Studio Plan' },
        };

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Check for free trial eligibility
        const { data: profile } = await admin.from('profiles').select('free_trial_used').eq('id', user.id).single();

        // Check if it's a subscription plan or a credit package
        const isSubscription = ['plus', 'pro', 'studio'].includes(id) || (PACKAGES[id as keyof typeof PACKAGES] as any)?.isSubscription === true;

        if (isSubscription) {
            // Determine price id
            let priceId: string | undefined;
            let metadataCredits: string;

            if (['plus', 'pro', 'studio'].includes(id)) {
                priceId = (PLAN_PRICE_IDS as any)[id];
                metadataCredits = (PLAN_METADATA as any)[id].credits.toString();
            } else {
                metadataCredits = (PACKAGES as any)[id].credits.toString();
            }

            const lineItem = priceId ? {
                price: priceId,
                quantity: 1,
            } : {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: (PACKAGES as any)[id].name,
                    },
                    recurring: { interval: 'week' },
                    unit_amount: (PACKAGES as any)[id].price,
                },
                quantity: 1,
            };

            // Calculate trial days if it's the launch trial and they haven't used it yet
            const trialDays = (id === 'launch_weekly_trial' && profile && !profile.free_trial_used) ? 3 : undefined;

            const sessionParams: any = {
                payment_method_types: ['card'],
                line_items: [lineItem],
                mode: 'subscription',
                customer_email: user.email,
                success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${returnUrl}?canceled=true`,
                client_reference_id: user.id,
                metadata: {
                    userId: user.id,
                    credits: metadataCredits,
                    plan: id,
                    type: 'subscription'
                },
                subscription_data: {
                    trial_period_days: trialDays,
                    metadata: {
                        userId: user.id,
                        credits: metadataCredits,
                        plan: id
                    }
                },
            };

            const session = await stripe.checkout.sessions.create(sessionParams);

            return json(200, { url: session.url });
        } else {
            // One-time credit package (old system)
            const selectedItem = (PACKAGES as any)[id];

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: selectedItem.name,
                                description: `${selectedItem.credits} credits for tattoo vision`,
                            },
                            unit_amount: selectedItem.price,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                customer_email: user.email,
                success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${returnUrl}?canceled=true`,
                client_reference_id: user.id,
                metadata: {
                    userId: user.id,
                    credits: selectedItem.credits.toString(),
                    packageId: id,
                    type: 'one-time'
                },
            });

            return json(200, { url: session.url });
        }

    } catch (error) {
        console.error("Error creating checkout session:", error);
        return json(500, { ok: false, error: (error as any).message || "Failed to create checkout session" });
    }
});
