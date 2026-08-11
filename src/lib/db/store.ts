import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AppStore } from "@/types";
import { createDemoStore } from "@/lib/db/demo-data";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const TMP_STORE_PATH = path.join("/tmp", "ai-robot-builder-store.json");

/** In-memory fallback for serverless (Netlify/Lambda) where the filesystem is read-only. */
let memoryStore: AppStore | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let persistenceMode: "file" | "tmp" | "memory" | null = null;

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

function isServerlessRuntime() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.VERCEL
  );
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

function cloneStore(store: AppStore): AppStore {
  return JSON.parse(JSON.stringify(store)) as AppStore;
}

async function ensureStore(): Promise<AppStore> {
  if (memoryStore) return cloneStore(memoryStore);

  // Prefer durable local file in development
  const fromDisk = await tryReadFile(STORE_PATH);
  if (fromDisk) {
    persistenceMode = "file";
    memoryStore = fromDisk;
    return cloneStore(memoryStore);
  }

  // Warm serverless instance may have /tmp data
  const fromTmp = await tryReadFile(TMP_STORE_PATH);
  if (fromTmp) {
    persistenceMode = "tmp";
    memoryStore = fromTmp;
    return cloneStore(memoryStore);
  }

  const demo = createDemoStore();
  memoryStore = demo;

  if (!isServerlessRuntime()) {
    const wrote = await tryWriteFile(STORE_PATH, demo);
    persistenceMode = wrote ? "file" : "memory";
  } else {
    const wroteTmp = await tryWriteFile(TMP_STORE_PATH, demo);
    persistenceMode = wroteTmp ? "tmp" : "memory";
  }

  return cloneStore(memoryStore);
}

async function persist(store: AppStore) {
  memoryStore = cloneStore(store);

  writeQueue = writeQueue.then(async () => {
    if (persistenceMode === "file" || persistenceMode === null) {
      if (await tryWriteFile(STORE_PATH, store)) {
        persistenceMode = "file";
        return;
      }
    }
    if (persistenceMode === "tmp" || persistenceMode === "file" || persistenceMode === null) {
      if (await tryWriteFile(TMP_STORE_PATH, store)) {
        persistenceMode = "tmp";
        return;
      }
    }
    persistenceMode = "memory";
  });

  await writeQueue;
}

export async function readStore(): Promise<AppStore> {
  return ensureStore();
}

export async function updateStore(
  mutator: (store: AppStore) => void | Promise<void>
): Promise<AppStore> {
  const store = await ensureStore();
  await mutator(store);
  await persist(store);
  return store;
}

export async function resetStore(): Promise<AppStore> {
  const demo = createDemoStore();
  await persist(demo);
  return demo;
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

/** Runtime mode info for UI banners and settings. */
export function getRuntimeMode() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const aiProvider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const hasAiKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY
  );
  const demoMode = !supabaseConfigured || aiProvider === "mock" || !hasAiKey;

  return {
    demo_mode: demoMode,
    backend: supabaseConfigured ? ("supabase" as const) : ("local" as const),
    persistence: persistenceMode || (isServerlessRuntime() ? "memory" : "file"),
    ai_provider: aiProvider,
    supabase_configured: supabaseConfigured,
    serverless: isServerlessRuntime(),
  };
}

export { emptyStore };
