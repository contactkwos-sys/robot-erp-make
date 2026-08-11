import { ok, parseJson } from "@/lib/api";
import { nowIso, readStore, updateStore } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await readStore();
  const steps = store.assembly_steps
    .filter((s) => s.project_id === id)
    .sort((a, b) => a.step_number - b.step_number);
  return ok(steps);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseJson<{ step_id: string; completed: boolean }>(request);
  await updateStore((store) => {
    const step = store.assembly_steps.find((s) => s.id === body.step_id && s.project_id === id);
    if (!step) throw new Error("Step not found");
    step.completed = body.completed;
    step.completed_at = body.completed ? nowIso() : null;
  });
  const store = await readStore();
  return ok(
    store.assembly_steps
      .filter((s) => s.project_id === id)
      .sort((a, b) => a.step_number - b.step_number)
  );
}
