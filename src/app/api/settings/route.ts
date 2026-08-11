import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, getRuntimeMode, nowIso, readStore, updateStore } from "@/lib/db/store";

export async function GET() {
  try {
    const store = await readStore();
    const user = store.users.find((u) => u.id === getDemoUserId());
    const mode = getRuntimeMode();
    return ok({
      user,
      ...mode,
      message: mode.demo_mode
        ? "DEMO MODE — app is fully usable without Supabase or AI API keys."
        : "Connected mode",
    });
  } catch (e) {
    // Never blank the app if settings fail — return safe demo defaults
    return ok({
      user: null,
      demo_mode: true,
      backend: "local",
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
