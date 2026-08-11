import { ok, fail } from "@/lib/api";
import { getActiveDataBackend, readStore } from "@/lib/db/store";
import { isServerlessRuntime, isSupabaseConfigured } from "@/lib/supabase/client";

/** Lightweight readiness check for Netlify / monitoring. */
export async function GET() {
  try {
    const backend = await getActiveDataBackend();
    const store = await readStore();
    return ok({
      status: "ok",
      backend,
      supabase_configured: isSupabaseConfigured(),
      serverless: isServerlessRuntime(),
      projects: store.robot_projects.length,
      warning:
        backend === "memory"
          ? "Configure Supabase env vars for persistent Netlify storage."
          : null,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Health check failed", 500);
  }
}
