import { ok, fail, parseJson } from "@/lib/api";
import { nowIso, readStore, updateStore } from "@/lib/db/store";
import { deriveInventoryStatus } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readStore();
  const item = store.inventory.find((i) => i.id === id);
  if (!item) return fail("Item not found", 404);
  return ok({
    item,
    transactions: store.inventory_transactions
      .filter((t) => t.inventory_item_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    used_in: store.project_components.filter((c) => c.inventory_item_id === id),
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseJson<Record<string, unknown>>(request);
  await updateStore((store) => {
    const item = store.inventory.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");
    Object.assign(item, body);
    item.total_value = item.quantity * item.unit_cost;
    item.status = deriveInventoryStatus(
      item.quantity,
      item.reserved_quantity,
      item.minimum_stock,
      item.status
    );
    item.updated_at = nowIso();
  });
  const store = await readStore();
  return ok(store.inventory.find((i) => i.id === id));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await updateStore((store) => {
    store.inventory = store.inventory.filter((i) => i.id !== id);
  });
  return ok({ deleted: id });
}
