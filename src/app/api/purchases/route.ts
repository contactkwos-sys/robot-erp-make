import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { applyInventoryTransaction } from "@/lib/db/inventory-logic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const store = await readStore();
  let items = store.purchase_items.filter((p) => p.user_id === getDemoUserId());
  if (status) items = items.filter((p) => p.status === status);
  return ok({
    items: items.sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    orders: store.purchase_orders.filter((o) => o.user_id === getDemoUserId()),
  });
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<{ action: string; item_ids?: string[]; item_id?: string }>(request);
    const userId = getDemoUserId();

    if (body.action === "create_order") {
      const ids = body.item_ids || [];
      let orderId = "";
      await updateStore((store) => {
        const items = store.purchase_items.filter((p) => ids.includes(p.id));
        if (!items.length) throw new Error("No purchase items selected");
        orderId = newId();
        const total = items.reduce((s, i) => s + i.estimated_total, 0);
        store.purchase_orders.push({
          id: orderId,
          user_id: userId,
          order_number: `PO-${Date.now().toString().slice(-8)}`,
          supplier: items[0].supplier || "Mixed",
          status: "ORDERED",
          total_estimated: total,
          notes: "",
          ordered_at: nowIso(),
          received_at: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        for (const item of items) {
          item.status = "ORDERED";
          item.purchase_order_id = orderId;
          item.updated_at = nowIso();
        }
      });
      const store = await readStore();
      return ok(store.purchase_orders.find((o) => o.id === orderId));
    }

    if (body.action === "receive" && body.item_id) {
      const store0 = await readStore();
      const item = store0.purchase_items.find((p) => p.id === body.item_id);
      if (!item) return fail("Purchase item not found", 404);

      // find or create inventory
      let invId = store0.inventory.find(
        (i) => i.item_name.toLowerCase() === item.item_name.toLowerCase()
      )?.id;

      if (!invId) {
        invId = newId();
        await updateStore((store) => {
          store.inventory.push({
            id: invId!,
            user_id: userId,
            item_name: item.item_name,
            category: "OTHER",
            brand: "",
            model: "",
            sku: "",
            image_url: null,
            specification: "",
            unit: "pcs",
            quantity: 0,
            reserved_quantity: 0,
            minimum_stock: 0,
            unit_cost: item.estimated_price,
            gst_percent: 18,
            total_value: 0,
            supplier: item.supplier,
            purchase_date: nowIso().slice(0, 10),
            storage_location: "Receiving",
            compatible_projects: item.project_id ? [item.project_id] : [],
            notes: "Received from purchase",
            status: "OUT_OF_STOCK",
            created_at: nowIso(),
            updated_at: nowIso(),
          });
        });
      }

      await applyInventoryTransaction({
        inventory_item_id: invId!,
        transaction_type: "RECEIVE",
        quantity: item.purchase_qty,
        reason: `Received purchase ${item.item_name}`,
        reference: item.id,
        project_id: item.project_id,
      });

      await updateStore((store) => {
        const p = store.purchase_items.find((x) => x.id === body.item_id);
        if (p) {
          p.status = "RECEIVED";
          p.updated_at = nowIso();
        }
        if (p?.purchase_order_id) {
          const orderItems = store.purchase_items.filter(
            (x) => x.purchase_order_id === p.purchase_order_id
          );
          if (orderItems.every((x) => x.status === "RECEIVED" || x.status === "CANCELLED")) {
            const order = store.purchase_orders.find((o) => o.id === p.purchase_order_id);
            if (order) {
              order.status = "RECEIVED";
              order.received_at = nowIso();
              order.updated_at = nowIso();
            }
          }
        }
      });

      return ok({ received: body.item_id, inventory_item_id: invId });
    }

    if (body.action === "cancel" && body.item_id) {
      await updateStore((store) => {
        const p = store.purchase_items.find((x) => x.id === body.item_id);
        if (!p) throw new Error("Not found");
        p.status = "CANCELLED";
        p.updated_at = nowIso();
      });
      return ok({ cancelled: body.item_id });
    }

    return fail("Unknown action");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Purchase action failed", 500);
  }
}
