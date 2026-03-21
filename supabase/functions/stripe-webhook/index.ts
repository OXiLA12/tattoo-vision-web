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

        // ── IDEMPOTENCY CHECK (non-fatal if table missing) ────────────────
        let alreadyProcessed = false;
        try {
            const { error: insertError } = await supabaseAdmin
                .from('processed_stripe_events')
                .insert({ event_id: stripeEventId, created_at: new Date().toISOString() });

            if (insertError) {
                if (insertError.code === '23505') {
                    // Duplicate event — already processed
                    console.log(`[IDEMPOTENCY] Event ${stripeEventId} already processed — skipping.`);
                    return new Response(JSON.stringify({ received: true, skipped: true }), {
                        status: 200,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
                // Table missing or other error → log but CONTINUE processing
                console.warn(`[IDEMPOTENCY] Warning (non-fatal): ${insertError.message} (code: ${insertError.code})`);
            }
        } catch (idempotencyErr) {
            console.warn('[IDEMPOTENCY] Check failed (non-fatal), continuing:', idempotencyErr);
        }
        // ──────────────────────────────────────────────────────────────

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id || session.metadata?.userId;
            const planId = session.metadata?.plan || 'pro';

            if (userId) {
                const sessionType = session.metadata?.type;
                const packId = session.metadata?.pack;
                const packCredits = parseInt(session.metadata?.credits || '0', 10);

                // ── CREDIT PACK (one-time purchase) ──────────────────────
                if (sessionType === 'credit_pack' && packCredits > 0) {
                    await supabaseAdmin.rpc('add_credits', {
                        p_user_id: userId,
                        p_amount: packCredits,
                        p_type: 'purchase',
                        p_description: `Credit pack: ${packId} (${packCredits} credits)`,
                    });
                    console.log(`[CREDIT_PACK] Granted ${packCredits} credits to user ${userId} (pack: ${packId})`);

                    // ── PRO SUBSCRIPTION START ────────────────────────────────
                } else {
                    const updates: any = {
                        free_trial_used: true,
                        entitled: true,
                        plan: 'pro',
                        subscription_status: 'trialing',
                    };
                    if (session.customer) updates.stripe_customer_id = session.customer;
                    if (session.subscription) updates.stripe_subscription_id = session.subscription;

                    const { error: profileUpdateError } = await supabaseAdmin
                        .from('profiles').update(updates).eq('id', userId);

                    if (profileUpdateError) {
                        console.error(`[CHECKOUT] CRITICAL: profile update failed for ${userId}:`, profileUpdateError.message);
                    } else {
                        console.log(`[CHECKOUT] User ${userId} → entitled=true, plan=pro, status=trialing`);
                    }

                    // Grant initial 2000 credits (non-fatal if fails)
                    try {
                        await supabaseAdmin.rpc('add_credits', {
                            p_user_id: userId,
                            p_amount: 2000,
                            p_type: 'purchase',
                            p_description: 'Pro subscription start — 2000 credits',
                        });
                        console.log(`[CHECKOUT] 2000 credits granted to ${userId}`);
                    } catch (creditsErr) {
                        console.warn(`[CHECKOUT] Credits grant failed (non-fatal) for ${userId}:`, creditsErr);
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
                            } else {
                                // Free trial start — track in affiliate_trials
                                const { error: trialInsertErr } = await supabaseAdmin.from('affiliate_trials').insert({
                                    clippeur_id: profileAff.referred_by,
                                    buyer_id: userId,
                                    plan: 'pro',
                                    converted: false
                                });
                                if (trialInsertErr) console.error('[AFFILIATE] Failed to insert trial:', trialInsertErr);
                            }
                        }
                    } catch (affiliateErr) {
                        console.error('Failed processing affiliate logic:', affiliateErr);
                    }
                    // -----------------------------------

                    // --- CONFIRMATION EMAIL ---
                    try {
                        const userEmail = session.customer_details?.email || (session as any).customer_email;
                        if (userEmail) {
                            const subject = `Bienvenue dans Tattoo Vision Pro 🎨`;
                            const renewalDate = new Date();
                            renewalDate.setDate(renewalDate.getDate() + 3);
                            const renewalDateStr = renewalDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                            const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0;">
<div style="max-width: 560px; margin: 40px auto; background: #111; border-radius: 24px; overflow: hidden; border: 1px solid #222;">
  <div style="background: linear-gradient(135deg, #0091FF, #00DC82); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🎨 Tattoo Vision Pro</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Accès illimité activé ✅</p>
  </div>
  <div style="padding: 40px;">
    <h2 style="color: #fff; font-size: 22px; margin-top: 0;">Bienvenue dans l'expérience Pro !</h2>
    <p style="color: #999; line-height: 1.6;">Votre essai gratuit de 3 jours est maintenant actif. Profitez de toutes les fonctionnalités sans limitation.</p>
    <div style="background: #1a1a1a; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #333;">
      <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Premier débit le</p>
      <p style="margin: 0; color: #fff; font-size: 20px; font-weight: 700;">${renewalDateStr} · 9,99 €</p>
    </div>
    <p style="color: #666; font-size: 12px; line-height: 1.6;">Vous pouvez annuler à tout moment depuis votre profil. Sans annulation, l'abonnement se renouvelle automatiquement à 9,99€/semaine.</p>
    <a href="https://tattoovisionapp.com" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: linear-gradient(135deg, #0091FF, #00DC82); color: white; text-decoration: none; border-radius: 12px; font-weight: 700;">Ouvrir l'app →</a>
  </div>
  <div style="padding: 24px 40px; border-top: 1px solid #222; text-align: center;">
    <p style="color: #555; font-size: 12px; margin: 0;">Tattoo Vision · support@tattoo-vision.com</p>
  </div>
</div>
</body></html>`;

                            await sendEmail(userEmail, subject, html);
                        }
                    } catch (emailErr) {
                        console.error('[EMAIL] Failed to send confirmation email:', emailErr);
                    }

                    await supabaseAdmin.rpc('track_event', {
                        p_user_id: userId, p_event_name: 'trial_started', p_session_id: 'stripe_webhook',
                        p_device: 'desktop', p_properties: { source: 'stripe_checkout', plan: 'pro' }
                    });
                } // end else (subscription start)
            } // end if userId
        } // end checkout.session.completed

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
                // ⚠️ Revoke immediately on cancellation: cancel_at_period_end=true means the user
                // has chosen to cancel — we cut access right away, no grace period.
                const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
                // Only 'trialing' and 'active' grant access.
                // 'past_due' and 'unpaid' are payment failure states — no access.
                // 'canceled', 'incomplete', 'incomplete_expired', 'paused' — no access.
                const entitled = (status === 'trialing' || status === 'active') && !cancelAtPeriodEnd;
                const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
                const currentPeriodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

                const dbUpdates: any = {
                    subscription_status: cancelAtPeriodEnd ? 'canceled' : status,
                    entitled: entitled,
                    trial_ends_at: trialEndsAt,
                    current_period_ends_at: currentPeriodEndsAt,
                    stripe_customer_id: subscription.customer,
                    stripe_subscription_id: subscription.id
                };

                // Always set plan based on subscription status:
                // - trialing or active → 'pro' (we only have one paid plan)
                // - deleted/canceled → 'free'
                // Metadata plan takes precedence if set, otherwise we infer from status.
                const subPlan = subscription.metadata?.plan;
                if (event.type === 'customer.subscription.deleted') {
                    dbUpdates.plan = 'free';
                } else if (subPlan) {
                    dbUpdates.plan = subPlan;
                } else if (status === 'trialing' || status === 'active') {
                    // Fallback: trialing/active subscription without plan metadata → must be pro
                    dbUpdates.plan = 'pro';
                }

                // --- RACE CONDITION FIX ---
                // If it's a deleted event, we ONLY want to override the profile if the currently active 
                // subscription in the DB is the EXACT SAME ONE as the one being deleted.
                // Otherwise, it might be an old subscription being canceled during an upgrade.
                let shouldApplyUpdates = true;
                if (event.type === 'customer.subscription.deleted') {
                    const { data: existingProfile } = await supabaseAdmin.from('profiles').select('stripe_subscription_id').eq('id', userId).single();
                    if (existingProfile && existingProfile.stripe_subscription_id !== subscription.id && existingProfile.stripe_subscription_id != null) {
                        console.log(`[SUBSCRIPTION EVENT] Ignoring deleted event for old subscription ${subscription.id} because user is now on ${existingProfile.stripe_subscription_id}`);
                        shouldApplyUpdates = false;
                    }
                }

                if (shouldApplyUpdates) {
                    const { error } = await supabaseAdmin.from('profiles').update(dbUpdates).eq('id', userId);
                    if (error) console.error('Error updating subscription entitlement:', error);
                    else console.log(`[SUBSCRIPTION EVENT] Updated user ${userId} to entitled=${entitled} (status: ${status}, plan: ${subPlan || 'unchanged'})`);
                }

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
            // On renewal (subscription_cycle), ensure entitled stays true
            if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
                const amountPaid = invoice.amount_paid;
                if (amountPaid > 0) {
                    const customerId = invoice.customer as string;
                    let userId = invoice.subscription_details?.metadata?.userId;

                    if (!userId) {
                        try {
                            const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
                            if (profile) userId = profile.id;
                        } catch (e) { console.error('Could not fetch user ID for invoice', e); }
                    }

                    if (userId) {
                        // Re-activate entitlement (safety net in case it was set to false)
                        await supabaseAdmin.from('profiles').update({
                            entitled: true,
                            plan: 'pro',
                            subscription_status: 'active',
                        }).eq('id', userId);

                        // Grant 2000 credits every week on renewal
                        if (invoice.billing_reason === 'subscription_cycle') {
                            await supabaseAdmin.rpc('add_credits', {
                                p_user_id: userId,
                                p_amount: 2000,
                                p_type: 'purchase',
                                p_description: `Weekly Pro renewal — 2000 credits (invoice: ${invoice.id})`,
                            });
                            console.log(`[INVOICE PAID] Granted 2000 weekly credits to user ${userId}`);
                        }

                        console.log(`[INVOICE PAID] User ${userId} confirmed active Pro (amount: ${amountPaid}¢)`);

                        // --- CLIPPEUR / AFFILIATE SYSTEM ---
                        try {
                            const { data: profile } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
                            if (profile && profile.referred_by) {
                                const earnings = Math.round(amountPaid * 0.30);
                                if (earnings > 0) {
                                    await supabaseAdmin.from('affiliate_earnings').insert({
                                        clippeur_id: profile.referred_by,
                                        buyer_id: userId,
                                        amount_total: amountPaid,
                                        earnings: earnings
                                    });
                                    if (invoice.billing_reason === 'subscription_create') {
                                        await supabaseAdmin.from('affiliate_trials')
                                            .update({ converted: true })
                                            .eq('clippeur_id', profile.referred_by)
                                            .eq('buyer_id', userId)
                                            .eq('converted', false);
                                    }
                                }
                            }
                        } catch (affiliateErr) { console.error('Failed processing affiliate logic for invoice:', affiliateErr); }
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
