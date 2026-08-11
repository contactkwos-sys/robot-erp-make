import { ok, fail } from "@/lib/api";
import { readStore } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readStore();
  if (!store.robot_projects.find((p) => p.id === id)) return fail("Project not found", 404);
  return ok(store.wiring_connections.filter((w) => w.project_id === id));
}
