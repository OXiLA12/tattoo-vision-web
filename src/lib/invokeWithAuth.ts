import { supabase } from "./supabaseClient";

/**
 * invokeWithAuth
 *  - Always sends the logged-in user's access_token as:
 *      Authorization: Bearer <access_token>
 *  - Uses direct fetch to avoid Supabase client sometimes overriding Authorization.
 */
export async function invokeWithAuth<T>(
  functionName: string,
  options: {
    body?: unknown;
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("No active session (user not logged in).");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
    }

    const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;

    const res = await fetch(url, {
      method: options.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg =
        (json && (json.error || json.message)) ||
        `Edge Function ${functionName} returned ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : String(msg));
    }

    return { data: json as T, error: null };
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
