import { ok, fail } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { validateUpload } from "@/lib/validations";
import { saveUpload } from "@/lib/uploads";

export async function GET() {
  const store = await readStore();
  return ok(store.documents.filter((d) => d.user_id === getDemoUserId()));
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file uploaded");
    const check = validateUpload(file);
    if (!check.ok) return fail(check.error);
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(bytes, "documents", file.name, file.type);
    const id = newId();
    await updateStore((store) => {
      store.documents.push({
        id,
        user_id: getDemoUserId(),
        title: String(form.get("title") || file.name),
        file_name: file.name,
        file_path: saved.file_path,
        file_type: file.type,
        file_size: file.size,
        entity_type: (String(form.get("entity_type") || "general") as
          | "project"
          | "component"
          | "product"
          | "purchase"
          | "general"),
        entity_id: form.get("entity_id") ? String(form.get("entity_id")) : null,
        metadata: { notes: String(form.get("notes") || "") },
        created_at: nowIso(),
      });
    });
    const store = await readStore();
    return ok(store.documents.find((d) => d.id === id), { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Document upload failed", 500);
  }
}
