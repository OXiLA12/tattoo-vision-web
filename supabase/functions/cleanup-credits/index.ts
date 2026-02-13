import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseServiceKey) {
            throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        console.log("Running cleanup for pending credits...");
        const { data, error } = await supabaseAdmin.rpc('cleanup_pending_credits');

        if (error) {
            console.error("Cleanup error:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        console.log(`Cleaned up ${data?.length || 0} pending transactions.`);

        return new Response(JSON.stringify({
            ok: true,
            cleaned: data?.length || 0,
            requests: data
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Critical error in cleanup-credits:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
