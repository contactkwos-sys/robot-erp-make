import { ok, fail, parseJson } from "@/lib/api";
import { getAIProvider } from "@/lib/ai";
import { readStore } from "@/lib/db/store";
import { compareSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await parseJson<{ product_ids: string[] }>(request);
    const parsed = compareSchema.safeParse(body);
    if (!parsed.success) return fail("Select 2–5 products to compare");
    const store = await readStore();
    const products = store.products.filter((p) => parsed.data.product_ids.includes(p.id));
    if (products.length < 2) return fail("Select 2–5 products to compare");
    const ai = getAIProvider();
    const comparison = await ai.compareProducts(products);
    return ok({ products, comparison });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Comparison failed", 500);
  }
}
