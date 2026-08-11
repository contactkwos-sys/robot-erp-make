"use client";

import { useEffect, useState } from "react";
import type { AiRecommendation } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { Badge, Button, LoadingState, PageHeader, Panel } from "@/components/ui/primitives";

export default function RecommendationsPage() {
  const [items, setItems] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    apiGet<AiRecommendation[]>("/api/recommendations")
      .then(setItems)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="AI Recommendations"
        subtitle="Procurement, safety, and engineering guidance. Smart procurement never over-buys stock you already have."
      />
      <div className="space-y-3">
        {items.map((item) => (
          <Panel key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone={item.severity === "critical" ? "danger" : item.severity === "warning" ? "warning" : "info"}>
                  {item.severity}
                </Badge>
                <h2 className="mt-2 font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{item.body}</p>
                <div className="mt-2 text-xs font-mono text-[var(--fg-muted)]">{item.category}</div>
              </div>
              <Button
                onClick={async () => {
                  await apiSend("/api/recommendations", "PATCH", { id: item.id, dismissed: true });
                  load();
                }}
              >
                Dismiss
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
