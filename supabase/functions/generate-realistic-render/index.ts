import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROMPT = `You are given an image of a person with a tattoo already placed on the skin.

Your task is to make the tattoo look naturally integrated and photorealistic.

Guidelines:
- Keep the tattoo clearly recognizable and faithful to the original.
- Do not significantly change its design, size, position, or rotation.
- Do not modify the body pose or overall composition.

Improve realism by:
- blending tattoo edges into the skin
- matching skin texture
- matching lighting and shadows
- making the tattoo look like real ink under the skin

Keep the same overall composition.
Output a photorealistic IMAGE.`;

interface GeminiResult {
  imageData: string | null;
  error: string | null;
  status: number;
  finishReason?: string;
  finishMessage?: string;
  responsePreview: string;
}

async function callGemini(
  modelName: string,
  geminiApiKey: string,
  cleanBase64: string,
  prompt: string,
  attempt: number
): Promise<GeminiResult> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/png",
            data: cleanBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    console.log(`[Attempt ${attempt}] Calling ${modelName}...`);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const status = response.status;
    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return {
        imageData: null,
        error: `API error (HTTP ${status}) - Invalid JSON`,
        status,
        responsePreview: responseText.substring(0, 1500)
      };
    }

    if (!response.ok) {
      return {
        imageData: null,
        error: result.error?.message || `API error (HTTP ${status})`,
        status,
        responsePreview: JSON.stringify(result).substring(0, 1500)
      };
    }

    if (result.candidates && result.candidates.length > 0) {
      for (const candidate of result.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            const data = part.inline_data?.data || part.inlineData?.data;
            if (data) {
              return {
                imageData: data,
                error: null,
                status,
                finishReason: candidate.finishReason,
                finishMessage: candidate.finishMessage,
                responsePreview: "Success"
              };
            }
          }
        }
      }
    }

    const lastCandidate = result.candidates?.[0];
    return {
      imageData: null,
      error: "No image was generated",
      status,
      finishReason: lastCandidate?.finishReason,
      finishMessage: lastCandidate?.finishMessage,
      responsePreview: JSON.stringify(result).substring(0, 1500)
    };

  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      imageData: null,
      error: isTimeout ? "Request timeout (30s)" : `Fetch error: ${err.message}`,
      status: isTimeout ? 408 : 0,
      responsePreview: isTimeout ? "The request to Gemini timed out after 30 seconds." : "Network failure"
    };
  }
}

Deno.serve(async (req: Request) => {
  const createJSONResponse = (body: any, status: number = 200) => {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  let requestId: string | null = null;
  let creditsInitiated = false;

  // Use service role key for authentication
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader || "" } },
    auth: { persistSession: false }
  });

  try {
    if (!geminiApiKey) {
      return createJSONResponse({ error: "Configuration missing (Gemini API Key)" }, 500);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!authHeader && !user) {
      console.error("401: No auth header and no user found via getUser()");
      return createJSONResponse({ ok: false, error: "MISSING_AUTH", details: "No authorization header or user session" }, 401);
    }

    if (!user) {
      console.error("401: Unauthorized - User error:", userError?.message);
      return createJSONResponse({ ok: false, error: "UNAUTHORIZED", details: userError?.message }, 401);
    }

    console.log("generate-realistic-render auth ok", { userId: user.id });


    const body = await req.json();
    requestId = body.request_id;
    const imageBase64 = body.imageBase64;

    if (!requestId) {
      return createJSONResponse({ error: "request_id is required" }, 400);
    }

    if (!imageBase64) {
      return createJSONResponse({ error: "Image is required" }, 400);
    }

    // 1. FETCH USER STATUS (Plan and Points)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, free_trial_used, free_realistic_render_used')
      .eq('id', user.id)
      .single();

    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    const userPlan = profile?.plan || 'free';
    const userPoints = userCredits?.credits || 0;
    // Check both potential trial columns for robustness
    const freeTrialUsed = profile?.free_realistic_render_used || profile?.free_trial_used || false;

    console.log(`[${requestId}] User: ${user.id}, Plan: ${userPlan}, Points: ${userPoints}, TrialUsed: ${freeTrialUsed}`);

    // 2. PLAN & POINTS GATING
    const requiredPoints = 500; // Updated to 500 VP

    // Check points regardless of plan
    if (userPoints < requiredPoints) {
      return createJSONResponse({
        ok: false,
        error: "INSUFFICIENT_POINTS",
        balance: userPoints,
        requiredPoints
      }, 402);
    }

    // 3. INITIATE VISION POINTS USAGE (Atomic)
    const { data: initData, error: initError } = await supabase.rpc('initiate_credit_usage', {
      p_user_id: user.id,
      p_amount: requiredPoints,
      p_request_id: requestId,
      p_description: 'Realistic render generation',
      p_feature: 'realistic_render'
    });

    if (initError || !initData.ok) {
      return createJSONResponse({
        error: initError?.message || initData?.error || "Credit initiation failed",
        feature: "REALISTIC_RENDER",
        requiredPlan: "plus"
      }, initData?.error === 'PLAN_RESTRICTED' ? 403 : 402);
    }

    if (initData.status === 'already_exists' && initData.type === 'debit_success') {
      return createJSONResponse({ error: "Already processed" }, 409);
    }

    creditsInitiated = true;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const modelName = "gemini-3-pro-image-preview";
    const attemptsLogs: any[] = [];
    let finalResult: GeminiResult | null = null;
    const backoffs = [0, 500, 1200];

    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, backoffs[i]));
      finalResult = await callGemini(modelName, geminiApiKey, cleanBase64, PROMPT, i + 1);

      attemptsLogs.push({
        attempt: i + 1,
        status: finalResult.status,
        finishReason: finalResult.finishReason,
        modelVersion: modelName
      });

      if (finalResult.imageData) break;
      if (![429, 500, 503, 504, 408, 200].includes(finalResult.status)) break;
    }

    if (finalResult?.imageData) {
      await supabase.rpc('confirm_credit_usage', { p_request_id: requestId });
      return createJSONResponse({ imageBase64: finalResult.imageData }, 200);
    } else {
      await supabase.rpc('refund_credit_usage', {
        p_request_id: requestId,
        p_description: finalResult?.error || 'All attempts failed'
      });
      creditsInitiated = false;
      return createJSONResponse({
        error: "No image was generated",
        debug: { attempts: attemptsLogs, lastResponsePreview: finalResult?.responsePreview }
      }, 200);
    }

  } catch (error: any) {
    if (creditsInitiated && requestId) {
      await supabase.rpc('refund_credit_usage', { p_request_id: requestId, p_description: `Function crash: ${error.message}` });
    }
    return createJSONResponse({ error: error.message || "An unexpected error occurred." }, 500);
  }
});
