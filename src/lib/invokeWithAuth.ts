import { supabase } from "./supabaseClient";

/**
 * invokeWithAuth
 *  - Retrieves the logged‑in user's access token and sends it as Authorization header.
 *  - Uses a direct fetch call to avoid Supabase SDK header conflicts.
 */
export async function invokeWithAuth<T>(functionName: string, options: {
  body?: any;
  method?: string;
  headers?: Record<string, string>;
} = {}): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/${functionName}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // apikey is required by Supabase Edge Function gateway (in addition to Authorization)
      ...(supabaseAnonKey ? { "apikey": supabaseAnonKey } : {}),
      ...(options.headers || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(`invokeWithAuth: No token for ${functionName}`);
    }

    const response = await fetch(url, {
      method: options.method ?? "POST",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = (result as any)?.error || `HTTP ${response.status}`;
      return { data: null, error: new Error(msg) };
    }
    return { data: result as T, error: null };
  } catch (e: any) {
    console.error(`Error invoking function ${functionName}:`, e);
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
