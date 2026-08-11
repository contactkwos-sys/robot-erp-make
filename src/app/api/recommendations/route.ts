import { ok, parseJson } from "@/lib/api";
import { getDemoUserId, readStore, updateStore } from "@/lib/db/store";

export async function GET() {
  const store = await readStore();
  return ok(
    store.ai_recommendations
      .filter((r) => r.user_id === getDemoUserId() && !r.dismissed)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function PATCH(request: Request) {
  const body = await parseJson<{ id: string; dismissed?: boolean }>(request);
  await updateStore((store) => {
    const rec = store.ai_recommendations.find((r) => r.id === body.id);
    if (!rec) throw new Error("Recommendation not found");
    if (body.dismissed !== undefined) rec.dismissed = body.dismissed;
  });
  return ok({ updated: body.id });
}
