import { promises as fs } from "fs";
import path from "path";
import {
  createServerSupabaseClient,
  getDataBackend,
  isServerlessRuntime,
} from "@/lib/supabase/client";
import { ensureStorageBuckets } from "@/lib/storage/buckets";

const FOLDER_TO_BUCKET: Record<string, string> = {
  robots: "robot-images",
  scans: "product-scans",
  documents: "documents",
};

export type UploadResult = {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  storage: "supabase" | "local" | "data-url";
};

function safeFileName(name: string) {
  return `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

async function uploadToSupabase(
  folder: string,
  file: File,
  bytes: Buffer
): Promise<UploadResult> {
  const client = createServerSupabaseClient();
  if (!client) {
    throw new Error(
      "File uploads on Netlify require Supabase. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and create storage buckets."
    );
  }

  const bucket = FOLDER_TO_BUCKET[folder] || "documents";
  const objectPath = `${folder}/${safeFileName(file.name)}`;

  // Auto-create missing buckets so "bucket is empty / missing" does not block uploads.
  const buckets = await ensureStorageBuckets();
  if (buckets.missing.includes(bucket)) {
    throw new Error(
      `Storage bucket "${bucket}" is missing. Run supabase/migrations/20260812234000_create_storage_buckets.sql or POST /api/storage/buckets.`
    );
  }

  const { error } = await client.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    // One retry after ensuring buckets (handles race / first-deploy empty project)
    if (/not found|does not exist|bucket/i.test(error.message)) {
      await ensureStorageBuckets();
      const retry = await client.storage.from(bucket).upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (!retry.error) {
        const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
        return {
          file_name: file.name,
          file_path: data.publicUrl,
          file_type: file.type,
          file_size: file.size,
          storage: "supabase",
        };
      }
    }
    throw new Error(
      `Supabase Storage upload failed (${error.message}). Create public buckets: robot-images, product-scans, documents.`
    );
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return {
    file_name: file.name,
    file_path: data.publicUrl,
    file_type: file.type,
    file_size: file.size,
    storage: "supabase",
  };
}

async function uploadToLocal(
  folder: string,
  file: File,
  bytes: Buffer
): Promise<UploadResult> {
  const name = safeFileName(file.name);
  const rel = `/uploads/${folder}/${name}`;
  const abs = path.join(process.cwd(), "public", "uploads", folder, name);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, bytes);

  return {
    file_name: file.name,
    file_path: rel,
    file_type: file.type,
    file_size: file.size,
    storage: "local",
  };
}

function uploadAsDataUrl(file: File, bytes: Buffer): UploadResult {
  return {
    file_name: file.name,
    file_path: `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`,
    file_type: file.type,
    file_size: file.size,
    storage: "data-url",
  };
}

/**
 * Save an upload with this priority:
 * 1) Supabase Storage (production/Netlify when configured)
 * 2) Local public/uploads (writable dev machines)
 * 3) Data URL fallback (serverless without Supabase — demo still works)
 */
export async function saveUpload(folder: string, file: File): Promise<UploadResult> {
  const allowed = new Set(["robots", "scans", "documents"]);
  if (!allowed.has(folder)) {
    throw new Error("Invalid upload folder");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (getDataBackend() === "supabase") {
    return uploadToSupabase(folder, file, bytes);
  }

  if (!isServerlessRuntime()) {
    try {
      return await uploadToLocal(folder, file, bytes);
    } catch {
      return uploadAsDataUrl(file, bytes);
    }
  }

  return uploadAsDataUrl(file, bytes);
}

/** Compatibility wrapper for callers that pass raw bytes (from main-branch API). */
export async function saveUploadBytes(
  bytes: Buffer,
  folder: string,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const file = new File([Uint8Array.from(bytes)], originalName, { type: mimeType });
  return saveUpload(folder, file);
}
