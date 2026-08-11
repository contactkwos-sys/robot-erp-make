import { ok, fail } from "@/lib/api";
import { reserveProjectStock, syncProjectInventory } from "@/lib/db/inventory-logic";
import { readStore } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await syncProjectInventory(id);
    await reserveProjectStock(id);
    const store = await readStore();
    const project = store.robot_projects.find((p) => p.id === id);
    if (!project) return fail("Project not found", 404);
    return ok({
      project,
      components: store.project_components.filter((c) => c.project_id === id),
      purchases: store.purchase_items.filter((p) => p.project_id === id),
      message: "Required stock reserved. Missing items remain on purchase list.",
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Approve failed", 500);
  }
}
