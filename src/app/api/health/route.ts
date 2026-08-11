import { ok, fail } from "@/lib/api";
import { checkDatabaseHealth } from "@/lib/db/health";
import {
  getActiveDataBackend,
  getStoreWarning,
  isDatabaseSetupRequired,
  readStore,
} from "@/lib/db/store";
import { isServerlessRuntime, isSupabaseConfigured } from "@/lib/supabase/client";

/** Lightweight readiness + database schema check for Netlify / monitoring. */
export async function GET() {
  try {
    const backend = await getActiveDataBackend();
    const store = await readStore();
    const db = await checkDatabaseHealth(store);

    return ok({
      status: db.setup_required ? "setup_required" : db.ok ? "ok" : "degraded",
      backend,
      supabase_configured: isSupabaseConfigured(),
      serverless: isServerlessRuntime(),
      projects: store.robot_projects.length,
      database_setup_required: db.setup_required || isDatabaseSetupRequired(),
      warning: getStoreWarning() || (db.setup_required ? db.message : null),
      database: db,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: db.supabase_url_set,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: db.anon_key_set,
        SUPABASE_SERVICE_ROLE_KEY: db.service_role_key_set,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Health check failed", 500);
  }
}
