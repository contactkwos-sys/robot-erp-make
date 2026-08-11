import { ok, fail, parseJson } from "@/lib/api";
import {
  getActiveDataBackend,
  getDemoUserId,
  getRuntimeMode,
  nowIso,
  readStore,
  updateStore,
} from "@/lib/db/store";
import { getDataBackend, isServerlessRuntime, isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  try {
    const backend = await getActiveDataBackend();
    const store = await readStore();
    const user = store.users.find((u) => u.id === getDemoUserId());
    const mode = getRuntimeMode();
    return ok({
      user,
      ...mode,
      backend,
      preferred_backend: getDataBackend(),
      persistence_note:
        backend === "supabase"
          ? "Using Supabase persistent store."
          : backend === "local"
            ? "Using local JSON file store (development only)."
            : backend === "tmp"
              ? "Using /tmp store on this serverless instance (configure Supabase for durable Netlify data)."
              : "Using in-memory store (data resets on cold start). Configure Supabase for Netlify.",
      message: mode.demo_mode
        ? "DEMO MODE — app is fully usable without Supabase or AI API keys."
        : "Connected mode",
      serverless: isServerlessRuntime(),
      supabase_configured: isSupabaseConfigured(),
    });
  } catch (e) {
    // Never blank the app if settings fail — return safe demo defaults
    return ok({
      user: null,
      demo_mode: true,
      backend: "memory",
      persistence: "memory",
      ai_provider: "mock",
      supabase_configured: false,
      serverless: true,
      message: "DEMO MODE — using safe defaults.",
      warning: e instanceof Error ? e.message : "Settings load failed",
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<{
      beginner_mode?: boolean;
      theme?: "light" | "dark" | "system";
      full_name?: string;
    }>(request);
    await updateStore((store) => {
      const user = store.users.find((u) => u.id === getDemoUserId());
      if (!user) throw new Error("User not found");
      if (body.beginner_mode !== undefined) user.beginner_mode = body.beginner_mode;
      if (body.theme) user.theme = body.theme;
      if (body.full_name) user.full_name = body.full_name;
      user.updated_at = nowIso();
    });
    const store = await readStore();
    return ok(store.users.find((u) => u.id === getDemoUserId()));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Settings update failed", 500);
  }
}
