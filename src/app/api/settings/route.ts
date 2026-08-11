import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { getDataBackend } from "@/lib/supabase/client";

export async function GET() {
  const store = await readStore();
  const user = store.users.find((u) => u.id === getDemoUserId());
  return ok({
    user,
    backend: getDataBackend(),
    ai_provider: process.env.AI_PROVIDER || "mock",
    supabase_configured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<{ beginner_mode?: boolean; theme?: "light" | "dark" | "system"; full_name?: string }>(
      request
    );
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
