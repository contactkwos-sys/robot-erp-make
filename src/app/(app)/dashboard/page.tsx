"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/types";
import { apiGet } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  ProgressBar,
  StatCard,
  StatusBadge,
} from "@/components/ui/primitives";
import {
  Bot,
  PlusSquare,
  ScanSearch,
  Boxes,
  Warehouse,
  Camera,
  ShoppingCart,
  GitCompare,
  Wrench,
  Cable,
  Calculator,
  Workflow,
  HeartHandshake,
  Printer,
} from "lucide-react";

const MODULES = [
  {
    href: "/easy",
    title: "Easiest Robot",
    body: "Beginner hobby path with Gemini / ChatGPT / Claude prompts.",
    icon: HeartHandshake,
  },
  {
    href: "/print",
    title: "3D Print / Bambu Handy",
    body: "Send robot parts to printer via AnyDesk, UltraViewer, or Handy.",
    icon: Printer,
  },
  {
    href: "/plan",
    title: "Robot Plan Chart",
    body: "Hinglish flowchart: idea → stock → print → code → finish.",
    icon: Workflow,
  },
  {
    href: "/robots",
    title: "My Robots",
    body: "Browse and manage robot projects.",
    icon: Bot,
  },
  {
    href: "/robots/create",
    title: "Create New Robot",
    body: "Start a new build from idea to machine.",
    icon: PlusSquare,
  },
  {
    href: "/analysis",
    title: "Robot Analysis",
    body: "AI breakdown of systems and requirements.",
    icon: ScanSearch,
  },
  {
    href: "/bom",
    title: "BOM / Components",
    body: "Bill of materials and part specifications.",
    icon: Boxes,
  },
  {
    href: "/inventory",
    title: "Inventory",
    body: "Stock levels, reservations, and shortages.",
    icon: Warehouse,
  },
  {
    href: "/scanner",
    title: "Product Scanner",
    body: "Extract product data from screenshots.",
    icon: Camera,
  },
  {
    href: "/purchases",
    title: "Purchase Required",
    body: "Buy only the missing quantities.",
    icon: ShoppingCart,
  },
  {
    href: "/comparison",
    title: "Product Comparison",
    body: "Compare candidate parts side by side.",
    icon: GitCompare,
  },
  {
    href: "/assembly",
    title: "Assembly Guide",
    body: "Step-by-step mechanical assembly.",
    icon: Wrench,
  },
  {
    href: "/wiring",
    title: "Wiring Guide",
    body: "Connections, polarity, and pinouts.",
    icon: Cable,
  },
  {
    href: "/costing",
    title: "Costing",
    body: "Project cost rollups and estimates.",
    icon: Calculator,
  },
];

type RuntimeSettings = {
  demo_mode?: boolean;
  backend?: string;
  ai_provider?: string;
  message?: string;
  database_setup_required?: boolean;
  warning?: string | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [runtime, setRuntime] = useState<RuntimeSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);

  const checkDatabase = async () => {
    try {
      const health = await apiGet<{
        status?: string;
        warning?: string | null;
        database?: { message?: string; setup_required?: boolean };
      }>("/api/health");
      const msg =
        health.database?.message ||
        health.warning ||
        (health.status === "ok" ? "Database healthy." : "Database check completed.");
      setHealthMessage(msg);
      if (!health.database?.setup_required && health.status === "ok") {
        setError(null);
        await load();
      }
    } catch (e) {
      setHealthMessage(e instanceof Error ? e.message : "Database check failed");
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, settings] = await Promise.all([
        apiGet<DashboardStats>("/api/dashboard"),
        apiGet<RuntimeSettings>("/api/settings").catch(
          (): RuntimeSettings => ({
            demo_mode: true,
            message: "DEMO MODE",
            database_setup_required: false,
            warning: null,
          })
        ),
      ]);
      setStats(dash);
      setRuntime(settings);
      if (settings.database_setup_required) {
        setError(settings.warning || settings.message || "Database setup required");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error && !stats) {
    return <ErrorState message={error} onRetry={load} onCheckDatabase={checkDatabase} />;
  }
  if (!stats) {
    return (
      <EmptyState
        title="No data"
        body="Seed the demo project to get started."
        action={
          <Button
            variant="primary"
            onClick={async () => {
              await fetch("/api/seed", { method: "POST" });
              load();
            }}
          >
            Load Demo Data
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {runtime?.database_setup_required || error ? (
        <div className="mb-4">
          <ErrorState
            message={error || runtime?.warning || runtime?.message || "Database setup required"}
            onRetry={load}
            onCheckDatabase={checkDatabase}
          />
          {healthMessage ? (
            <p className="mt-2 text-xs text-[var(--fg-muted)]">{healthMessage}</p>
          ) : null}
        </div>
      ) : runtime?.demo_mode ? (
        <div className="mb-4 rounded-lg border border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-4 py-3 text-sm animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">DEMO MODE</Badge>
            <span>
              {runtime.message ||
                "Running without Supabase / AI keys. Full workflow uses local demo data and mock AI."}
            </span>
          </div>
        </div>
      ) : null}

      <PageHeader
        title="AI ROBOT BUILDER"
        subtitle="From Robot Idea to Working Machine — operational dashboard for projects, inventory, and procurement."
        actions={
          <>
            <Link href="/robots/create">
              <Button variant="primary">Create Robot</Button>
            </Link>
            <Button
              onClick={async () => {
                await fetch("/api/seed", { method: "POST" });
                load();
              }}
            >
              Reset Demo Data
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group panel rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_50%,var(--border))]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg-muted)] p-2 text-[var(--accent)] transition group-hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border))]">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-semibold">{mod.title}</div>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">{mod.body}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Robot Projects" value={stats.total_projects} />
        <StatCard label="Active Projects" value={stats.active_projects} />
        <StatCard label="Completed Projects" value={stats.completed_projects} />
        <StatCard label="Inventory Items" value={stats.total_inventory_items} />
        <StatCard label="Missing Components" value={stats.missing_components} hint="Across all projects" />
        <StatCard label="Pending Purchases" value={stats.pending_purchases} />
        <StatCard label="Inventory Value" value={formatCurrency(stats.total_inventory_value)} />
        <StatCard label="Current Project Cost" value={formatCurrency(stats.current_project_cost)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Assembly Progress</h2>
            <Badge tone="info">{stats.assembly_progress}%</Badge>
          </div>
          <ProgressBar value={stats.assembly_progress} />
          <div className="mt-6">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              Recent Projects
            </h3>
            <div className="space-y-2">
              {stats.recent_projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/robots/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-3 hover:bg-[var(--bg-muted)]"
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--fg-muted)]">{p.purpose}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.progress} />
                    <div className="mt-1 text-xs text-[var(--fg-muted)]">{p.progress_percent}%</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="font-semibold mb-3">AI Warnings</h2>
          <div className="space-y-3">
            {stats.ai_warnings.length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">No active warnings.</p>
            ) : (
              stats.ai_warnings.map((w) => (
                <div key={w.id} className="rounded-lg border border-[var(--border)] p-3">
                  <Badge tone={w.severity === "critical" ? "danger" : "warning"}>{w.severity}</Badge>
                  <div className="mt-2 font-medium text-sm">{w.title}</div>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">{w.body}</p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold mb-3">Recent Inventory Additions</h2>
          {stats.recent_inventory.map((i) => (
            <Link
              key={i.id}
              href={`/inventory/${i.id}`}
              className="flex justify-between border-b border-[var(--border)] py-2 text-sm last:border-0"
            >
              <span>{i.item_name}</span>
              <StatusBadge status={i.status} />
            </Link>
          ))}
        </Panel>
        <Panel>
          <h2 className="font-semibold mb-3">Recent Product Screenshots</h2>
          {stats.recent_scans.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">No scans yet.</p>
          ) : (
            stats.recent_scans.map((s) => (
              <div key={s.id} className="flex justify-between border-b border-[var(--border)] py-2 text-sm last:border-0">
                <span>{s.file_name}</span>
                <StatusBadge status={s.status.toUpperCase()} />
              </div>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
