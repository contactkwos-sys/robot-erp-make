import type { AppStore } from "@/types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

/** Logical collections stored inside app_stores.payload (not separate SQL tables). */
export const APP_STORE_COLLECTIONS = [
  "users",
  "robot_projects",
  "robot_images",
  "robot_analysis",
  "components",
  "project_components",
  "inventory",
  "inventory_transactions",
  "products",
  "product_scans",
  "purchase_items",
  "purchase_orders",
  "assembly_steps",
  "wiring_connections",
  "documents",
  "ai_recommendations",
  "project_costs",
] as const;

export type AppStoreCollection = (typeof APP_STORE_COLLECTIONS)[number];

export type TableHealth = {
  name: string;
  kind: "sql_table" | "store_collection";
  present: boolean;
  detail?: string;
};

export type DatabaseHealth = {
  ok: boolean;
  setup_required: boolean;
  supabase_configured: boolean;
  supabase_url_set: boolean;
  anon_key_set: boolean;
  service_role_key_set: boolean;
  app_stores_table: boolean;
  message: string;
  tables: TableHealth[];
  missing: string[];
};

function envFlags() {
  return {
    supabase_url_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anon_key_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    service_role_key_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

function isMissingRelationError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("pgrst205")
  );
}

export function classifyStoreError(error: unknown): {
  setup_required: boolean;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  if (isMissingRelationError(message) || message.toLowerCase().includes("app_stores")) {
    return {
      setup_required: true,
      message:
        "Database setup required — public.app_stores is missing. Run supabase/migrations/20260811165000_create_app_stores.sql (or supabase/schema.sql).",
    };
  }
  if (message.toLowerCase().includes("not configured")) {
    return {
      setup_required: true,
      message:
        "Database setup required — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  return { setup_required: false, message };
}

export async function checkDatabaseHealth(store?: AppStore | null): Promise<DatabaseHealth> {
  const flags = envFlags();
  const supabase_configured = isSupabaseConfigured();
  const tables: TableHealth[] = [];
  let app_stores_table = false;
  let setup_required = false;
  let message = "Database healthy";

  if (!supabase_configured) {
    setup_required = true;
    message =
      "Database setup required — Supabase environment variables are incomplete.";
  } else {
    const client = createServerSupabaseClient();
    if (!client) {
      setup_required = true;
      message = "Database setup required — could not create Supabase client.";
    } else {
      const { error } = await client.from("app_stores").select("owner_key").limit(1);
      if (error) {
        app_stores_table = !isMissingRelationError(error.message);
        setup_required = isMissingRelationError(error.message);
        message = setup_required
          ? "Database setup required — public.app_stores was not found in the schema cache."
          : `Supabase query failed (${error.message}).`;
        tables.push({
          name: "app_stores",
          kind: "sql_table",
          present: app_stores_table,
          detail: error.message,
        });
      } else {
        app_stores_table = true;
        tables.push({
          name: "app_stores",
          kind: "sql_table",
          present: true,
          detail: "SQL table reachable via PostgREST",
        });
      }
    }
  }

  if (!tables.some((t) => t.name === "app_stores")) {
    tables.push({
      name: "app_stores",
      kind: "sql_table",
      present: false,
      detail: "Not checked — Supabase not configured",
    });
  }

  for (const name of APP_STORE_COLLECTIONS) {
    const present = Boolean(store && Array.isArray((store as AppStore)[name]));
    tables.push({
      name,
      kind: "store_collection",
      present,
      detail: present
        ? `Present in app_stores.payload (${(store as AppStore)[name].length} rows)`
        : store
          ? "Missing from loaded store payload"
          : "Not verified (store not loaded)",
    });
  }

  const missing = tables.filter((t) => !t.present).map((t) => t.name);
  const ok = !setup_required && app_stores_table && missing.filter((n) => n === "app_stores").length === 0;

  if (ok && missing.length) {
    message = `app_stores OK; some payload collections missing: ${missing.join(", ")}`;
  } else if (ok) {
    message = "Database healthy — app_stores available and store collections present.";
  }

  return {
    ok,
    setup_required: setup_required || !app_stores_table,
    supabase_configured,
    ...flags,
    app_stores_table,
    message,
    tables,
    missing,
  };
}
