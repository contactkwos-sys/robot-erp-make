import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function isServerlessRuntime() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.VERCEL ||
      process.env.NEXT_RUNTIME === "edge"
  );
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Prefer service role on the server so Netlify can read/write without a user session. */
export function createServiceSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServerSupabaseClient(): SupabaseClient | null {
  return createServiceSupabaseClient() || createBrowserSupabaseClient();
}

export type DataBackend = "supabase" | "local" | "memory";

/**
 * Production/Netlify must use Supabase.
 * Local JSON is only for writable developer machines.
 * Memory is a last-resort non-persistent fallback (never mkdir on serverless).
 */
export function getDataBackend(): DataBackend {
  if (isSupabaseConfigured()) return "supabase";
  if (isServerlessRuntime()) return "memory";
  return "local";
}
