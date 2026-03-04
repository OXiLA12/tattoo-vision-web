import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: 200 });
    }

    const respond = (status: number, data: any) => new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        // E.g., a specific price ID for the main subscription
        const stripePriceId = Deno.env.get("STRIPE_PRICE_ID") || "price_1StEXVEJuCXjTiQrWjZEOSYw"; // Fallback to plus plan

        if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
            return respond(500, { ok: false, error: "Missing server configuration" });
        }

        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
            return respond(400, { ok: false, error: "MY_MISSING_AUTH" });
        }

        const token = auth.slice("Bearer ".length);
        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        const { data: userData, error: userErr } = await admin.auth.getUser(token);
        if (userErr || !userData?.user) {
            return respond(400, { ok: false, error: "MY_INVALID_TOKEN", details: userErr?.message });
        }

        const user = userData.user;

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return respond(400, { error: "Invalid JSON body" });
        }

        const { returnUrl } = body;
        if (!returnUrl) {
            return respond(400, { error: "returnUrl is required" });
        }

        const { data: profile } = await admin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // 3. Prevent duplicate trials
        if (profile?.free_trial_used) {
            return respond(200, { ok: false, code: "TRIAL_ALREADY_USED", error: "Trial already used" });
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 4. Ensure stripe_customer_id
        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = customer.id;

            await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        // 5. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: stripePriceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}?canceled=true`,
            client_reference_id: user.id,
            subscription_data: {
                trial_period_days: 3,
                metadata: { userId: user.id, plan: 'pro' }
            },
        });

        // 6. Return url
        return respond(200, { url: session.url });

    } catch (error: any) {
        console.error("Trial Checkout Error:", error);
        return respond(200, { ok: false, message: "STRIPE_ERROR", error: error.message || "Internal server error" });
    }
});
