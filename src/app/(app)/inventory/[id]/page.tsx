"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Button,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
} from "@/components/ui/primitives";

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState({ transaction_type: "RECEIVE", quantity: 1, reason: "" });

  const load = () =>
    apiGet(`/api/inventory/${params.id}`)
      .then(setData)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [params.id]);

  if (loading || !data) return <LoadingState />;
  const item = data.item;

  return (
    <div>
      <PageHeader title={item.item_name} subtitle={`${item.brand} ${item.model}`.trim() || "Inventory item detail"} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2 space-y-2 text-sm">
          <div className="flex gap-2"><StatusBadge status={item.status} /><span className="badge">{item.category}</span></div>
          <div>SKU: {item.sku || "—"}</div>
          <div>Specification: {item.specification || "Specification not confirmed"}</div>
          <div>Quantity: {item.quantity} · Reserved: {item.reserved_quantity} · Available: {Math.max(0, item.quantity - item.reserved_quantity)}</div>
          <div>Min stock: {item.minimum_stock}</div>
          <div>Unit cost: {formatCurrency(item.unit_cost)} · GST: {item.gst_percent}% · Total: {formatCurrency(item.total_value)}</div>
          <div>Supplier: {item.supplier || "—"} · Purchased: {formatDate(item.purchase_date)}</div>
          <div>Storage: {item.storage_location || "—"}</div>
          <div>Notes: {item.notes || "—"}</div>
          <div>
            Used in projects:{" "}
            {data.used_in?.length
              ? data.used_in.map((c: any) => c.component_name).join(", ")
              : "None linked"}
          </div>
        </Panel>
        <Panel>
          <h3 className="font-semibold mb-3">Record Transaction</h3>
          <div className="space-y-2">
            <Select value={tx.transaction_type} onChange={(e) => setTx({ ...tx, transaction_type: e.target.value })}>
              {["PURCHASE","RECEIVE","ISSUE","RESERVE","RETURN","ADJUSTMENT","DAMAGE"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Input type="number" value={tx.quantity} onChange={(e) => setTx({ ...tx, quantity: Number(e.target.value) })} />
            <Input placeholder="Reason" value={tx.reason} onChange={(e) => setTx({ ...tx, reason: e.target.value })} />
            <Button
              variant="primary"
              onClick={async () => {
                await apiSend("/api/inventory/transactions", "POST", {
                  inventory_item_id: item.id,
                  ...tx,
                });
                load();
              }}
            >
              Save Transaction
            </Button>
          </div>
        </Panel>
      </div>
      <Panel className="mt-4">
        <h3 className="font-semibold mb-3">Transaction History</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Type</th>
                <th>Qty</th>
                <th>Previous</th>
                <th>New</th>
                <th>Reason</th>
                <th>Reference</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t: any) => (
                <tr key={t.id}>
                  <td><StatusBadge status={t.transaction_type} /></td>
                  <td>{t.quantity}</td>
                  <td>{t.previous_stock}</td>
                  <td>{t.new_stock}</td>
                  <td>{t.reason}</td>
                  <td>{t.reference || "—"}</td>
                  <td>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
