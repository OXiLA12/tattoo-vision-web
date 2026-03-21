import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

interface RequestBody {
  imageBase64: string;
  request_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization");
  const REMOVEBG_API_KEY = Deno.env.get("REMOVEBG_API_KEY");

  let requestId: string | null = null;
  let creditsInitiated = false;

  // Use service role key for authentication
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader || "" } },
    auth: { persistSession: false }
  });

  try {
    if (!REMOVEBG_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "SERVER_MISCONFIG", details: "RemoveBG API Key missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!authHeader && !user) {
      console.error("401: No auth header and no user found via getUser()");
      return new Response(
        JSON.stringify({ ok: false, error: "MISSING_AUTH", details: "No authorization header or user session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      console.error("401: Unauthorized - User error:", userError?.message);
      return new Response(
        JSON.stringify({ ok: false, error: "UNAUTHORIZED", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("remove-background auth ok", { userId: user.id });


    const payload: RequestBody = await req.json();
    requestId = payload.request_id;
    const { imageBase64 } = payload;

    if (!requestId) {
      return new Response(JSON.stringify({ error: "request_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Image is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. FETCH USER STATUS (Plan and Points)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const userPoints = userCredits?.credits || 0;

    console.log(`[${requestId}] User: ${user.id}, Plan: ${userPlan}, Points: ${userPoints}`);

    // 2. PLAN GATING - REMOVED (Access is open)

    // 3. POINTS GATING
    const requiredPoints = 50; // Background Removal: 50 VP
    if (userPoints < requiredPoints) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "INSUFFICIENT_POINTS",
          balance: userPoints,
          requiredPoints
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. INITIATE VISION POINTS USAGE (Atomic)
    const { data: initData, error: initError } = await supabase.rpc('initiate_credit_usage', {
      p_user_id: user.id,
      p_amount: requiredPoints,
      p_request_id: requestId,
      p_description: 'Background removal',
      p_feature: 'bg_removal'
    });

    if (initError || !initData.ok) {
      return new Response(
        JSON.stringify({
          error: initError?.message || initData?.error || "Credit initiation failed",
          feature: "REMOVE_BACKGROUND",
          requiredPlan: "plus"
        }),
        {
          status: initData?.error === 'PLAN_RESTRICTED' ? 403 : 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (initData.status === 'already_exists' && initData.type === 'debit_success') {
      return new Response(JSON.stringify({ error: "Already processed" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    creditsInitiated = true;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    const imageBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
    const blob = new Blob([imageBytes], { type: 'image/png' });
    formData.append('image_file', blob);
    formData.append('size', 'auto');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': REMOVEBG_API_KEY },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      await supabase.rpc('refund_credit_usage', { p_request_id: requestId, p_description: `Remove.bg error: ${errorText}` });
      creditsInitiated = false;
      return new Response(JSON.stringify({ error: "Failed to remove background" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resultArrayBuffer = await removeBgResponse.arrayBuffer();

    // Convert ArrayBuffer to base64 without stack overflow
    const bytes = new Uint8Array(resultArrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const resultBase64 = btoa(binary);

    // SUCCESS
    await supabase.rpc('confirm_credit_usage', { p_request_id: requestId });

    return new Response(JSON.stringify({ imageBase64: resultBase64 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (creditsInitiated && requestId) {
      await supabase.rpc('refund_credit_usage', { p_request_id: requestId, p_description: `Function crash: ${error.message}` });
    }
    return new Response(JSON.stringify({ error: "An unexpected error occurred.", details: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
