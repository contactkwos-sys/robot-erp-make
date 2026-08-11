import { promises as fs } from "fs";
import path from "path";
import { createServerSupabaseClient, getDataBackend, isServerlessRuntime } from "@/lib/supabase/client";

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
  storage: "supabase" | "local";
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

  const { error } = await client.storage.from(bucket).upload(objectPath, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
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
  if (isServerlessRuntime() || getDataBackend() !== "local") {
    throw new Error(
      "Local disk uploads are unavailable on Netlify. Configure Supabase Storage for production file uploads."
    );
  }

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

export async function saveUpload(folder: string, file: File): Promise<UploadResult> {
  const allowed = new Set(["robots", "scans", "documents"]);
  if (!allowed.has(folder)) {
    throw new Error("Invalid upload folder");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (getDataBackend() === "supabase") {
    return uploadToSupabase(folder, file, bytes);
  }
  return uploadToLocal(folder, file, bytes);
}
