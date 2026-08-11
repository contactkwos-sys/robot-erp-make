import { ok } from "@/lib/api";
import { getDemoUserId, readStore } from "@/lib/db/store";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.toLowerCase().trim() || "";
  const store = await readStore();
  const userId = getDemoUserId();
  if (!q) return ok({ projects: [], inventory: [], products: [], purchases: [], documents: [], components: [] });

  return ok({
    projects: store.robot_projects.filter(
      (p) => p.user_id === userId && (p.name.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q))
    ),
    inventory: store.inventory.filter(
      (i) =>
        i.user_id === userId &&
        (i.item_name.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q))
    ),
    products: store.products.filter(
      (p) => p.user_id === userId && p.product_name.toLowerCase().includes(q)
    ),
    purchases: store.purchase_items.filter(
      (p) => p.user_id === userId && p.item_name.toLowerCase().includes(q)
    ),
    documents: store.documents.filter(
      (d) => d.user_id === userId && d.title.toLowerCase().includes(q)
    ),
    components: store.project_components.filter(
      (c) => c.user_id === userId && c.component_name.toLowerCase().includes(q)
    ),
  });
}
