import { ok, fail } from "@/lib/api";
import { validateUpload } from "@/lib/validations";
import { saveUpload } from "@/lib/storage/uploads";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "robots");
    if (!(file instanceof File)) return fail("No file uploaded");
    const check = validateUpload(file);
    if (!check.ok) return fail(check.error);

    const uploaded = await saveUpload(folder, file);
    return ok(uploaded);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
