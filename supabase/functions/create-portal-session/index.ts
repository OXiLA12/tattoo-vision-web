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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const json = (status: number, data: any) => new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
      return json(500, { ok: false, error: "Configuration missing" });
    }

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return json(401, { ok: false, error: "MISSING_AUTH" });
    }
    const token = auth.slice("Bearer ".length);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { ok: false, error: "INVALID_TOKEN", details: userErr?.message });
    }

    const user = userData.user;

    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const returnUrl = body.returnUrl || 'https://tattoovision.ai';

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let customerId;

    // We fetch the customer explicitely from our DB, which is 100% reliable
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    }

    if (!customerId) {
      // Fallback pour les vieux comptes
      try {
        const subscriptions = await stripe.subscriptions.search({
          query: `metadata['userId']:'${user.id}'`,
          limit: 1,
        });
        if (subscriptions.data.length > 0) {
          customerId = subscriptions.data[0].customer as string;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!customerId) {
      // 2. Chercher par email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (!customerId) {
      // 3. Dernier recours: on crée un client temporaire
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = newCustomer.id;
    }

    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
    } catch (createPortalErr: any) {
      console.error("Portal creation failed with customerId:", customerId, createPortalErr);

      // If customer doesn't exist or is invalid, create a fallback customer
      if (createPortalErr.message?.includes('No such customer') || createPortalErr.message?.includes('Invalid customer')) {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });

        // Try again with the pristine customer
        session = await stripe.billingPortal.sessions.create({
          customer: newCustomer.id,
          return_url: returnUrl,
        });

        // Update profile to fix the broken reference
        await admin.from('profiles').update({ stripe_customer_id: newCustomer.id }).eq('id', user.id);
      } else {
        throw createPortalErr;
      }
    }

    return json(200, { url: session.url });

  } catch (error) {
    console.error("Error creating portal session:", error);
    return json(500, { ok: false, error: (error as any).message || "Failed to create portal session" });
  }
});
