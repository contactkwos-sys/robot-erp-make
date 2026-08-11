"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RobotProject } from "@/types";
import { apiGet } from "@/lib/client-api";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/ui/primitives";

export default function RobotsPage() {
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await apiGet<RobotProject[]>("/api/projects"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load robots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="My Robots"
        subtitle="All robot projects with progress tracking from idea to completed machine."
        actions={
          <Link href="/robots/create">
            <Button variant="primary">Create Robot</Button>
          </Link>
        }
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No robot projects yet"
          body="Create your first robot from an idea, sketch, or photo."
          action={
            <Link href="/robots/create">
              <Button variant="primary">Create Robot</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/robots/${p.id}`}>
              <Panel className="h-full hover:border-[var(--accent)] transition">
                <div className="aspect-video rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)] industrial-grid mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.cover_image_url || "/demo/inspection-robot.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-2">{p.purpose}</p>
                  </div>
                  <StatusBadge status={p.status.toUpperCase()} />
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-[var(--fg-muted)]">
                    <span>{p.progress.replaceAll("_", " ")}</span>
                    <span>{p.progress_percent}%</span>
                  </div>
                  <ProgressBar value={p.progress_percent} />
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
