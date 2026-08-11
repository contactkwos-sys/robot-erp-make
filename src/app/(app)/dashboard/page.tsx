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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await apiGet<DashboardStats>("/api/dashboard"));
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
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <EmptyState title="No data" body="Seed the demo project to get started." />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview of robot projects, inventory health, and procurement."
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
