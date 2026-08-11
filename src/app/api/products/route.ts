import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const store = await readStore();
  return ok(store.products.filter((p) => p.user_id === getDemoUserId()));
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<Record<string, unknown>>(request);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || "Invalid product");
    const id = newId();
    await updateStore((store) => {
      store.products.push({
        id,
        user_id: getDemoUserId(),
        ...parsed.data,
        price: parsed.data.price ?? null,
        mrp: parsed.data.mrp ?? null,
        discount: parsed.data.discount ?? null,
        gst_percent: parsed.data.gst_percent ?? null,
        shipping: parsed.data.shipping ?? null,
        final_price: parsed.data.final_price ?? null,
        image_url: (body.image_url as string) || null,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    });
    const store = await readStore();
    return ok(store.products.find((p) => p.id === id), { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Create failed", 500);
  }
}
