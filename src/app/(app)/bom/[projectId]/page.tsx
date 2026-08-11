"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui/primitives";

type BomGroup = {
  category: string;
  items: Array<{
    item_id: string;
    component_name: string;
    required_quantity: number;
    available_quantity: number;
    missing_quantity: number;
    unit_cost: number;
    total_cost: number;
    specification: string;
    purpose: string;
    installation_location: string;
    inventory_status: string;
    purchase_status: string;
  }>;
};

export default function BomDetailPage() {
  const params = useParams<{ projectId: string }>();
  const [groups, setGroups] = useState<BomGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<BomGroup[]>(`/api/projects/${params.projectId}/bom`)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [params.projectId]);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Bill of Materials" subtitle="Auto-generated from AI analysis and inventory comparison." />
      <div className="space-y-4">
        {groups.map((g) => (
          <Panel key={g.category}>
            <h2 className="font-mono text-sm tracking-wider mb-3">{g.category}</h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Req</th>
                    <th>Avail</th>
                    <th>Missing</th>
                    <th>Unit</th>
                    <th>Total</th>
                    <th>Spec</th>
                    <th>Purpose</th>
                    <th>Location</th>
                    <th>Inventory</th>
                    <th>Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((item) => (
                    <tr key={item.item_id}>
                      <td>{item.component_name}</td>
                      <td>{item.required_quantity}</td>
                      <td>{item.available_quantity}</td>
                      <td>{item.missing_quantity}</td>
                      <td>{formatCurrency(item.unit_cost)}</td>
                      <td>{formatCurrency(item.total_cost)}</td>
                      <td className="max-w-[180px]">{item.specification}</td>
                      <td>{item.purpose}</td>
                      <td>{item.installation_location}</td>
                      <td><StatusBadge status={item.inventory_status} /></td>
                      <td><StatusBadge status={item.purchase_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
