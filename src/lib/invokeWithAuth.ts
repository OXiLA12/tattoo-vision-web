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
    body?: any;
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: options.body,
    method: options.method as any,
  });

  if (error) {
    // Supabase client can return a 'FunctionsHttpError' etc.
    throw error;
  }

  return { data: data as T, error: null };
} catch (e: any) {
  console.error(`Error invoking function ${functionName}:`, e);
  return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
}
}
