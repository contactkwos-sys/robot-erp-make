import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { inventoryItemSchema } from "@/lib/validations";
import { deriveInventoryStatus } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = await readStore();
  let items = store.inventory.filter((i) => i.user_id === getDemoUserId());
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.toLowerCase();
  if (category) items = items.filter((i) => i.category === category);
  if (status) items = items.filter((i) => i.status === status);
  if (q) {
    items = items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q)
    );
  }
  return ok(items.sort((a, b) => a.item_name.localeCompare(b.item_name)));
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<Record<string, unknown>>(request);
    const parsed = inventoryItemSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid inventory item");
    const userId = getDemoUserId();
    const now = nowIso();
    const id = newId();
    await updateStore((store) => {
      const item = {
        id,
        user_id: userId,
        ...parsed.data,
        image_url: (body.image_url as string) || null,
        reserved_quantity: 0,
        total_value: parsed.data.quantity * parsed.data.unit_cost,
        compatible_projects: [],
        status: deriveInventoryStatus(parsed.data.quantity, 0, parsed.data.minimum_stock),
        purchase_date: parsed.data.purchase_date || null,
        created_at: now,
        updated_at: now,
      };
      store.inventory.push(item);
      store.inventory_transactions.push({
        id: newId(),
        user_id: userId,
        inventory_item_id: id,
        transaction_type: "RECEIVE",
        quantity: parsed.data.quantity,
        previous_stock: 0,
        new_stock: parsed.data.quantity,
        reason: "Initial stock entry",
        reference: "MANUAL",
        project_id: null,
        created_at: now,
      });
    });
    const store = await readStore();
    return ok(store.inventory.find((i) => i.id === id), { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Create failed", 500);
  }
}
