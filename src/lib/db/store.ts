import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AppStore } from "@/types";
import { createDemoStore } from "@/lib/db/demo-data";
import {
  createServerSupabaseClient,
  getDataBackend,
  isServerlessRuntime,
  type DataBackend,
} from "@/lib/supabase/client";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const APP_STORE_TABLE = "app_stores";

let writeQueue: Promise<void> = Promise.resolve();
let memoryStore: AppStore | null = null;

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

async function canUseLocalFilesystem() {
  if (isServerlessRuntime()) return false;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const probe = path.join(DATA_DIR, ".write-probe");
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

async function resolveBackend(): Promise<DataBackend> {
  const preferred = getDataBackend();
  if (preferred === "supabase") return "supabase";
  if (preferred === "memory") return "memory";
  if (await canUseLocalFilesystem()) return "local";
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    if (!raw.trim()) {
      const demo = createDemoStore();
      await fs.writeFile(STORE_PATH, JSON.stringify(demo, null, 2), "utf8");
      return demo;
    }
    return JSON.parse(raw) as AppStore;
  } catch {
    const demo = createDemoStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(demo, null, 2), "utf8");
    return demo;
  }
}

async function writeToLocal(store: AppStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  });
  await writeQueue;
}

function readFromMemory(): AppStore {
  if (!memoryStore) {
    memoryStore = createDemoStore();
  }
  // Deep clone so callers don't mutate the cached object before persist.
  return JSON.parse(JSON.stringify(memoryStore)) as AppStore;
}

function writeToMemory(store: AppStore) {
  memoryStore = JSON.parse(JSON.stringify(store)) as AppStore;
}

async function ensureStore(): Promise<{ store: AppStore; backend: DataBackend }> {
  const backend = await resolveBackend();
  if (backend === "supabase") {
    return { store: await readFromSupabase(), backend };
  }
  if (backend === "local") {
    return { store: await readFromLocal(), backend };
  }
  return { store: readFromMemory(), backend };
}

async function persist(store: AppStore, backend: DataBackend) {
  if (backend === "supabase") {
    await writeToSupabase(store);
    return;
  }
  if (backend === "local") {
    await writeToLocal(store);
    return;
  }
  writeToMemory(store);
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
  return demo;
}

export async function getActiveDataBackend(): Promise<DataBackend> {
  return resolveBackend();
}

export { emptyStore };
