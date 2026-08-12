import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const REQUIRED_STORAGE_BUCKETS = [
  "robot-images",
  "product-scans",
  "documents",
] as const;

export type StorageBucketName = (typeof REQUIRED_STORAGE_BUCKETS)[number];

export type BucketStatus = {
  name: StorageBucketName;
  exists: boolean;
  public: boolean | null;
  empty: boolean | null;
  object_count: number | null;
  detail?: string;
};

export type StorageBucketsHealth = {
  ok: boolean;
  supabase_configured: boolean;
  setup_required: boolean;
  empty_or_missing: boolean;
  message: string;
  buckets: BucketStatus[];
  missing: string[];
  empty: string[];
};

const BUCKET_OPTIONS: Record<
  StorageBucketName,
  { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] }
> = {
  "robot-images": {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
    ],
  },
  "product-scans": {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
    ],
  },
  documents: {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "application/json",
    ],
  },
};

export async function checkStorageBuckets(): Promise<StorageBucketsHealth> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      supabase_configured: false,
      setup_required: false,
      empty_or_missing: false,
      message:
        "Storage buckets not required in DEMO MODE (local / data-url uploads).",
      buckets: REQUIRED_STORAGE_BUCKETS.map((name) => ({
        name,
        exists: false,
        public: null,
        empty: null,
        object_count: null,
        detail: "Skipped — Supabase not configured",
      })),
      missing: [],
      empty: [],
    };
  }

  const client = createServerSupabaseClient();
  if (!client) {
    return {
      ok: false,
      supabase_configured: true,
      setup_required: true,
      empty_or_missing: true,
      message: "Could not create Supabase client to inspect storage buckets.",
      buckets: [],
      missing: [...REQUIRED_STORAGE_BUCKETS],
      empty: [],
    };
  }

  const { data: listed, error } = await client.storage.listBuckets();
  if (error) {
    return {
      ok: false,
      supabase_configured: true,
      setup_required: true,
      empty_or_missing: true,
      message: `Storage bucket list failed (${error.message}).`,
      buckets: [],
      missing: [...REQUIRED_STORAGE_BUCKETS],
      empty: [],
    };
  }

  const byId = new Map((listed || []).map((b) => [b.id || b.name, b]));
  const buckets: BucketStatus[] = [];

  for (const name of REQUIRED_STORAGE_BUCKETS) {
    const found = byId.get(name);
    if (!found) {
      buckets.push({
        name,
        exists: false,
        public: null,
        empty: true,
        object_count: 0,
        detail: "Bucket missing — run storage buckets migration or Ensure Buckets",
      });
      continue;
    }

    const { data: objects, error: listError } = await client.storage.from(name).list("", {
      limit: 2,
    });
    const count = listError ? null : (objects || []).length;
    const empty = listError ? null : (objects || []).length === 0;

    buckets.push({
      name,
      exists: true,
      public: Boolean(found.public),
      empty,
      object_count: count,
      detail: listError
        ? `Exists but list failed (${listError.message})`
        : empty
          ? "Bucket exists and is empty (ready for first upload)"
          : "Bucket exists and contains objects",
    });
  }

  const missing = buckets.filter((b) => !b.exists).map((b) => b.name);
  const empty = buckets.filter((b) => b.exists && b.empty === true).map((b) => b.name);
  const setup_required = missing.length > 0;
  const ok = !setup_required;

  let message = "All storage buckets ready.";
  if (missing.length) {
    message = `Storage buckets missing: ${missing.join(", ")}. Run supabase/migrations/20260812234000_create_storage_buckets.sql or click Ensure Buckets.`;
  } else if (empty.length === REQUIRED_STORAGE_BUCKETS.length) {
    message =
      "Storage buckets exist but are empty — uploads will start filling them. यह bucket खाली है, लेकिन ready है।";
  } else if (empty.length) {
    message = `Buckets ready. Empty buckets: ${empty.join(", ")}.`;
  }

  return {
    ok,
    supabase_configured: true,
    setup_required,
    empty_or_missing: setup_required || empty.length > 0,
    message,
    buckets,
    missing,
    empty,
  };
}

/** Create any missing public buckets via the Storage API (service role). */
export async function ensureStorageBuckets(): Promise<StorageBucketsHealth> {
  if (!isSupabaseConfigured()) {
    return checkStorageBuckets();
  }

  const client = createServerSupabaseClient();
  if (!client) {
    return checkStorageBuckets();
  }

  const current = await checkStorageBuckets();
  for (const bucket of current.buckets) {
    if (bucket.exists) continue;
    const opts = BUCKET_OPTIONS[bucket.name];
    const { error } = await client.storage.createBucket(bucket.name, {
      public: opts.public,
      fileSizeLimit: opts.fileSizeLimit,
      allowedMimeTypes: opts.allowedMimeTypes,
    });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      // continue collecting; final check reports remaining issues
      console.error(`createBucket(${bucket.name}):`, error.message);
    }
  }

  return checkStorageBuckets();
}
