import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!stripeKey || !webhookSecret || !supabaseServiceKey) {
            console.error("Configuration missing");
            return new Response(
                JSON.stringify({ error: "Server configuration error" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return new Response(
                JSON.stringify({ error: "No signature" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const body = await req.text();
        let event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return new Response(
                JSON.stringify({ error: `Webhook Error: ${err.message}` }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            const credits = parseInt(session.metadata?.credits || '0');
            const packageId = session.metadata?.packageId;

            if (userId && credits > 0) {
                // Initialize Supabase admin client
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

                const { error } = await supabaseAdmin.rpc('add_credits', {
                    p_user_id: userId,
                    p_amount: credits,
                    p_type: 'purchase',
                    p_description: `Purchased package: ${packageId}`
                });

                if (error) {
                    console.error('Error adding credits:', error);
                    return new Response(
                        JSON.stringify({ error: 'Failed to add credits' }),
                        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                console.log(`Added ${credits} credits to user ${userId}`);
            }
        }

        return new Response(
            JSON.stringify({ received: true }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("Error in stripe-webhook:", error);
        return new Response(
            JSON.stringify({ error: "Webhook handler failed" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
