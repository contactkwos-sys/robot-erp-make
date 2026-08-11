import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function anonKey() {
  // Prefer the public anon/publishable key for browser clients. Never use the service role here.
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

function serviceRoleKey() {
  // Server-only secret. Must never be prefixed with NEXT_PUBLIC_ or imported into client bundles.
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function getSupabaseEnvStatus() {
  return {
    url: Boolean(supabaseUrl()),
    anonKey: Boolean(anonKey()),
    serviceRoleKey: Boolean(serviceRoleKey()),
  };
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && (serviceRoleKey() || anonKey()));
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
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Prefer service role on the server so Netlify can read/write without a user session. */
export function createServiceSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be used in the browser.");
  }
  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServerSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    return createBrowserSupabaseClient();
  }
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
