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
        const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

        // Helper: send transactional email via Resend
        const sendEmail = async (to: string, subject: string, html: string) => {
            if (!resendApiKey) { console.warn('[EMAIL] RESEND_API_KEY not set, skipping email'); return; }
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from: 'Tattoo Vision <noreply@tattoo-vision.com>', to, subject, html }),
                });
                if (!res.ok) console.error('[EMAIL] Resend error:', await res.text());
                else console.log('[EMAIL] Sent to', to);
            } catch (e) { console.error('[EMAIL] Failed to send email:', e); }
        };

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

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const stripeEventId = event.id; // Unique ID from Stripe — used for idempotency

        // ── IDEMPOTENCY CHECK ──────────────────────────────────────────
        const { error: insertError } = await supabaseAdmin
            .from('processed_stripe_events')
            .insert({ event_id: stripeEventId, created_at: new Date().toISOString() });

        if (insertError) {
            if (insertError.code === '23505') {
                console.log(`[IDEMPOTENCY] Event ${stripeEventId} already processed (concurrent/duplicate) — skipping.`);
                return new Response(JSON.stringify({ received: true, skipped: true }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            if (insertError.code === '42P01') {
                console.error('FATAL ERROR: processed_stripe_events table is missing! Please execute the SQL migration in Supabase SQL Editor.');
            } else {
                console.error('processed_stripe_events insert failed:', insertError.message);
            }
            return new Response(JSON.stringify({ error: 'Database idempotency check failed: ' + insertError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        // ──────────────────────────────────────────────────────────────

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id || session.metadata?.userId;
            const credits = parseInt(session.metadata?.credits || '0');
            const packageId = session.metadata?.packageId;
            const planId = session.metadata?.plan || packageId;

            if (userId) {
                // Update basic subscription info + prevent further trials immediately
                const updates: any = {
                    free_trial_used: true,
                };
                if (session.mode === 'subscription') {
                    updates.entitled = true;
                    updates.subscription_status = 'trialing';
                    // Store the plan name (plus / pro / studio / launch_weekly_trial)
                    if (planId) updates.plan = planId;
                }
                if (session.customer) updates.stripe_customer_id = session.customer;
                if (session.subscription) updates.stripe_subscription_id = session.subscription;

                await supabaseAdmin.from('profiles').update(updates).eq('id', userId);

                // Add credits ONLY if it's a one-time purchase with credits
                if (credits > 0 && session.mode !== 'subscription') {
                    const { error } = await supabaseAdmin.rpc('add_credits', {
                        p_user_id: userId,
                        p_amount: credits,
                        p_type: 'purchase',
                        p_description: `Purchased package: ${planId}`
                    });
                    if (error) console.error('Error adding credits:', error);
                }

                // --- CLIPPEUR / AFFILIATE SYSTEM ---
                try {
                    const { data: profileAff } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
                    if (profileAff && profileAff.referred_by) {
                        const amountTotal = session.amount_total || 0;
                        const earnings = Math.round(amountTotal * 0.30);
                        if (earnings > 0) {
                            await supabaseAdmin.from('affiliate_earnings').insert({
                                clippeur_id: profileAff.referred_by,
                                buyer_id: userId,
                                amount_total: amountTotal,
                                earnings: earnings
                            });
                        }
                    }
                } catch (affiliateErr) {
                    console.error('Failed processing affiliate logic:', affiliateErr);
                }
                // -----------------------------------

                // --- CONFIRMATION EMAIL ---
                try {
                    const userEmail = session.customer_details?.email || session.customer_email;
                    if (userEmail) {
                        const isSubscription = session.mode === 'subscription';
                        const amountEur = ((session.amount_total || 0) / 100).toFixed(2);

                        const planLabels: Record<string, string> = {
                            plus: 'Plus',
                            pro: 'Pro',
                            studio: 'Studio',
                            launch_weekly_trial: 'Weekly (3 jours gratuits)',
                            launch_lifetime: 'Lifetime'
                        };
                        const planLabel = planLabels[planId] || planId || 'Tattoo Vision';

                        const subject = isSubscription
                            ? `Bienvenue sur Tattoo Vision ${planLabel} ! 🎨`
                            : `Votre achat Tattoo Vision est confirmé ! 🎨`;

                        const html = isSubscription ? `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 40px auto; background: #111; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
  <div style="background: linear-gradient(135deg, #0091FF, #00DC82); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🎨 Tattoo Vision</h1>
  </div>
  <div style="padding: 40px;">
    <h2 style="color: #fff; font-size: 22px; margin-top: 0;">Votre abonnement est actif !</h2>
    <p style="color: #999; line-height: 1.6;">Merci pour votre confiance. Votre abonnement <strong style="color: #0091FF;">${planLabel}</strong> est maintenant actif.</p>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #333;">
      <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Montant débité</p>
      <p style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">${amountEur} €</p>
    </div>
    <p style="color: #999; line-height: 1.6;">Vous pouvez gérer votre abonnement à tout moment depuis votre profil dans l'application.</p>
    <a href="https://tattoo-vision.com" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #0091FF, #00DC82); color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">Ouvrir l'app</a>
  </div>
  <div style="padding: 24px 40px; border-top: 1px solid #222; text-align: center;">
    <p style="color: #555; font-size: 12px; margin: 0;">Tattoo Vision · Pour toute question : support@tattoo-vision.com</p>
  </div>
</div>
</body></html>` : `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 40px auto; background: #111; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
  <div style="background: linear-gradient(135deg, #0091FF, #00DC82); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🎨 Tattoo Vision</h1>
  </div>
  <div style="padding: 40px;">
    <h2 style="color: #fff; font-size: 22px; margin-top: 0;">Achat confirmé !</h2>
    <p style="color: #999; line-height: 1.6;">Merci pour votre achat. Vos <strong style="color: #00DC82;">${credits} Vision Points</strong> ont été ajoutés à votre compte.</p>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #333;">
      <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Montant débité</p>
      <p style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">${amountEur} €</p>
    </div>
    <a href="https://tattoo-vision.com" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #0091FF, #00DC82); color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">Utiliser mes points</a>
  </div>
  <div style="padding: 24px 40px; border-top: 1px solid #222; text-align: center;">
    <p style="color: #555; font-size: 12px; margin: 0;">Tattoo Vision · Pour toute question : support@tattoo-vision.com</p>
  </div>
</div>
</body></html>`;

                        await sendEmail(userEmail, subject, html);
                    }
                } catch (emailErr) {
                    console.error('[EMAIL] Failed to send confirmation email:', emailErr);
                }
                // -----------------------------------

                if (session.mode === 'subscription') {
                    await supabaseAdmin.rpc('track_event', {
                        p_user_id: userId, p_event_name: 'trial_started', p_session_id: 'stripe_webhook',
                        p_device: 'desktop', p_properties: { source: 'stripe_checkout' }
                    });
                }
            }
        }

        if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
            const subscription = event.data.object as any;
            let userId = subscription.metadata?.userId;

            if (!userId) {
                const customer = await stripe.customers.retrieve(subscription.customer as string);
                if (!customer.deleted) {
                    userId = (customer as Stripe.Customer).metadata?.userId;
                }
            }

            if (userId) {
                const status = subscription.status;
                const entitled = status === 'trialing' || status === 'active';
                const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
                const currentPeriodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

                const dbUpdates: any = {
                    subscription_status: status,
                    entitled: entitled,
                    trial_ends_at: trialEndsAt,
                    current_period_ends_at: currentPeriodEndsAt,
                    stripe_customer_id: subscription.customer,
                    stripe_subscription_id: subscription.id
                };

                // Also update plan field if it's in the metadata
                const subPlan = subscription.metadata?.plan;
                if (subPlan) dbUpdates.plan = subPlan;
                // If subscription is deleted/canceled, reset plan to free
                if (event.type === 'customer.subscription.deleted') dbUpdates.plan = 'free';

                const { error } = await supabaseAdmin.from('profiles').update(dbUpdates).eq('id', userId);
                if (error) console.error('Error updating subscription entitlement:', error);
                else console.log(`[SUBSCRIPTION EVENT] Updated user ${userId} to entitled=${entitled} (status: ${status}, plan: ${subPlan || 'unchanged'})`);

                // Track cancellations
                const isCancellationEvent = event.type === 'customer.subscription.deleted' ||
                    (event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end === true && !event.data.previous_attributes?.cancel_at_period_end);

                if (isCancellationEvent) {
                    await supabaseAdmin.rpc('track_event', {
                        p_user_id: userId, p_event_name: 'subscription_cancelled', p_session_id: 'stripe_webhook', p_device: 'desktop',
                        p_properties: { status: subscription.status, reason: 'user_cancelled', stripe_sub_id: subscription.id }
                    });
                }
            }
        }

        if (event.type === 'invoice.paid') {
            const invoice = event.data.object as any;
            if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
                const amountPaid = invoice.amount_paid; // in cents

                // Only grant 2500 VP if they actually paid (not a trial/free invoice)
                if (amountPaid > 0) {
                    const customerId = invoice.customer as string;
                    let userId = invoice.subscription_details?.metadata?.userId;

                    if (!userId) {
                        try {
                            const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
                            if (profile) userId = profile.id;
                        } catch (e) {
                            console.error('Could not fetch user ID for invoice', e);
                        }
                    }

                    if (userId) {
                        const creditsToGrant = 2500;
                        const { error } = await supabaseAdmin.rpc('add_credits', {
                            p_user_id: userId,
                            p_amount: creditsToGrant,
                            p_type: 'subscription_renewal',
                            p_description: `Subscription renewal payment: ${invoice.id}`
                        });

                        if (error) {
                            console.error('Error adding subscription credits:', error);
                        } else {
                            console.log(`[INVOICE PAID] Granted ${creditsToGrant} VP for renewal to user ${userId}`);
                        }

                        // --- CLIPPEUR / AFFILIATE SYSTEM ---
                        try {
                            const { data: profile } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
                            if (profile && profile.referred_by) {
                                const earnings = Math.round(amountPaid * 0.30); // 30% for the clippeur
                                if (earnings > 0) {
                                    await supabaseAdmin.from('affiliate_earnings').insert({
                                        clippeur_id: profile.referred_by,
                                        buyer_id: userId,
                                        amount_total: amountPaid,
                                        earnings: earnings
                                    });
                                }
                            }
                        } catch (affiliateErr) {
                            console.error('Failed processing affiliate logic for invoice:', affiliateErr);
                        }
                        // -----------------------------------
                    }
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
