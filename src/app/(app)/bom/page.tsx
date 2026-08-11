"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { RobotProject } from "@/types";
import { apiGet } from "@/lib/client-api";
import { LoadingState, PageHeader, Panel } from "@/components/ui/primitives";

export default function BomIndex() {
  const [projects, setProjects] = useState<RobotProject[]>([]);
  useEffect(() => {
    apiGet<RobotProject[]>("/api/projects").then(setProjects);
  }, []);
  return (
    <div>
      <PageHeader title="BOM / Components" subtitle="Bills of materials grouped by engineering category." />
      {!projects.length ? <LoadingState /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/bom/${p.id}`}><Panel className="font-semibold hover:border-[var(--accent)]">{p.name}</Panel></Link>
          ))}
        </div>
      )}
    </div>
  );
}
