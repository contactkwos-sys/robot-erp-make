import { ok, fail, parseJson } from "@/lib/api";
import { nowIso, readStore, updateStore } from "@/lib/db/store";
import { progressPercent } from "@/lib/utils";
import type { ProjectProgress } from "@/types";
import { PROGRESS_STEPS } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await parseJson<{ progress: ProjectProgress }>(request);
  if (!PROGRESS_STEPS.includes(body.progress)) return fail("Invalid progress stage");
  await updateStore((store) => {
    const p = store.robot_projects.find((x) => x.id === id);
    if (!p) throw new Error("Project not found");
    p.progress = body.progress;
    p.progress_percent = progressPercent(body.progress);
    if (body.progress === "COMPLETED") p.status = "completed";
    p.updated_at = nowIso();
  });
  const store = await readStore();
  return ok(store.robot_projects.find((p) => p.id === id));
}
