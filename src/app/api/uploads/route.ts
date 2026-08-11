import { ok, fail } from "@/lib/api";
import { validateUpload } from "@/lib/validations";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "robots");
    if (!(file instanceof File)) return fail("No file uploaded");
    const check = validateUpload(file);
    if (!check.ok) return fail(check.error);
    const allowedFolders = new Set(["robots", "scans", "documents"]);
    if (!allowedFolders.has(folder)) return fail("Invalid upload folder");

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const rel = `/uploads/${folder}/${safeName}`;
    const abs = path.join(process.cwd(), "public", "uploads", folder, safeName);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);

    return ok({
      file_name: file.name,
      file_path: rel,
      file_type: file.type,
      file_size: file.size,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
