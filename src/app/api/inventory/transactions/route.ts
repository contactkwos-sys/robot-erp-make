import { ok, fail, parseJson } from "@/lib/api";
import { applyInventoryTransaction } from "@/lib/db/inventory-logic";
import { readStore } from "@/lib/db/store";
import { transactionSchema } from "@/lib/validations";

export async function GET() {
  const store = await readStore();
  return ok(
    [...store.inventory_transactions].sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<Record<string, unknown>>(request);
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid transaction");
    await applyInventoryTransaction(parsed.data);
    const store = await readStore();
    return ok({
      item: store.inventory.find((i) => i.id === parsed.data.inventory_item_id),
      transactions: store.inventory_transactions
        .filter((t) => t.inventory_item_id === parsed.data.inventory_item_id)
        .slice(-5),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Transaction failed", 400);
  }
}
