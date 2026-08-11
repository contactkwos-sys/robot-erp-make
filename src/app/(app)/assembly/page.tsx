"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AssemblyStep, RobotProject } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import {
  Button,
  LoadingState,
  PageHeader,
  Panel,
  ProgressBar,
} from "@/components/ui/primitives";

export default function AssemblyIndexOrDetail() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId;
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [steps, setSteps] = useState<AssemblyStep[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      apiGet<RobotProject[]>("/api/projects").then(setProjects).finally(() => setLoading(false));
      return;
    }
    apiGet<AssemblyStep[]>(`/api/projects/${projectId}/assembly`)
      .then((s) => {
        setSteps(s);
        setIndex(0);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <LoadingState />;

  if (!projectId) {
    return (
      <div>
        <PageHeader title="Assembly Guide" subtitle="Step-by-step mechanical and electronics assembly." />
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/assembly/${p.id}`}>
              <Panel className="font-semibold hover:border-[var(--accent)]">{p.name}</Panel>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const step = steps[index];
  const progress = steps.length ? Math.round((steps.filter((s) => s.completed).length / steps.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Assembly Guide" subtitle="Complete each step, mark done, then continue." />
      <Panel className="mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>Overall completion</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </Panel>
      {step ? (
        <Panel className="animate-fade-up">
          <div className="font-mono text-xs text-[var(--fg-muted)]">
            STEP {String(step.step_number).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </div>
          <h2 className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {step.title}
          </h2>
          <p className="mt-3 text-sm">{step.instructions}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--fg-muted)]">Required components</div>
              <ul className="mt-1 list-disc pl-5">
                {step.required_components.map((c) => (
                  <li key={c}>
                    {c} {step.quantities[c] ? `× ${step.quantities[c]}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase text-[var(--fg-muted)]">Tools</div>
              <ul className="mt-1 list-disc pl-5">
                {step.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>Installation location: {step.installation_location}</div>
            <div className="text-[var(--warning)]">Safety: {step.safety_warning}</div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={step.completed}
              onChange={async (e) => {
                const updated = await apiSend<AssemblyStep[]>(`/api/projects/${projectId}/assembly`, "PATCH", {
                  step_id: step.id,
                  completed: e.target.checked,
                });
                setSteps(updated);
              }}
            />
            Completion checkbox
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Previous</Button>
            <Button disabled={index >= steps.length - 1} onClick={() => setIndex((i) => i + 1)}>Next</Button>
            <Button
              variant="primary"
              onClick={async () => {
                const updated = await apiSend<AssemblyStep[]>(`/api/projects/${projectId}/assembly`, "PATCH", {
                  step_id: step.id,
                  completed: true,
                });
                setSteps(updated);
                if (index < steps.length - 1) setIndex((i) => i + 1);
              }}
            >
              Mark Complete
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel>No assembly steps yet. Run AI analysis on the project first.</Panel>
      )}
    </div>
  );
}
