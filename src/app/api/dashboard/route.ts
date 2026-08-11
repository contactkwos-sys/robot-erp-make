import { ok, fail } from "@/lib/api";
import { getDashboardStats } from "@/lib/db/inventory-logic";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to load dashboard", 500);
  }
}
