import { promises as fs } from "fs";
import path from "path";

/**
 * Persist an uploaded file when the filesystem is writable.
 * On Netlify/serverless, fall back to an in-memory data URL so demos still work.
 */
export async function saveUpload(
  bytes: Buffer,
  folder: string,
  originalName: string,
  mimeType: string
): Promise<{ file_name: string; file_path: string; file_type: string; file_size: number }> {
  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const rel = `/uploads/${folder}/${safeName}`;
  const abs = path.join(process.cwd(), "public", "uploads", folder, safeName);

  try {
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, bytes);
    return {
      file_name: originalName,
      file_path: rel,
      file_type: mimeType,
      file_size: bytes.length,
    };
  } catch {
    // Serverless / read-only FS — keep usable in DEMO MODE
    const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${bytes.toString("base64")}`;
    return {
      file_name: originalName,
      file_path: dataUrl,
      file_type: mimeType,
      file_size: bytes.length,
    };
  }
}
