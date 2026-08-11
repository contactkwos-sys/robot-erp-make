import { ok } from "@/lib/api";
import { readStore } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readStore();
  const checks = store.engineering_checks
    .filter((e) => e.project_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return ok(checks[0] || null);
}
