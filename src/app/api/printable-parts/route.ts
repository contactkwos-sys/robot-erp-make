import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { saveUpload } from "@/lib/storage/uploads";
import { validateUpload } from "@/lib/validations";
import type { PrintPartStatus } from "@/types";

export async function GET(request: Request) {
  const store = await readStore();
  const userId = getDemoUserId();
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  let parts = store.printable_parts.filter((p) => p.user_id === userId);
  if (projectId) parts = parts.filter((p) => p.project_id === projectId);
  return ok(parts);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const userId = getDemoUserId();
    const ts = nowIso();

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const partId = String(form.get("part_id") || "");
      const file = form.get("file");
      if (!(file instanceof File)) return fail("Print file required");
      const check = validateUpload(file);
      if (!check.ok) return fail(check.error);
      const uploaded = await saveUpload("prints", file);

      const store = await updateStore((s) => {
        const part = s.printable_parts.find((p) => p.id === partId && p.user_id === userId);
        if (!part) throw new Error("Printable part not found");
        part.file_name = uploaded.file_name;
        part.file_path = uploaded.file_path;
        part.file_type = uploaded.file_type || file.type || "model/stl";
        part.file_size = uploaded.file_size;
        part.status = "FILE_READY";
        part.updated_at = ts;
      });
      return ok(store.printable_parts.find((p) => p.id === partId));
    }

    const body = await parseJson<{
      part_name: string;
      part_name_hi?: string;
      purpose?: string;
      purpose_hi?: string;
      project_id?: string | null;
      material?: string;
      color?: string;
      quantity?: number;
      estimated_minutes?: number;
      notes?: string;
    }>(request);

    if (!body.part_name?.trim()) return fail("Part name required");

    const id = newId();
    await updateStore((s) => {
      s.printable_parts.push({
        id,
        user_id: userId,
        project_id: body.project_id ?? null,
        part_name: body.part_name.trim(),
        part_name_hi: body.part_name_hi || body.part_name.trim(),
        purpose: body.purpose || "",
        purpose_hi: body.purpose_hi || body.purpose || "",
        material: body.material || "PLA",
        color: body.color || "Any",
        quantity: body.quantity || 1,
        estimated_minutes: body.estimated_minutes || 60,
        file_name: "",
        file_path: "",
        file_type: "",
        file_size: 0,
        status: "NEEDED",
        notes: body.notes || "",
        created_at: ts,
        updated_at: ts,
      });
    });
    const store = await readStore();
    return ok(
      store.printable_parts.find((p) => p.id === id),
      { status: 201 }
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Printable part save failed", 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<{
      id: string;
      status?: PrintPartStatus;
      notes?: string;
      material?: string;
      color?: string;
      quantity?: number;
    }>(request);
    if (!body.id) return fail("Part id required");
    const ts = nowIso();
    const store = await updateStore((s) => {
      const part = s.printable_parts.find((p) => p.id === body.id);
      if (!part) throw new Error("Part not found");
      if (body.status) part.status = body.status;
      if (body.notes !== undefined) part.notes = body.notes;
      if (body.material !== undefined) part.material = body.material;
      if (body.color !== undefined) part.color = body.color;
      if (body.quantity !== undefined) part.quantity = body.quantity;
      part.updated_at = ts;
    });
    return ok(store.printable_parts.find((p) => p.id === body.id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Part update failed", 400);
  }
}
