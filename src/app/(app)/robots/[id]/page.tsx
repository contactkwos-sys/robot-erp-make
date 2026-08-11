"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type {
  AssemblyStep,
  ProjectComponent,
  ProjectCost,
  PurchaseItem,
  RobotAnalysis,
  RobotImage,
  RobotProject,
  WiringConnection,
  AiRecommendation,
  EngineeringCheck,
  ProjectProgress,
} from "@/types";
import { PROGRESS_STEPS } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { useAppSettings } from "@/contexts/app-settings";
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/ui/primitives";

type Detail = {
  project: RobotProject;
  images: RobotImage[];
  analysis: RobotAnalysis[];
  components: ProjectComponent[];
  purchases: PurchaseItem[];
  assembly: AssemblyStep[];
  wiring: WiringConnection[];
  cost: ProjectCost | null;
  recommendations: AiRecommendation[];
  engineering: EngineeringCheck[];
};

export default function RobotDetailPage() {
  const params = useParams<{ id: string }>();
  const { beginnerMode } = useAppSettings();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<Detail>(`/api/projects/${params.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const analysis = data?.analysis[0];
  const selectedComponent = useMemo(() => {
    if (!data || !selectedMarker || !analysis) return null;
    const marker = analysis.markers.find((m) => m.id === selectedMarker);
    if (!marker) return null;
    return data.components.find((c) => c.component_name === marker.component_name) || null;
  }, [data, selectedMarker, analysis]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { project } = data;
  const cover = project.cover_image_url || data.images[0]?.file_path || "/demo/inspection-robot.svg";

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.purpose}
        actions={
          <>
            <Button
              onClick={async () => {
                await apiSend(`/api/projects/${project.id}/analyze`, "POST");
                setMessage("AI analysis refreshed.");
                load();
              }}
            >
              Re-run Analysis
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const res = await apiSend<{ message: string }>(`/api/projects/${project.id}/approve`, "POST");
                setMessage(res.message);
                load();
              }}
            >
              Approve & Reserve Stock
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await apiSend(`/api/projects/${project.id}/progress`, "PATCH", {
                  progress: "COMPLETED" satisfies ProjectProgress,
                });
                load();
              }}
            >
              Mark Completed
            </Button>
          </>
        }
      />

      {message ? (
        <Panel className="mb-4 border-[color-mix(in_oklab,var(--success)_40%,var(--border))]">{message}</Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Panel className="lg:col-span-2">
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">Project Progress</h2>
            <Badge tone="info">{project.progress_percent}%</Badge>
          </div>
          <ProgressBar value={project.progress_percent} />
          <div className="mt-4 flex flex-wrap gap-2">
            {PROGRESS_STEPS.map((step) => (
              <button
                key={step}
                className="badge"
                onClick={async () => {
                  await apiSend(`/api/projects/${project.id}/progress`, "PATCH", { progress: step });
                  load();
                }}
              >
                {step.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">Quick Links</div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href={`/analysis/${project.id}`}>Robot Analysis</Link>
            <Link href={`/bom/${project.id}`}>BOM / Components</Link>
            <Link href={`/assembly/${project.id}`}>Assembly Guide</Link>
            <Link href={`/wiring/${project.id}`}>Wiring Guide</Link>
            <Link href="/purchases">Purchase Required</Link>
            <Link href="/costing">Costing</Link>
          </div>
          {data.cost ? (
            <div className="mt-4 space-y-1 text-sm">
              <div>Existing stock: {formatCurrency(data.cost.existing_inventory_value)}</div>
              <div>New purchase: {formatCurrency(data.cost.new_purchase_cost)}</div>
              <div className="font-semibold">Total: {formatCurrency(data.cost.total_robot_cost)}</div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <h2 className="font-semibold mb-3">Robot Image Component Mapping</h2>
          <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={project.name} className="w-full object-contain max-h-[420px]" />
            {analysis?.markers.map((m) => (
              <button
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] text-white text-[10px] font-mono px-2 py-1 shadow"
                style={{ left: `${m.x_percent}%`, top: `${m.y_percent}%` }}
                onClick={() => setSelectedMarker(m.id)}
                title={m.component_name}
              >
                {m.label}
              </button>
            ))}
          </div>
          {selectedComponent ? (
            <div className="mt-4 rounded-lg border border-[var(--border)] p-3 space-y-2 text-sm">
              <div className="font-semibold">{selectedComponent.component_name}</div>
              <div>Purpose: {selectedComponent.purpose}</div>
              <div>Quantity: {selectedComponent.quantity}</div>
              <div>Specification: {selectedComponent.suggested_specification}</div>
              <div className="flex gap-2">
                <StatusBadge status={selectedComponent.inventory_status} />
                <StatusBadge status={selectedComponent.purchase_status} />
              </div>
              <div>Installation: {selectedComponent.installation_location}</div>
              <div>Wiring: See wiring guide for connections.</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--fg-muted)]">Click a marker to inspect a component.</p>
          )}
        </Panel>

        <Panel>
          <h2 className="font-semibold mb-3">AI Analysis Summary</h2>
          <p className="text-sm text-[var(--fg-muted)]">{analysis?.summary || "No analysis yet."}</p>
          <div className="mt-3 space-y-2">
            {analysis?.warnings.map((w, i) => (
              <div key={i} className="text-sm rounded-md border border-[var(--border)] p-2">
                <Badge tone="warning">Warning</Badge>
                <div className="mt-1">{w}</div>
              </div>
            ))}
          </div>
          {data.engineering[0] ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">Engineering Check</h3>
                <StatusBadge status={data.engineering[0].overall_status} />
              </div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {data.engineering[0].items.map((item) => (
                  <div key={item.id} className="text-sm border-b border-[var(--border)] pb-2">
                    <div className="flex justify-between gap-2">
                      <span>{item.check_name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-[var(--fg-muted)] mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="font-semibold mb-3">Components</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Component</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Available</th>
                <th>Missing</th>
                <th>Status</th>
                <th>Spec</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="underline" href={`/components/${c.id}`}>
                      {c.component_name}
                    </Link>
                    {beginnerMode ? (
                      <div className="mt-2 text-xs text-[var(--fg-muted)] space-y-1">
                        <div>
                          <strong>What is it?</strong> {c.beginner_what_is_it}
                        </div>
                        <div>
                          <strong>What does it do?</strong> {c.beginner_what_does_it_do}
                        </div>
                        <div>
                          <strong>Where does it fit?</strong> {c.beginner_where_fits}
                        </div>
                        <div>
                          <strong>What else?</strong> {c.beginner_what_else.join(", ")}
                        </div>
                      </div>
                    ) : null}
                  </td>
                  <td>{c.category}</td>
                  <td>{c.quantity}</td>
                  <td>{c.available_quantity}</td>
                  <td>{c.missing_quantity}</td>
                  <td>
                    <StatusBadge status={c.inventory_status} />
                  </td>
                  <td className="max-w-xs">{c.suggested_specification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
