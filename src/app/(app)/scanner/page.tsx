"use client";

import { useState } from "react";
import { apiSend } from "@/lib/client-api";
import { notAvailable } from "@/lib/utils";
import {
  Button,
  Input,
  PageHeader,
  Panel,
  Textarea,
} from "@/components/ui/primitives";

const FIELDS = [
  "product_name",
  "brand",
  "model",
  "price",
  "mrp",
  "discount",
  "gst_percent",
  "shipping",
  "final_price",
  "quantity",
  "specification",
  "voltage",
  "current",
  "rpm",
  "torque",
  "dimensions",
  "weight",
  "warranty",
  "product_url",
] as const;

export default function ScannerPage() {
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const scan = async (file: File) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await apiSend<{
        extracted: Record<string, any>;
        warnings: string[];
        file_path: string;
      }>("/api/scanner", "POST", body);
      setExtracted(res.extracted);
      setWarnings(res.warnings || []);
      setFilePath(res.file_path);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Product information could not be extracted. Please upload a clearer screenshot."
      );
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!extracted) return;
    await apiSend("/api/products", "POST", { ...extracted, image_url: filePath });
    setMessage("Product saved.");
  };

  const addInventory = async () => {
    if (!extracted) return;
    await apiSend("/api/inventory", "POST", {
      item_name: extracted.product_name || "Scanned product",
      category: "OTHER",
      brand: extracted.brand || "",
      model: extracted.model || "",
      sku: "",
      specification: extracted.specification || "",
      unit: "pcs",
      quantity: Number(extracted.quantity || 1),
      minimum_stock: 0,
      unit_cost: Number(extracted.final_price ?? extracted.price ?? 0),
      gst_percent: Number(extracted.gst_percent ?? 18),
      supplier: "",
      storage_location: "Receiving",
      notes: "Added from product scanner",
      image_url: filePath,
    });
    setMessage("Added to inventory.");
  };

  const addPurchase = async () => {
    if (!extracted) return;
    // Save product then rely on purchases page / manual - create purchase item via store by saving product first
    await saveProduct();
    setMessage("Product saved. Open Purchase Required after linking to a project BOM item, or add manually from inventory gaps.");
  };

  return (
    <div>
      <PageHeader
        title="Product Scanner"
        subtitle="Upload Amazon, Flipkart, quotation, WhatsApp, PDF, or catalogue screenshots. Only visible fields are extracted."
      />

      <Panel className="mb-4">
        <Input
          type="file"
          accept="image/*,application/pdf"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) scan(file);
          }}
        />
        {busy ? <p className="mt-2 text-sm text-[var(--fg-muted)]">Extracting product information…</p> : null}
        {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-[var(--success)]">{message}</p> : null}
      </Panel>

      {extracted ? (
        <Panel>
          <h2 className="font-semibold mb-2">Extracted Information (editable)</h2>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-[var(--warning)] mb-2">{w}</p>
          ))}
          {filePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePath} alt="Scan" className="mb-4 max-h-48 rounded border border-[var(--border)]" />
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field} className="text-sm space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                  {field.replaceAll("_", " ")}
                </span>
                {field === "specification" ? (
                  <Textarea
                    value={String(notAvailable(extracted[field]))}
                    onChange={(e) => setExtracted({ ...extracted, [field]: e.target.value })}
                  />
                ) : (
                  <Input
                    value={String(notAvailable(extracted[field]))}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const numeric = ["price", "mrp", "discount", "gst_percent", "shipping", "final_price", "quantity"];
                      setExtracted({
                        ...extracted,
                        [field]:
                          numeric.includes(field) && raw !== "Not available" && raw !== ""
                            ? Number(raw)
                            : raw === "Not available"
                              ? null
                              : raw,
                      });
                    }}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={addInventory}>Add to Inventory</Button>
            <Button variant="secondary" onClick={addPurchase}>Add to Purchase List</Button>
            <Button onClick={saveProduct}>Save Product</Button>
            <Button onClick={() => (window.location.href = "/comparison")}>Compare</Button>
            <Button onClick={() => { setExtracted(null); setFilePath(null); }}>Cancel</Button>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
