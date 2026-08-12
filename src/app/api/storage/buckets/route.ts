import { ok, fail } from "@/lib/api";
import {
  checkStorageBuckets,
  ensureStorageBuckets,
} from "@/lib/storage/buckets";

export async function GET() {
  try {
    return ok(await checkStorageBuckets());
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Bucket check failed", 500);
  }
}

/** Create missing public storage buckets (robot-images, product-scans, documents). */
export async function POST() {
  try {
    return ok(await ensureStorageBuckets());
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ensure buckets failed", 500);
  }
}
