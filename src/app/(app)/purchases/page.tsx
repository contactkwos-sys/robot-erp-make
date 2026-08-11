"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import {
  Button,
  LoadingState,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
} from "@/components/ui/primitives";

export default function PurchasesPage() {
  const [data, setData] = useState<{ items: any[]; orders: any[] } | null>(null);
  const [status, setStatus] = useState("REQUIRED");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const q = status ? `?status=${status}` : "";
    setData(await apiGet(`/api/purchases${q}`));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status]);

  if (loading || !data) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Purchase Required"
        subtitle="Smart procurement buys only missing quantities. Compatible stock is preferred."
        actions={
          <Button
            variant="primary"
            disabled={!selected.length}
            onClick={async () => {
              await apiSend("/api/purchases", "POST", { action: "create_order", item_ids: selected });
              setSelected([]);
              setMessage("Purchase order created.");
              load();
            }}
          >
            Create Purchase Order
          </Button>
        }
      />

      {message ? <Panel className="mb-4">{message}</Panel> : null}

      <Panel className="mb-4 flex flex-wrap gap-3 items-center">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="REQUIRED">Purchase Required</option>
          <option value="ORDERED">Ordered</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <div className="text-sm text-[var(--fg-muted)]">Orders: {data.orders.length}</div>
      </Panel>

      <div className="table-wrap panel mb-4">
        <table className="data">
          <thead>
            <tr>
              <th></th>
              <th>Item</th>
              <th>Required</th>
              <th>Available</th>
              <th>Purchase Qty</th>
              <th>Recommended</th>
              <th>Est. Price</th>
              <th>Est. Total</th>
              <th>Supplier</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.status === "REQUIRED" ? (
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                        )
                      }
                    />
                  ) : null}
                </td>
                <td>{item.item_name}</td>
                <td>{item.required_qty}</td>
                <td>{item.available_qty}</td>
                <td>{item.purchase_qty}</td>
                <td>{item.recommended_product_name}</td>
                <td>{formatCurrency(item.estimated_price)}</td>
                <td>{formatCurrency(item.estimated_total)}</td>
                <td>{item.supplier}</td>
                <td><StatusBadge status={item.priority} /></td>
                <td><StatusBadge status={item.status} /></td>
                <td className="space-x-2">
                  {item.status === "ORDERED" ? (
                    <Button
                      onClick={async () => {
                        await apiSend("/api/purchases", "POST", { action: "receive", item_id: item.id });
                        setMessage("Item received and inventory updated.");
                        load();
                      }}
                    >
                      Receive
                    </Button>
                  ) : null}
                  {item.status === "REQUIRED" || item.status === "ORDERED" ? (
                    <Button
                      onClick={async () => {
                        await apiSend("/api/purchases", "POST", { action: "cancel", item_id: item.id });
                        load();
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel>
        <h2 className="font-semibold mb-3">Purchase Orders / History</h2>
        {data.orders.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">No purchase orders yet.</p>
        ) : (
          <div className="space-y-2">
            {data.orders.map((o) => (
              <div key={o.id} className="flex justify-between border-b border-[var(--border)] py-2 text-sm">
                <div>
                  <div className="font-medium">{o.order_number}</div>
                  <div className="text-[var(--fg-muted)]">{o.supplier}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <div className="mt-1">{formatCurrency(o.total_estimated)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
