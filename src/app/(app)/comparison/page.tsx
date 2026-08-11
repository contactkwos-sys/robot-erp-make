"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatCurrency, notAvailable } from "@/lib/utils";
import {
  Badge,
  Button,
  LoadingState,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";

export default function ComparisonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Product[]>("/api/products").then(setProducts).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Product Comparison"
        subtitle="Compare 2–5 products. AI labels BEST VALUE, RECOMMENDED, and PREMIUM."
        actions={
          <Button
            variant="primary"
            disabled={selected.length < 2 || selected.length > 5}
            onClick={async () => {
              setError(null);
              try {
                setResult(await apiSend("/api/products/compare", "POST", { product_ids: selected }));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Comparison failed");
              }
            }}
          >
            Compare Selected
          </Button>
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <label key={p.id} className="flex gap-3 rounded-lg border border-[var(--border)] p-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked ? [...prev, p.id].slice(0, 5) : prev.filter((id) => id !== p.id)
                  )
                }
              />
              <span>
                <div className="font-medium">{p.product_name}</div>
                <div className="text-[var(--fg-muted)]">
                  {p.brand} · {formatCurrency(Number(p.final_price ?? p.price ?? 0))}
                </div>
              </span>
            </label>
          ))}
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      </Panel>

      {result ? (
        <Panel>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Field</th>
                  {result.products.map((p: Product) => (
                    <th key={p.id}>
                      {p.product_name}
                      {result.comparison.labels[p.id] ? (
                        <div className="mt-1">
                          <Badge tone="accent">{result.comparison.labels[p.id].replaceAll("_", " ")}</Badge>
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Price", (p: Product) => formatCurrency(Number(p.price ?? 0))],
                  ["GST", (p: Product) => String(notAvailable(p.gst_percent))],
                  ["Final Cost", (p: Product) => formatCurrency(Number(p.final_price ?? p.price ?? 0))],
                  ["Brand", (p: Product) => String(notAvailable(p.brand))],
                  ["Model", (p: Product) => String(notAvailable(p.model))],
                  ["Voltage", (p: Product) => String(notAvailable(p.voltage))],
                  ["Current", (p: Product) => String(notAvailable(p.current))],
                  ["RPM", (p: Product) => String(notAvailable(p.rpm))],
                  ["Torque", (p: Product) => String(notAvailable(p.torque))],
                  ["Dimensions", (p: Product) => String(notAvailable(p.dimensions))],
                  ["Weight", (p: Product) => String(notAvailable(p.weight))],
                  ["Warranty", (p: Product) => String(notAvailable(p.warranty))],
                ].map(([label, getter]) => (
                  <tr key={label as string}>
                    <td>{label as string}</td>
                    {result.products.map((p: Product) => (
                      <td key={p.id}>{(getter as (p: Product) => string)(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>AI Recommendation</td>
                  {result.products.map((p: Product) => (
                    <td key={p.id} className="max-w-xs text-sm">
                      {result.comparison.explanations[p.id]}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
