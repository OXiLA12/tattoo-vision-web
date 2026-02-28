import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

interface GenerateTattooRequest {
  user_description: string;
  style: 'stencil' | 'realistic';
  request_id: string;
}

interface GeminiResult {
  imageData: string | null;
  error: string | null;
  debug: {
    modelVersion: string;
    finishReason?: string;
    responsePreview: string;
  };
}

async function callGemini(
  modelName: string,
  geminiApiKey: string,
  prompt: string
): Promise<GeminiResult> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

  const requestBody = {
    contents: [{
      parts: [
        {
          text: prompt
        }
      ]
    }],
    generationConfig: {
      responseModalities: ["image", "text"],
      temperature: 1.0,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseStatus = response.status;

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`${modelName} API error:`, errorData);

      let geminiError = errorData;
      try {
        const parsed = JSON.parse(errorData);
        geminiError = parsed.error?.message || errorData;
      } catch {
      }

      return {
        imageData: null,
        error: `API error (HTTP ${responseStatus}): ${geminiError}`,
        debug: {
          modelVersion: modelName,
          responsePreview: geminiError.substring(0, 500)
        }
      };
    }

    const result = await response.json();
    const resultString = JSON.stringify(result);

    if (!result.candidates || result.candidates.length === 0) {
      return {
        imageData: null,
        error: "No candidates returned",
        debug: {
          modelVersion: result.modelVersion || modelName,
          responsePreview: resultString.substring(0, 500)
        }
      };
    }

    // Robust Scanning of Candidates and Parts
    if (result.candidates && result.candidates.length > 0) {
      for (const candidate of result.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check inline_data.data OR inlineData.data
            const data = part.inline_data?.data || part.inlineData?.data;
            if (data) {
              return {
                imageData: data,
                error: null,
                debug: {
                  modelVersion: result.modelVersion || modelName,
                  finishReason: candidate.finishReason,
                  responsePreview: "Success"
                }
              };
            }
          }
        }
      }
    }

    const lastCandidate = result.candidates?.[0];
    return {
      imageData: null,
      error: "No image data in response",
      debug: {
        modelVersion: result.modelVersion || modelName,
        finishReason: lastCandidate?.finishReason,
        responsePreview: resultString.substring(0, 500)
      }
    };
  } catch (err) {
    return {
      imageData: null,
      error: `Fetch error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      debug: {
        modelVersion: modelName,
        responsePreview: "Network failure"
      }
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  // Global variables for safety
  let requestId: string | null = null;
  let creditsInitiated = false;

  // Use service role key for authentication
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader || "" } },
    auth: { persistSession: false }
  });

  try {
    if (!geminiApiKey) {
      throw new Error("Configuration error (API Key missing)");
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

    console.log("generate-tattoo auth ok", { userId: user.id });


    const payload: GenerateTattooRequest = await req.json();
    requestId = payload.request_id;
    const { user_description, style } = payload;

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "request_id is required for idempotency" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_description || user_description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // 2. PLAN GATING - REMOVED (Access is open to all via credits)

    // 3. POINTS GATING
    const requiredPoints = 200; // AI Tattoo Creation: 200 VP (Updated)
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

    // 4. INITIATE VISION POINTS USAGE (Atomic & Idempotent)
    const { data: initData, error: initError } = await supabase.rpc('initiate_credit_usage', {
      p_user_id: user.id,
      p_amount: requiredPoints,
      p_request_id: requestId,
      p_description: 'Tattoo generation',
      p_feature: 'ai_creation'
    });

    if (initError) {
      console.error("Error initiating credits:", initError);
      throw new Error("Credit system unreachable");
    }

    if (!initData.ok) {
      return new Response(
        JSON.stringify({
          error: initData.error || "Credit initiation failed",
          feature: "AI_TATTOO_GENERATION",
          requiredPlan: "plus"
        }),
        {
          status: initData.error === 'PLAN_RESTRICTED' ? 403 : 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (initData.status === 'already_exists') {
      if (initData.type === 'debit_success') {
        return new Response(
          JSON.stringify({ error: "Cette requête a déjà été traitée avec succès." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    creditsInitiated = true;

    // 2. PREPARE PROMPT
    const variationId = Math.random().toString(36).substring(7);
    let fullPrompt = "";
    if (style === 'stencil') {
      fullPrompt = `You are a master tattoo artist designing a bespoke tattoo stencil.
      Client request: "${user_description}"
      Rules: 
      - Black ink only, Pure white background
      - No shading, clean and precise linework
      - Only the tattoo design, no skin or body parts
      - IMPORTANT: Create a highly detailed and strictly unique interpretation of the request. Do not use generic templates.
      Internal Variation ID: ${variationId}`;
    } else {
      fullPrompt = `You are a master tattoo artist creating a high-quality, bespoke tattoo design.
      Client request: "${user_description}"
      Rules:
      - Style: Realistic Tattoo Flash
      - Format: Digital illustration on PURE WHITE background
      - NO skin texture, NO paper texture, NO body parts
      - High contrast, detailed shading, sharp edges
      - IMPORTANT: Ensure the design is strictly unique and highly detailed.
      Internal Variation ID: ${variationId}`;
    }

    console.log(`[${requestId}] Generating tattoo...`);

    // 3. CALL AI
    let result = await callGemini("gemini-3-pro-image-preview", geminiApiKey, fullPrompt);

    // 4. FINALIZE (Success or Failure)
    if (result.imageData) {
      // SUCCESS: Confirm usage
      await supabase.rpc('confirm_credit_usage', { p_request_id: requestId });

      return new Response(
        JSON.stringify({ imageBase64: result.imageData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // FAILURE: Refund
      await supabase.rpc('refund_credit_usage', {
        p_request_id: requestId,
        p_description: result.error || 'AI generation failed'
      });
      creditsInitiated = false; // Prevents double refund in catch block

      return new Response(
        JSON.stringify({
          error: result.error || "Generation failed",
          debug: result.debug
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error(`[${requestId}] Critical error:`, error);

    // Safety Refund if credits were deducted but crash occurred
    if (creditsInitiated && requestId) {
      try {
        await supabase.rpc('refund_credit_usage', {
          p_request_id: requestId,
          p_description: `Server crash: ${error.message}`
        });
      } catch (refundErr) {
        console.error("Failed to refund during emergency cleanup:", refundErr);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
