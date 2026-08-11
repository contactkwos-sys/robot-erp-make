"use client";

import { useEffect, useState } from "react";
import type { ProjectCost, RobotProject } from "@/types";
import { apiGet } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { LoadingState, PageHeader, Panel, Select, StatCard } from "@/components/ui/primitives";

export default function CostingPage() {
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [cost, setCost] = useState<ProjectCost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<RobotProject[]>("/api/projects").then((p) => {
      setProjects(p);
      if (p[0]) setProjectId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiGet<ProjectCost>(`/api/projects/${projectId}/cost`)
      .then(setCost)
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div>
      <PageHeader title="Project Costing" subtitle="Existing stock value, new purchase cost, and total robot cost." />
      <Panel className="mb-4 max-w-md">
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </Panel>
      {loading || !cost ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <StatCard label="Existing Stock Value" value={formatCurrency(cost.existing_inventory_value)} />
            <StatCard label="New Purchase Cost" value={formatCurrency(cost.new_purchase_cost)} />
            <StatCard label="Total Robot Cost" value={formatCurrency(cost.total_robot_cost)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Mechanical" value={formatCurrency(cost.mechanical)} />
            <StatCard label="Electronics" value={formatCurrency(cost.electronics)} />
            <StatCard label="Sensors" value={formatCurrency(cost.sensors)} />
            <StatCard label="Battery / Power" value={formatCurrency(cost.battery)} />
            <StatCard label="Wiring" value={formatCurrency(cost.wiring)} />
            <StatCard label="Fasteners" value={formatCurrency(cost.fasteners)} />
            <StatCard label="Tools" value={formatCurrency(cost.tools)} />
            <StatCard label="Purchase" value={formatCurrency(cost.purchase)} />
            <StatCard label="Shipping" value={formatCurrency(cost.shipping)} />
            <StatCard label="GST" value={formatCurrency(cost.gst)} />
          </div>
        </>
      )}
    </div>
  );
}
