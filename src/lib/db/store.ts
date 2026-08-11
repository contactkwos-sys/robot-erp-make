import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AppStore } from "@/types";
import { createDemoStore } from "@/lib/db/demo-data";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

let writeQueue: Promise<void> = Promise.resolve();

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

async function ensureStore(): Promise<AppStore> {
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

async function persist(store: AppStore) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
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

export { emptyStore };
