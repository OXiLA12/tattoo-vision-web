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

    // Chercher le client Stripe par son email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;

    if (customers.data.length === 0) {
      // Create a customer if one doesn't exist yet, so they can at least access the portal (e.g., to add a card)
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = newCustomer.id;
    } else {
      customerId = customers.data[0].id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return json(200, { url: session.url });

  } catch (error) {
    console.error("Error creating portal session:", error);
    return json(500, { ok: false, error: (error as any).message || "Failed to create portal session" });
  }
});
