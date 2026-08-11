import { ok, fail, parseJson } from "@/lib/api";
import {
  getActiveDataBackend,
  getDemoUserId,
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
    return ok({
      user,
      backend,
      preferred_backend: getDataBackend(),
      ai_provider: process.env.AI_PROVIDER || "mock",
      supabase_configured: isSupabaseConfigured(),
      serverless: isServerlessRuntime(),
      persistence_note:
        backend === "supabase"
          ? "Using Supabase persistent store."
          : backend === "local"
            ? "Using local JSON file store (development only)."
            : "Using in-memory store (data resets on cold start). Configure Supabase for Netlify.",
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load settings", 500);
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
