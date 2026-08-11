"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiSend } from "@/lib/client-api";
import { useAppSettings } from "@/contexts/app-settings";
import { Badge, Button, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui/primitives";

type Detail = any;

export default function AnalysisDetailPage() {
  const params = useParams<{ projectId: string }>();
  const { beginnerMode } = useAppSettings();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () =>
    apiGet(`/api/projects/${params.projectId}`)
      .then(setData)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [params.projectId]);

  if (loading || !data) return <LoadingState />;
  const analysis = data.analysis?.[0];

  return (
    <div>
      <PageHeader
        title={`Analysis — ${data.project.name}`}
        subtitle="AI identifies probable components. Exact specs are never invented."
        actions={
          <Button
            variant="primary"
            onClick={async () => {
              setLoading(true);
              await apiSend(`/api/projects/${params.projectId}/analyze`, "POST");
              load();
            }}
          >
            Re-analyze
          </Button>
        }
      />
      <Panel className="mb-4">
        <p className="text-sm text-[var(--fg-muted)]">{analysis?.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(analysis?.warnings || []).map((w: string, i: number) => (
            <Badge key={i} tone="warning">{w}</Badge>
          ))}
        </div>
      </Panel>
      <div className="grid gap-3">
        {data.components.map((c: any) => (
          <Panel key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/components/${c.id}`} className="font-semibold underline">
                  {c.component_name}
                </Link>
                <div className="text-xs text-[var(--fg-muted)] mt-1">
                  {c.category} · Qty {c.quantity} · Confidence {Math.round(c.confidence * 100)}%
                </div>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={c.required ? "REQUIRED" : "OPTIONAL"} />
                <StatusBadge status={c.inventory_status} />
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm">
              <div>Purpose: {c.purpose}</div>
              <div>Where used: {c.where_used}</div>
              <div className="md:col-span-2">Specification: {c.suggested_specification}</div>
              <div className="md:col-span-2 text-[var(--fg-muted)]">Notes: {c.notes || "—"}</div>
            </div>
            {beginnerMode ? (
              <div className="mt-3 rounded-md bg-[var(--bg-muted)] p-3 text-sm space-y-1">
                <div><strong>What is it?</strong> {c.beginner_what_is_it}</div>
                <div><strong>What does it do?</strong> {c.beginner_what_does_it_do}</div>
                <div><strong>Where does it fit?</strong> {c.beginner_where_fits}</div>
                <div><strong>How many?</strong> {c.quantity}</div>
                <div><strong>What else is required?</strong> {c.beginner_what_else.join(", ")}</div>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
    </div>
  );
}
