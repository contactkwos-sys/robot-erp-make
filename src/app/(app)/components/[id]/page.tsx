"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ProjectComponent, RobotProject } from "@/types";
import { apiGet } from "@/lib/client-api";
import { useAppSettings } from "@/contexts/app-settings";
import { LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui/primitives";

export default function ComponentDetailPage() {
  const params = useParams<{ id: string }>();
  const { beginnerMode } = useAppSettings();
  const [component, setComponent] = useState<ProjectComponent | null>(null);
  const [project, setProject] = useState<RobotProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const projects = await apiGet<RobotProject[]>("/api/projects");
      for (const p of projects) {
        const detail = await apiGet<{ project: RobotProject; components: ProjectComponent[] }>(
          `/api/projects/${p.id}`
        );
        const found = detail.components.find((c) => c.id === params.id);
        if (found) {
          setComponent(found);
          setProject(detail.project);
          break;
        }
      }
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (!component) return <Panel>Component not found.</Panel>;

  return (
    <div>
      <PageHeader title={component.component_name} subtitle={project?.name || "Component detail"} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-2 text-sm">
          <div className="flex gap-2">
            <StatusBadge status={component.category} />
            <StatusBadge status={component.inventory_status} />
            <StatusBadge status={component.purchase_status} />
          </div>
          <div>Purpose: {component.purpose}</div>
          <div>Specification: {component.suggested_specification}</div>
          <div>
            Stock — required {component.quantity}, available {component.available_quantity}, missing{" "}
            {component.missing_quantity}, reserved {component.reserved_quantity}
          </div>
          <div>Installation location: {component.installation_location}</div>
          <div>Where used: {component.where_used}</div>
          <div>Confidence: {Math.round(component.confidence * 100)}%</div>
          <div>Notes: {component.notes || "—"}</div>
          <div>Wiring: See project wiring guide for pin-level connections.</div>
          <div>Documents / datasheet: upload via Documents module.</div>
        </Panel>
        <Panel>
          <h2 className="font-semibold mb-2">AI Explanation</h2>
          {beginnerMode ? (
            <div className="space-y-2 text-sm">
              <div><strong>What is it?</strong> {component.beginner_what_is_it}</div>
              <div><strong>What does it do?</strong> {component.beginner_what_does_it_do}</div>
              <div><strong>Where does it fit?</strong> {component.beginner_where_fits}</div>
              <div><strong>How many?</strong> {component.quantity}</div>
              <div><strong>What else is required?</strong> {component.beginner_what_else.join(", ")}</div>
            </div>
          ) : (
            <p className="text-sm text-[var(--fg-muted)]">
              Enable Beginner Mode in Settings or the top bar for plain-language explanations.
            </p>
          )}
          <div className="mt-4 text-sm">
            <div className="font-mono text-[10px] uppercase text-[var(--fg-muted)]">Compatible / related</div>
            <ul className="mt-1 list-disc pl-5">
              {component.beginner_what_else.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}
