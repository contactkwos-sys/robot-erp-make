import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AppStore } from "@/types";
import { createDemoStore } from "@/lib/db/demo-data";
import { classifyStoreError } from "@/lib/db/health";
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
let lastStoreWarning: string | null = null;
let databaseSetupRequired = false;

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
    printer_profiles: [],
    printable_parts: [],
    print_jobs: [],
    robot_build_plans: [],
  };
}

/** Ensure older saved stores gain new collections without crashing. */
export function normalizeStore(store: AppStore): AppStore {
  const base = emptyStore();
  return {
    ...base,
    ...store,
    printer_profiles: Array.isArray(store.printer_profiles) ? store.printer_profiles : [],
    printable_parts: Array.isArray(store.printable_parts) ? store.printable_parts : [],
    print_jobs: Array.isArray(store.print_jobs) ? store.print_jobs : [],
    robot_build_plans: Array.isArray(store.robot_build_plans)
      ? store.robot_build_plans
      : [],
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
    return normalizeStore(JSON.parse(raw) as AppStore);
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

async function resolveFallbackBackend(): Promise<"local" | "tmp" | "memory"> {
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

function markSetupIssue(error: unknown) {
  const classified = classifyStoreError(error);
  lastStoreWarning = classified.message;
  if (classified.setup_required) {
    databaseSetupRequired = true;
  }
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
      `Supabase read failed (${error.message}). Ensure you ran supabase/migrations/20260811165000_create_app_stores.sql (app_stores table) and set SUPABASE_SERVICE_ROLE_KEY.`
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
        `Supabase seed failed (${insertError.message}). Create the app_stores table from supabase/migrations/20260811165000_create_app_stores.sql.`
      );
    }
    databaseSetupRequired = false;
    lastStoreWarning = null;
    return demo;
  }

  databaseSetupRequired = false;
  lastStoreWarning = null;
  return normalizeStore(data.payload as AppStore);
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

async function loadFallbackStore(reason: unknown): Promise<{ store: AppStore; backend: ResolvedBackend }> {
  markSetupIssue(reason);
  const fallback = await resolveFallbackBackend();
  if (fallback === "local") {
    lastPersistence = "file";
    return { store: await readFromLocal(), backend: "local" };
  }
  if (fallback === "tmp") {
    lastPersistence = "tmp";
    return { store: await readFromTmp(), backend: "tmp" };
  }
  lastPersistence = "memory";
  return { store: readFromMemory(), backend: "memory" };
}

async function ensureStore(): Promise<{ store: AppStore; backend: ResolvedBackend }> {
  const backend = await resolveBackend();
  if (backend === "supabase") {
    try {
      lastPersistence = "supabase";
      return { store: await readFromSupabase(), backend };
    } catch (error) {
      // Keep the dashboard usable when Supabase is misconfigured or tables are missing.
      return loadFallbackStore(error);
    }
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
    try {
      await writeToSupabase(store);
      lastPersistence = "supabase";
      databaseSetupRequired = false;
      lastStoreWarning = null;
      return;
    } catch (error) {
      markSetupIssue(error);
      const fallback = await resolveFallbackBackend();
      await persist(store, fallback);
      return;
    }
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
  return normalizeStore(store);
}

export async function updateStore(
  mutator: (store: AppStore) => void | Promise<void>
): Promise<AppStore> {
  const { store, backend } = await ensureStore();
  const normalized = normalizeStore(store);
  await mutator(normalized);
  await persist(normalized, backend);
  return normalized;
}

export async function resetStore(): Promise<AppStore> {
  const backend = await resolveBackend();
  const demo = createDemoStore();
  try {
    await persist(demo, backend);
  } catch (error) {
    markSetupIssue(error);
    const fallback = await resolveFallbackBackend();
    await persist(demo, fallback);
  }
  memoryStore = cloneStore(demo);
  return demo;
}

export async function getActiveDataBackend(): Promise<DataBackend | "tmp"> {
  // Ensure we have attempted a read so fallback state is accurate.
  await ensureStore();
  if (lastPersistence === "file") return "local";
  if (lastPersistence === "tmp") return "tmp";
  if (lastPersistence === "memory") return "memory";
  return "supabase";
}

export function getStoreWarning() {
  return lastStoreWarning;
}

export function isDatabaseSetupRequired() {
  return databaseSetupRequired;
}

/** Runtime mode info for UI banners and settings (compatible with Netlify DEMO MODE UI). */
export function getRuntimeMode() {
  const supabaseConfigured = isSupabaseConfigured();
  const aiProvider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const hasAiKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY
  );
  const demoMode = !supabaseConfigured || aiProvider === "mock" || !hasAiKey || databaseSetupRequired;

  return {
    demo_mode: demoMode,
    backend: supabaseConfigured ? ("supabase" as const) : ("local" as const),
    persistence: lastPersistence,
    ai_provider: aiProvider,
    supabase_configured: supabaseConfigured,
    serverless: isServerlessRuntime(),
    database_setup_required: databaseSetupRequired,
    warning: lastStoreWarning,
  };
}

export { emptyStore };
