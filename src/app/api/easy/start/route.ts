import { ok, fail } from "@/lib/api";
import { getDemoUserId, newId, nowIso, updateStore } from "@/lib/db/store";
import { STARTER_PROJECT } from "@/lib/easy-robot";

/** One-click starter project for absolute beginners. */
export async function POST() {
  try {
    const id = newId();
    const userId = getDemoUserId();
    const ts = nowIso();

    await updateStore((store) => {
      store.robot_projects.push({
        id,
        user_id: userId,
        name: STARTER_PROJECT.name,
        purpose: STARTER_PROJECT.purpose,
        description: STARTER_PROJECT.description,
        target_load: STARTER_PROJECT.target_load,
        dimensions: STARTER_PROJECT.dimensions,
        movement: STARTER_PROJECT.movement,
        environment: STARTER_PROJECT.environment,
        power_preference: STARTER_PROJECT.power_preference,
        status: "active",
        progress: "IDEA",
        progress_percent: 5,
        cover_image_url: "/demo/inspection-robot.svg",
        is_demo: false,
        approved_at: null,
        build_plan_id: null,
        trend_id: "trend-edu-stem-kit",
        created_at: ts,
        updated_at: ts,
      });

      store.robot_images.push({
        id: newId(),
        project_id: id,
        user_id: userId,
        file_name: "easy-obstacle-bot.svg",
        file_path: "/demo/inspection-robot.svg",
        file_type: "image/svg+xml",
        file_size: 0,
        image_kind: STARTER_PROJECT.image_kind,
        created_at: ts,
      });

      store.project_notes.push({
        id: newId(),
        project_id: id,
        user_id: userId,
        title: "Easiest beginner path",
        body: "Use /easy page prompts with Gemini, ChatGPT, and Claude. Keep the build small.",
        created_at: ts,
        updated_at: ts,
      });
    });

    return ok({ id, name: STARTER_PROJECT.name }, { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not start easy robot", 500);
  }
}
