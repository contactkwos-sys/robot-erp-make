import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { robotWizardSchema } from "@/lib/validations";
import { progressPercent } from "@/lib/utils";

export async function GET() {
  const store = await readStore();
  const userId = getDemoUserId();
  const projects = store.robot_projects
    .filter((p) => p.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return ok(projects);
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<Record<string, unknown>>(request);
    const parsed = robotWizardSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Validation failed", 400, {
        issues: parsed.error.issues,
      });
    }
    const userId = getDemoUserId();
    const id = newId();
    const now = nowIso();
    await updateStore((store) => {
      store.robot_projects.push({
        id,
        user_id: userId,
        name: parsed.data.name,
        purpose: parsed.data.purpose,
        description: parsed.data.description,
        target_load: parsed.data.target_load,
        dimensions: parsed.data.dimensions,
        movement: parsed.data.movement,
        environment: parsed.data.environment,
        power_preference: parsed.data.power_preference,
        status: "active",
        progress: "IDEA",
        progress_percent: progressPercent("IDEA"),
        cover_image_url: (body.cover_image_url as string) || null,
        is_demo: false,
        approved_at: null,
        created_at: now,
        updated_at: now,
      });
      if (body.image_path) {
        store.robot_images.push({
          id: newId(),
          project_id: id,
          user_id: userId,
          file_name: String(body.file_name || "upload"),
          file_path: String(body.image_path),
          file_type: String(body.file_type || "image/png"),
          file_size: Number(body.file_size || 0),
          image_kind: parsed.data.image_kind,
          created_at: now,
        });
      }
    });
    const store = await readStore();
    return ok(store.robot_projects.find((p) => p.id === id), { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Create failed", 500);
  }
}
