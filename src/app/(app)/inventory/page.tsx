"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ComponentCategory, InventoryItem, InventoryStatus } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/primitives";

const CATEGORIES: ComponentCategory[] = [
  "MECHANICAL",
  "ELECTRONICS",
  "POWER",
  "SENSORS",
  "WIRING",
  "FASTENERS",
  "TOOLS",
  "OTHER",
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_name: "",
    category: "ELECTRONICS" as ComponentCategory,
    brand: "",
    model: "",
    sku: "",
    specification: "",
    unit: "pcs",
    quantity: 1,
    minimum_stock: 0,
    unit_cost: 0,
    gst_percent: 18,
    supplier: "",
    storage_location: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      setItems(await apiGet<InventoryItem[]>(`/api/inventory?${params}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category, status]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock, reservations, costs, and storage locations."
        actions={<Button variant="primary" onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "Add Item"}</Button>}
      />

      <Panel className="mb-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Search name, brand, SKU…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {(["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "RESERVED", "ORDERED", "USED", "DAMAGED"] as InventoryStatus[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Button onClick={load}>Apply Filters</Button>
      </Panel>

      {showForm ? (
        <Panel className="mb-4 grid gap-3 md:grid-cols-2">
          <Input placeholder="Item name" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ComponentCategory })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <Input type="number" placeholder="Unit cost" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} />
          <Input placeholder="Storage location" value={form.storage_location} onChange={(e) => setForm({ ...form, storage_location: e.target.value })} />
          <Input type="number" placeholder="Min stock" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })} />
          <Textarea className="md:col-span-2" placeholder="Specification" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} />
          <Button
            variant="primary"
            onClick={async () => {
              await apiSend("/api/inventory", "POST", form);
              setShowForm(false);
              load();
            }}
          >
            Save Item
          </Button>
        </Panel>
      ) : null}

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No inventory items" body="Add components you already own." />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="table-wrap panel">
          <table className="data">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Unit Cost</th>
                <th>Value</th>
                <th>Location</th>
                <th>Status</th>
                <th>Used?</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="underline" href={`/inventory/${item.id}`}>{item.item_name}</Link>
                    <div className="text-xs text-[var(--fg-muted)]">{item.sku}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.brand || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reserved_quantity}</td>
                  <td>{Math.max(0, item.quantity - item.reserved_quantity)}</td>
                  <td>{formatCurrency(item.unit_cost)}</td>
                  <td>{formatCurrency(item.total_value)}</td>
                  <td>{item.storage_location || "—"}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <Button
                      disabled={Math.max(0, item.quantity - item.reserved_quantity) < 1}
                      onClick={async (e) => {
                        e.preventDefault();
                        await apiSend("/api/inventory/transactions", "POST", {
                          inventory_item_id: item.id,
                          transaction_type: "USE",
                          quantity: 1,
                          reason: "Used in robot build",
                        });
                        load();
                      }}
                    >
                      Use 1
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
