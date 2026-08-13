import { ok, fail } from "@/lib/api";
import { getDemoUserId, readStore } from "@/lib/db/store";
import { checkStorageBuckets } from "@/lib/storage/buckets";
import { availableQty } from "@/lib/db/inventory-logic";

export async function GET() {
  try {
    const store = await readStore();
    const userId = getDemoUserId();
    const projects = store.robot_projects
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const active =
      projects.find((p) => p.status === "active") || projects[0] || null;

    const inventory = store.inventory.filter((i) => i.user_id === userId);
    const inventoryEmpty = inventory.length === 0;
    const stockValue = inventory.reduce((s, i) => s + i.total_value, 0);
    const availableItems = inventory.filter((i) => availableQty(i) > 0);
    const usedTx = store.inventory_transactions.filter(
      (t) => t.user_id === userId && (t.transaction_type === "USE" || t.transaction_type === "ISSUE")
    );

    const components = active
      ? store.project_components.filter((c) => c.project_id === active.id)
      : [];
    const have = components.filter((c) => c.missing_quantity <= 0);
    const missing = components.filter((c) => c.missing_quantity > 0);
    const useful = components.filter(
      (c) => c.available_quantity > 0 || c.reserved_quantity > 0
    );

    const buckets = await checkStorageBuckets();

    const steps = [
      {
        id: "idea",
        done: projects.length > 0,
        href: "/robots/create",
      },
      {
        id: "image",
        done: Boolean(active?.cover_image_url),
        href: active ? `/robots/${active.id}` : "/robots/create",
      },
      {
        id: "purpose",
        done: Boolean(active?.purpose),
        href: active ? `/robots/${active.id}` : "/robots/create",
      },
      {
        id: "analysis",
        done: Boolean(
          active && store.robot_analysis.some((a) => a.project_id === active.id)
        ),
        href: active ? `/analysis/${active.id}` : "/analysis",
      },
      {
        id: "stock",
        done: !inventoryEmpty,
        href: "/inventory",
      },
      {
        id: "gap",
        done: Boolean(active) && missing.length === 0 && components.length > 0,
        href: "/purchases",
      },
      {
        id: "scan",
        done: store.product_scans.some((s) => s.user_id === userId),
        href: "/scanner",
      },
      {
        id: "print",
        done: store.print_jobs.some(
          (j) =>
            j.user_id === userId &&
            (j.status === "DONE" || j.status === "PRINTING" || j.status === "SENT")
        ),
        href: "/print",
      },
      {
        id: "code",
        done: Boolean(
          active &&
            ["PROGRAMMING", "TESTING", "COMPLETED"].includes(active.progress)
        ),
        href: active ? `/wiring/${active.id}` : "/wiring",
      },
      {
        id: "finish",
        done: active?.progress === "COMPLETED",
        href: active ? `/robots/${active.id}` : "/robots",
      },
    ];

    return ok({
      inventory_empty: inventoryEmpty,
      inventory_count: inventory.length,
      available_count: availableItems.length,
      stock_value: stockValue,
      used_transactions: usedTx.length,
      buckets,
      active_project: active
        ? {
            id: active.id,
            name: active.name,
            purpose: active.purpose,
            description: active.description,
            progress: active.progress,
            progress_percent: active.progress_percent,
            cover_image_url: active.cover_image_url,
            movement: active.movement,
            power_preference: active.power_preference,
          }
        : null,
      balance: {
        required: components.length,
        have: have.length,
        missing: missing.length,
        useful: useful.length,
        have_items: have.map((c) => ({
          id: c.id,
          name: c.component_name,
          qty: c.quantity,
          available: c.available_quantity,
        })),
        missing_items: missing.map((c) => ({
          id: c.id,
          name: c.component_name,
          qty: c.quantity,
          missing: c.missing_quantity,
        })),
        useful_items: useful.map((c) => ({
          id: c.id,
          name: c.component_name,
          available: c.available_quantity,
          reserved: c.reserved_quantity,
        })),
      },
      steps,
      projects_count: projects.length,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Plan load failed", 500);
  }
}
