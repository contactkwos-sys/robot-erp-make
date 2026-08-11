import { ok, fail } from "@/lib/api";
import { bomFromComponents, syncProjectInventory } from "@/lib/db/inventory-logic";
import { readStore, updateStore } from "@/lib/db/store";
import { progressPercent } from "@/lib/utils";
import { nowIso } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await syncProjectInventory(id);
  await updateStore((store) => {
    const p = store.robot_projects.find((x) => x.id === id);
    if (p && p.progress === "ANALYSIS") {
      p.progress = "BOM";
      p.progress_percent = progressPercent("BOM");
      p.updated_at = nowIso();
    }
  });
  const store = await readStore();
  const components = store.project_components.filter((c) => c.project_id === id);
  if (!store.robot_projects.find((p) => p.id === id)) return fail("Project not found", 404);
  return ok(bomFromComponents(components));
}
