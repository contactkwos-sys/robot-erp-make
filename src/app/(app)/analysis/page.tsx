"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RobotProject } from "@/types";
import { apiGet } from "@/lib/client-api";
import { LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui/primitives";

export default function AnalysisIndexPage() {
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGet<RobotProject[]>("/api/projects").then(setProjects).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingState />;
  return (
    <div>
      <PageHeader title="Robot Analysis" subtitle="Select a project to view AI component identification and markers." />
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/analysis/${p.id}`}>
            <Panel className="hover:border-[var(--accent)] transition">
              <div className="font-semibold">{p.name}</div>
              <div className="mt-2"><StatusBadge status={p.progress} /></div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
