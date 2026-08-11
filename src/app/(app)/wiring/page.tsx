"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RobotProject, WiringConnection } from "@/types";
import { apiGet } from "@/lib/client-api";
import { LoadingState, PageHeader, Panel } from "@/components/ui/primitives";

export default function WiringPage() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId;
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [connections, setConnections] = useState<WiringConnection[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      apiGet<RobotProject[]>("/api/projects").then(setProjects).finally(() => setLoading(false));
      return;
    }
    apiGet<WiringConnection[]>(`/api/projects/${projectId}/wiring`)
      .then(setConnections)
      .finally(() => setLoading(false));
  }, [projectId]);

  const nodes = useMemo(() => {
    const set = new Set<string>();
    connections.forEach((c) => {
      set.add(c.from_component);
      set.add(c.to_component);
    });
    return Array.from(set);
  }, [connections]);

  const filtered = selected
    ? connections.filter((c) => c.from_component === selected || c.to_component === selected)
    : connections;

  if (loading) return <LoadingState />;

  if (!projectId) {
    return (
      <div>
        <PageHeader title="Wiring Guide" subtitle="FROM → TO connections with safety verification warnings." />
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/wiring/${p.id}`}>
              <Panel className="font-semibold hover:border-[var(--accent)]">{p.name}</Panel>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wiring Guide"
        subtitle='Verify voltage, current and polarity before connecting. Unknown values show as REQUIRES VERIFICATION.'
      />

      <Panel className="mb-4">
        <h2 className="font-semibold mb-3">Wiring Diagram</h2>
        <div className="industrial-grid rounded-lg border border-[var(--border)] p-4 overflow-auto">
          <svg viewBox="0 0 900 420" className="min-w-[700px] w-full h-auto">
            {nodes.map((node, i) => {
              const x = 80 + (i % 4) * 200;
              const y = 60 + Math.floor(i / 4) * 140;
              const active = selected === node;
              return (
                <g key={node} onClick={() => setSelected(node)} style={{ cursor: "pointer" }}>
                  <rect
                    x={x}
                    y={y}
                    width={150}
                    height={54}
                    rx={8}
                    fill={active ? "#c45c26" : "#151b24"}
                    stroke={active ? "#e07a3d" : "#2a3544"}
                    strokeWidth={2}
                  />
                  <text x={x + 12} y={y + 32} fill="#e8eef5" fontSize="12" fontFamily="IBM Plex Mono, monospace">
                    {node.length > 18 ? node.slice(0, 18) + "…" : node}
                  </text>
                </g>
              );
            })}
            {connections.map((c) => {
              const from = nodes.indexOf(c.from_component);
              const to = nodes.indexOf(c.to_component);
              if (from < 0 || to < 0) return null;
              const x1 = 80 + (from % 4) * 200 + 150;
              const y1 = 60 + Math.floor(from / 4) * 140 + 27;
              const x2 = 80 + (to % 4) * 200;
              const y2 = 60 + Math.floor(to / 4) * 140 + 27;
              return (
                <line
                  key={c.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={selected && (c.from_component === selected || c.to_component === selected) ? "#3aa0c0" : "#5b6675"}
                  strokeWidth={selected && (c.from_component === selected || c.to_component === selected) ? 3 : 1.5}
                  opacity={0.85}
                />
              );
            })}
          </svg>
        </div>
        <p className="mt-2 text-xs text-[var(--warning)]">
          Verify voltage, current and polarity before connecting.
        </p>
      </Panel>

      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Pin</th>
                <th>Wire</th>
                <th>Purpose</th>
                <th>Voltage note</th>
                <th>Warning</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.from_component}</td>
                  <td>{c.to_component}</td>
                  <td>{c.pin}</td>
                  <td>{c.wire}</td>
                  <td>{c.purpose}</td>
                  <td>{c.voltage_note}</td>
                  <td className="text-[var(--warning)]">{c.warning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
