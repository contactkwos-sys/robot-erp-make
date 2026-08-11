import { ok, fail } from "@/lib/api";
import { getAIProvider } from "@/lib/ai";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { validateUpload } from "@/lib/validations";
import { saveUpload } from "@/lib/uploads";

export async function GET() {
  const store = await readStore();
  return ok(
    store.product_scans
      .filter((s) => s.user_id === getDemoUserId())
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Upload a product screenshot or PDF");
    const check = validateUpload(file);
    if (!check.ok) return fail(check.error);

    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(bytes, "scans", file.name, file.type);

    const ai = getAIProvider();
    let extraction;
    try {
      extraction = await ai.analyzeProductScreenshot({
        imageUrl: saved.file_path,
        fileName: file.name,
        notes: String(form.get("notes") || ""),
      });
    } catch {
      return fail("Product information could not be extracted. Please upload a clearer screenshot.");
    }

    const id = newId();
    await updateStore((store) => {
      store.product_scans.push({
        id,
        user_id: getDemoUserId(),
        file_name: file.name,
        file_path: saved.file_path,
        file_type: file.type,
        extracted_data: extraction.data,
        provider: extraction.provider,
        status: "extracted",
        error_message: null,
        created_at: nowIso(),
      });
    });

    return ok({
      scan_id: id,
      file_path: saved.file_path,
      extracted: extraction.data,
      warnings: extraction.warnings,
      provider: extraction.provider,
    });
  } catch (e) {
    return fail(
      e instanceof Error
        ? e.message
        : "Product information could not be extracted. Please upload a clearer screenshot.",
      500
    );
  }
}
