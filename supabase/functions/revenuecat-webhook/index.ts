import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const REVENUECAT_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
    try {
        // 1. Authorization
        const authHeader = req.headers.get('Authorization')
        if (authHeader !== REVENUECAT_SECRET) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        // 2. Parse Event
        const { event } = await req.json()
        if (!event) return new Response('No event', { status: 400 })

        const type = event.type
        const userId = event.app_user_id
        const productId = event.product_id?.toLowerCase() || ''

        console.log(`Received event: ${type} for user: ${userId} product: ${productId}`)

        // 3. Handle Events
        if (['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE'].includes(type)) {

            // -- CREDIT PACKS --
            let creditsToAdd = 0
            if (productId.includes('3000')) creditsToAdd = 3000;
            else if (productId.includes('7000')) creditsToAdd = 7000;
            else if (productId.includes('15000')) creditsToAdd = 15000;
            else if (productId.includes('40000')) creditsToAdd = 40000;

            // Legacy / Fallback
            else if (productId.includes('small') || productId.includes('starter')) creditsToAdd = 10;
            else if (productId.includes('medium') || productId.includes('creator')) creditsToAdd = 50;
            else if (productId.includes('large') || productId.includes('pro_pack')) creditsToAdd = 100;

            if (creditsToAdd > 0) {
                // Add credits
                const { error } = await supabase.rpc('add_credits', {
                    user_id: userId,
                    amount_to_add: creditsToAdd,
                    t_type: 'purchase',
                    desc: `Mobile Purchase: ${productId}`
                })
                if (error) throw error
                console.log(`Added ${creditsToAdd} credits to ${userId}`)
            }

            // -- SUBSCRIPTIONS --
            // Map RevenueCat package identifiers to plan names
            // Expected identifiers: monthly_plus, monthly_pro, monthly_studio
            let newPlan = ''
            const packageId = event.entitlement_id?.toLowerCase() || productId;

            console.log(`Package ID: ${packageId}, Entitlement ID: ${event.entitlement_id}`)

            // Check entitlement_id first (more reliable), then product_id
            if (packageId.includes('studio') || productId.includes('studio')) {
                newPlan = 'studio';
            } else if (packageId.includes('pro') && !packageId.includes('pack')) {
                newPlan = 'pro';
            } else if (packageId.includes('plus')) {
                newPlan = 'plus';
            }

            if (newPlan) {
                // Calculate next reset date (1 month from now)
                const nextReset = new Date();
                nextReset.setMonth(nextReset.getMonth() + 1);

                // Update Plan and sync points
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        plan: newPlan,
                        subscription_status: 'active',
                        entitled: true,
                        subscription_period_end: event.expiration_at_ms
                            ? new Date(event.expiration_at_ms).toISOString()
                            : null,
                        next_reset_at: nextReset.toISOString()
                    })
                    .eq('id', userId)

                if (updateError) throw updateError

                // Sync user's monthly points based on new plan
                const { error: syncError } = await supabase.rpc('sync_user_plan_points', {
                    p_user_id: userId
                })

                if (syncError) {
                    console.error('Error syncing points:', syncError)
                    // Don't throw - plan update succeeded
                }

                console.log(`Updated plan to ${newPlan} for ${userId}, synced points`)
            }
        }

        // Handle Cancellations / Expirations
        if (['CANCELLATION', 'EXPIRATION'].includes(type)) {
            // Ideally revert to free, but complex logic if they have overlapping subs.
            // For now, let's just log it. A robust system checks 'entitlement' status from RevenueCat API directly.
            console.log("Subscription expired/cancelled for", userId)

            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'canceled',
                    entitled: false,
                    plan: 'free'
                })
                .eq('id', userId)
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
