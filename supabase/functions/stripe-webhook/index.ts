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
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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
            const stripeEventId = event.id; // Unique ID from Stripe — used for idempotency

            if (userId && credits > 0) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                const planId = session.metadata?.plan || session.metadata?.packageId;

                // ── IDEMPOTENCY CHECK ──────────────────────────────────────────
                // Stripe can deliver the same event multiple times. We use the event ID
                // as a unique key. If we've already processed it, we skip and return 200.
                const { data: existingEvent, error: lookupError } = await supabaseAdmin
                    .from('processed_stripe_events')
                    .select('event_id')
                    .eq('event_id', stripeEventId)
                    .maybeSingle();

                if (lookupError) {
                    // Table may not exist yet — fall through (safe degradation)
                    console.warn('processed_stripe_events lookup failed:', lookupError.message);
                }

                if (existingEvent) {
                    console.log(`[IDEMPOTENCY] Event ${stripeEventId} already processed — skipping.`);
                    return new Response(JSON.stringify({ received: true, skipped: true }), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                // Mark event as processed BEFORE adding credits (prevents race conditions)
                await supabaseAdmin
                    .from('processed_stripe_events')
                    .insert({ event_id: stripeEventId, user_id: userId, created_at: new Date().toISOString() });
                // ──────────────────────────────────────────────────────────────

                const { error } = await supabaseAdmin.rpc('add_credits', {
                    p_user_id: userId,
                    p_amount: credits,
                    p_type: 'purchase',
                    p_description: `Purchased package: ${packageId || planId}`
                });

                if (planId === 'launch_weekly_trial') {
                    await supabaseAdmin.from('profiles').update({ free_trial_used: true }).eq('id', userId);
                }

                if (error) {
                    console.error('Error adding credits:', error);
                    return new Response(
                        JSON.stringify({ error: 'Failed to add credits' }),
                        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                console.log(`Added ${credits} credits to user ${userId} (event: ${stripeEventId})`);
            }

            // Track start of trial via Stripe directly if it was a subscription
            if (session.mode === 'subscription' && userId) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                await supabaseAdmin.rpc('track_event', {
                    p_user_id: userId,
                    p_event_name: 'trial_started',
                    p_session_id: 'stripe_webhook',
                    p_device: 'desktop',
                    p_properties: { source: 'stripe_checkout' }
                });
            }
        }


        // Track when someone cancels their subscription (or trial)
        if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as any;

            // If it's updated, we only care if they just asked to cancel it at period end
            const isCancellationEvent = event.type === 'customer.subscription.deleted' ||
                (event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end === true && !event.data.previous_attributes?.cancel_at_period_end);

            if (isCancellationEvent) {
                // We need to find the user from the customer or subscription metadata
                // Usually metadata is on the subscription if we passed it down, or we must fetch the customer
                let userId = subscription.metadata?.userId;

                if (!userId) {
                    // Try to get customer metadata
                    const customer = await stripe.customers.retrieve(subscription.customer as string);
                    if (!customer.deleted) {
                        userId = (customer as Stripe.Customer).metadata?.userId;
                    }
                }

                if (userId) {
                    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                    await supabaseAdmin.rpc('track_event', {
                        p_user_id: userId,
                        p_event_name: 'subscription_cancelled',
                        p_session_id: 'stripe_webhook',
                        p_device: 'desktop',
                        p_properties: {
                            status: subscription.status,
                            reason: 'user_cancelled',
                            stripe_sub_id: subscription.id
                        }
                    });
                    console.log(`Tracked cancellation for user ${userId}`);
                }
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
