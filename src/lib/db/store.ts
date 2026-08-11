import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AppStore } from "@/types";
import { createDemoStore } from "@/lib/db/demo-data";
import {
  createServerSupabaseClient,
  getDataBackend,
  isServerlessRuntime,
  isSupabaseConfigured,
  type DataBackend,
} from "@/lib/supabase/client";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const TMP_STORE_PATH = path.join("/tmp", "ai-robot-builder-store.json");
const APP_STORE_TABLE = "app_stores";

let writeQueue: Promise<void> = Promise.resolve();
let memoryStore: AppStore | null = null;
let lastPersistence: "supabase" | "file" | "tmp" | "memory" = "memory";

function emptyStore(): AppStore {
  return {
    users: [],
    robot_projects: [],
    robot_images: [],
    robot_analysis: [],
    components: [],
    project_components: [],
    inventory: [],
    inventory_transactions: [],
    products: [],
    product_scans: [],
    purchase_orders: [],
    purchase_items: [],
    assembly_steps: [],
    wiring_connections: [],
    documents: [],
    ai_recommendations: [],
    project_costs: [],
    project_notes: [],
    engineering_checks: [],
  };
}

export function newId() {
  return uuidv4();
}

export function nowIso() {
  return new Date().toISOString();
}

export function getDemoUserId() {
  return process.env.DEMO_USER_ID || "00000000-0000-4000-8000-000000000001";
}

function ownerKey() {
  return getDemoUserId();
}

function cloneStore(store: AppStore): AppStore {
  return JSON.parse(JSON.stringify(store)) as AppStore;
}

async function tryReadFile(filePath: string): Promise<AppStore | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as AppStore;
  } catch {
    return null;
  }
}

async function tryWriteFile(filePath: string, store: AppStore): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

async function canUseLocalFilesystem() {
  if (isServerlessRuntime()) return false;
  const probe = path.join(DATA_DIR, ".write-probe");
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Backend priority:
 * 1) Supabase (persistent — required for real Netlify production data)
 * 2) Local data/store.json (developer machines)
 * 3) /tmp (warm serverless instance without Supabase)
 * 4) In-memory (last resort; never mkdir on read-only FS)
 */
async function resolveBackend(): Promise<DataBackend | "tmp"> {
  const preferred = getDataBackend();
  if (preferred === "supabase") return "supabase";
  if (await canUseLocalFilesystem()) return "local";
  if (isServerlessRuntime()) {
    try {
      const probe = path.join("/tmp", ".ai-robot-builder-write-probe");
      await fs.writeFile(probe, "ok", "utf8");
      await fs.unlink(probe);
      return "tmp";
    } catch {
      return "memory";
    }
  }
  return "memory";
}

async function readFromSupabase(): Promise<AppStore> {
  const client = createServerSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for Netlify/production."
    );
  }

  const key = ownerKey();
  const { data, error } = await client
    .from(APP_STORE_TABLE)
    .select("payload")
    .eq("owner_key", key)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Supabase read failed (${error.message}). Ensure you ran supabase/schema.sql (app_stores table) and set SUPABASE_SERVICE_ROLE_KEY.`
    );
  }

  if (!data?.payload) {
    const demo = createDemoStore();
    const { error: insertError } = await client.from(APP_STORE_TABLE).upsert(
      {
        owner_key: key,
        payload: demo,
        updated_at: nowIso(),
      },
      { onConflict: "owner_key" }
    );
    if (insertError) {
      throw new Error(
        `Supabase seed failed (${insertError.message}). Create the app_stores table from supabase/schema.sql.`
      );
    }
    return demo;
  }

  return data.payload as AppStore;
}

async function writeToSupabase(store: AppStore): Promise<void> {
  const client = createServerSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for Netlify/production."
    );
  }

  const { error } = await client.from(APP_STORE_TABLE).upsert(
    {
      owner_key: ownerKey(),
      payload: store,
      updated_at: nowIso(),
    },
    { onConflict: "owner_key" }
  );

  if (error) {
    throw new Error(`Supabase write failed (${error.message}).`);
  }
}

async function readFromLocal(): Promise<AppStore> {
  const existing = await tryReadFile(STORE_PATH);
  if (existing) return existing;
  const demo = createDemoStore();
  await tryWriteFile(STORE_PATH, demo);
  return demo;
}

async function writeToLocal(store: AppStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await tryWriteFile(STORE_PATH, store);
  });
  await writeQueue;
}

async function readFromTmp(): Promise<AppStore> {
  const existing = await tryReadFile(TMP_STORE_PATH);
  if (existing) return existing;
  const demo = createDemoStore();
  await tryWriteFile(TMP_STORE_PATH, demo);
  return demo;
}

async function writeToTmp(store: AppStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await tryWriteFile(TMP_STORE_PATH, store);
  });
  await writeQueue;
}

function readFromMemory(): AppStore {
  if (!memoryStore) {
    memoryStore = createDemoStore();
  }
  return cloneStore(memoryStore);
}

function writeToMemory(store: AppStore) {
  memoryStore = cloneStore(store);
}

type ResolvedBackend = DataBackend | "tmp";

async function ensureStore(): Promise<{ store: AppStore; backend: ResolvedBackend }> {
  const backend = await resolveBackend();
  if (backend === "supabase") {
    lastPersistence = "supabase";
    return { store: await readFromSupabase(), backend };
  }
  if (backend === "local") {
    lastPersistence = "file";
    return { store: await readFromLocal(), backend };
  }
  if (backend === "tmp") {
    lastPersistence = "tmp";
    return { store: await readFromTmp(), backend };
  }
  lastPersistence = "memory";
  return { store: readFromMemory(), backend };
}

async function persist(store: AppStore, backend: ResolvedBackend) {
  if (backend === "supabase") {
    await writeToSupabase(store);
    lastPersistence = "supabase";
    return;
  }
  if (backend === "local") {
    await writeToLocal(store);
    lastPersistence = "file";
    return;
  }
  if (backend === "tmp") {
    await writeToTmp(store);
    lastPersistence = "tmp";
    return;
  }
  writeToMemory(store);
  lastPersistence = "memory";
}

export async function readStore(): Promise<AppStore> {
  const { store } = await ensureStore();
  return store;
}

export async function updateStore(
  mutator: (store: AppStore) => void | Promise<void>
): Promise<AppStore> {
  const { store, backend } = await ensureStore();
  await mutator(store);
  await persist(store, backend);
  return store;
}

export async function resetStore(): Promise<AppStore> {
  const backend = await resolveBackend();
  const demo = createDemoStore();
  await persist(demo, backend);
  memoryStore = cloneStore(demo);
  return demo;
}

export async function getActiveDataBackend(): Promise<DataBackend | "tmp"> {
  return resolveBackend();
}

/** Runtime mode info for UI banners and settings (compatible with Netlify DEMO MODE UI). */
export function getRuntimeMode() {
  const supabaseConfigured = isSupabaseConfigured();
  const aiProvider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const hasAiKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY
  );
  const demoMode = !supabaseConfigured || aiProvider === "mock" || !hasAiKey;

  return {
    demo_mode: demoMode,
    backend: supabaseConfigured ? ("supabase" as const) : ("local" as const),
    persistence: lastPersistence,
    ai_provider: aiProvider,
    supabase_configured: supabaseConfigured,
    serverless: isServerlessRuntime(),
  };
}

export { emptyStore };
