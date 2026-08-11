import { ok, fail } from "@/lib/api";
import { recalculateProjectCost, syncProjectInventory } from "@/lib/db/inventory-logic";
import { readStore, updateStore } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await syncProjectInventory(id);
  await updateStore((store) => {
    recalculateProjectCost(store, id);
  });
  const store = await readStore();
  const cost = store.project_costs.find((c) => c.project_id === id);
  if (!cost) return fail("Cost not found", 404);
  return ok(cost);
}
