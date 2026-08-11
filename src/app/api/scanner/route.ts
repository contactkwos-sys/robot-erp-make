import { ok, fail } from "@/lib/api";
import { getAIProvider } from "@/lib/ai";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { validateUpload } from "@/lib/validations";
import { promises as fs } from "fs";
import path from "path";

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
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const rel = `/uploads/scans/${safeName}`;
    const abs = path.join(process.cwd(), "public", "uploads", "scans", safeName);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);

    const ai = getAIProvider();
    let extraction;
    try {
      extraction = await ai.analyzeProductScreenshot({
        imageUrl: rel,
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
        file_path: rel,
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
      file_path: rel,
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
