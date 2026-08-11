import { ok, fail, parseJson } from "@/lib/api";
import { nowIso, readStore, updateStore } from "@/lib/db/store";
import { progressPercent } from "@/lib/utils";
import type { ProjectProgress } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readStore();
  const project = store.robot_projects.find((p) => p.id === id);
  if (!project) return fail("Project not found", 404);
  return ok({
    project,
    images: store.robot_images.filter((i) => i.project_id === id),
    analysis: store.robot_analysis.filter((a) => a.project_id === id),
    components: store.project_components.filter((c) => c.project_id === id),
    purchases: store.purchase_items.filter((p) => p.project_id === id),
    assembly: store.assembly_steps
      .filter((s) => s.project_id === id)
      .sort((a, b) => a.step_number - b.step_number),
    wiring: store.wiring_connections.filter((w) => w.project_id === id),
    cost: store.project_costs.find((c) => c.project_id === id) || null,
    recommendations: store.ai_recommendations.filter((r) => r.project_id === id),
    engineering: store.engineering_checks.filter((e) => e.project_id === id),
    notes: store.project_notes.filter((n) => n.project_id === id),
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseJson<Record<string, unknown>>(request);
  await updateStore((store) => {
    const project = store.robot_projects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    Object.assign(project, body, { updated_at: nowIso() });
    if (body.progress) {
      project.progress = body.progress as ProjectProgress;
      project.progress_percent = progressPercent(project.progress);
    }
  });
  const store = await readStore();
  const project = store.robot_projects.find((p) => p.id === id);
  if (!project) return fail("Project not found", 404);
  return ok(project);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await updateStore((store) => {
    store.robot_projects = store.robot_projects.filter((p) => p.id !== id);
    store.robot_images = store.robot_images.filter((i) => i.project_id !== id);
    store.robot_analysis = store.robot_analysis.filter((a) => a.project_id !== id);
    store.project_components = store.project_components.filter((c) => c.project_id !== id);
    store.assembly_steps = store.assembly_steps.filter((s) => s.project_id !== id);
    store.wiring_connections = store.wiring_connections.filter((w) => w.project_id !== id);
    store.project_costs = store.project_costs.filter((c) => c.project_id !== id);
    store.purchase_items = store.purchase_items.filter((p) => p.project_id !== id);
  });
  return ok({ deleted: id });
}
