import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    const json = (body: any, status = 200) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Verify admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
        return json({ error: "Admin only" }, 403);
    }

    const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    });

    try {
        // Fetch last 100 subscriptions (covers trials + actives)
        const subscriptions = await stripe.subscriptions.list({
            limit: 100,
            expand: ['data.customer', 'data.latest_invoice'],
        });

        // Fetch last 50 payment intents (one-time purchases)
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 50,
        });

        // Fetch last 100 checkout sessions (for context)
        const sessions = await stripe.checkout.sessions.list({
            limit: 100,
        });

        // Balance (revenue summary)
        const balance = await stripe.balance.retrieve();

        // Build subscription summary
        const subSummary = {
            trialing: 0,
            active: 0,
            canceled: 0,
            past_due: 0,
            incomplete: 0,
        };

        const subList = subscriptions.data.map((sub) => {
            // count statuses
            const s = sub.status as string;
            if (s in subSummary) (subSummary as any)[s]++;

            const customer = sub.customer as Stripe.Customer | null;
            const invoice = sub.latest_invoice as Stripe.Invoice | null;

            return {
                id: sub.id,
                status: sub.status,
                customer_email: customer?.email ?? null,
                customer_name: customer?.name ?? null,
                plan_name: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || '—',
                amount_cents: sub.items.data[0]?.price?.unit_amount ?? 0,
                currency: sub.items.data[0]?.price?.currency ?? 'eur',
                interval: sub.items.data[0]?.price?.recurring?.interval ?? '—',
                trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
                trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: sub.cancel_at_period_end,
                created: new Date(sub.created * 1000).toISOString(),
                metadata: sub.metadata,
                last_invoice_status: invoice?.status ?? null,
                last_invoice_amount: invoice?.amount_paid ?? 0,
            };
        });

        // Payment intents (one-time VP purchases)
        const piList = paymentIntents.data
            .filter(pi => pi.status === 'succeeded')
            .map(pi => ({
                id: pi.id,
                amount_cents: pi.amount,
                currency: pi.currency,
                status: pi.status,
                created: new Date(pi.created * 1000).toISOString(),
                description: pi.description,
                metadata: pi.metadata,
            }));

        // Session stats
        const sessionStats = {
            total: sessions.data.length,
            completed: sessions.data.filter(s => s.status === 'complete').length,
            expired: sessions.data.filter(s => s.status === 'expired').length,
            open: sessions.data.filter(s => s.status === 'open').length,
        };

        // Revenue from balance
        const availableEur = balance.available.find(b => b.currency === 'eur');
        const pendingEur = balance.pending.find(b => b.currency === 'eur');

        return json({
            subscriptions: subList,
            subscription_summary: subSummary,
            recent_payments: piList,
            session_stats: sessionStats,
            balance: {
                available_cents: availableEur?.amount ?? 0,
                pending_cents: pendingEur?.amount ?? 0,
                currency: 'eur',
            },
        });

    } catch (err: any) {
        console.error('Stripe error:', err.message);
        return json({ error: err.message }, 500);
    }
});
