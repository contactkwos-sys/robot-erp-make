import { ok, fail } from "@/lib/api";
import { resetStore } from "@/lib/db/store";

export async function POST() {
  try {
    const store = await resetStore();
    return ok({
      message: "Demo data reset",
      projects: store.robot_projects.length,
      inventory: store.inventory.length,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Seed failed", 500);
  }
}
