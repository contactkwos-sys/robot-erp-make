import { z } from "zod";

export const robotWizardSchema = z.object({
  name: z.string().min(2, "Robot name is required"),
  purpose: z.string().min(2, "Purpose is required"),
  description: z.string().min(2, "Description is required"),
  target_load: z.string().min(1, "Target load is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  movement: z.string().min(1, "Movement is required"),
  environment: z.string().min(1, "Environment is required"),
  power_preference: z.string().min(1, "Power preference is required"),
  image_kind: z
    .enum(["concept", "photo", "sketch", "drawing", "pdf", "reference"])
    .default("reference"),
});

export const inventoryItemSchema = z.object({
  item_name: z.string().min(1),
  category: z.enum([
    "MECHANICAL",
    "ELECTRONICS",
    "POWER",
    "SENSORS",
    "WIRING",
    "FASTENERS",
    "TOOLS",
    "OTHER",
  ]),
  brand: z.string().default(""),
  model: z.string().default(""),
  sku: z.string().default(""),
  specification: z.string().default(""),
  unit: z.string().default("pcs"),
  quantity: z.number().min(0),
  minimum_stock: z.number().min(0).default(0),
  unit_cost: z.number().min(0).default(0),
  gst_percent: z.number().min(0).default(18),
  supplier: z.string().default(""),
  purchase_date: z.string().nullable().optional(),
  storage_location: z.string().default(""),
  notes: z.string().default(""),
});

export const productSchema = z.object({
  product_name: z.string().min(1),
  brand: z.string().default("Not available"),
  model: z.string().default("Not available"),
  price: z.number().nullable().optional(),
  mrp: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  gst_percent: z.number().nullable().optional(),
  shipping: z.number().nullable().optional(),
  final_price: z.number().nullable().optional(),
  quantity: z.number().default(1),
  specification: z.string().default("Not available"),
  voltage: z.string().default("Not available"),
  current: z.string().default("Not available"),
  rpm: z.string().default("Not available"),
  torque: z.string().default("Not available"),
  dimensions: z.string().default("Not available"),
  weight: z.string().default("Not available"),
  warranty: z.string().default("Not available"),
  product_url: z.string().default(""),
  source: z.string().default(""),
  notes: z.string().default(""),
});

export const transactionSchema = z.object({
  inventory_item_id: z.string().min(1),
  transaction_type: z.enum([
    "PURCHASE",
    "RECEIVE",
    "ISSUE",
    "USE",
    "RESERVE",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGE",
  ]),
  quantity: z.number().positive(),
  reason: z.string().min(1),
  reference: z.string().optional(),
  project_id: z.string().nullable().optional(),
});

export const compareSchema = z.object({
  product_ids: z.array(z.string()).min(2).max(5),
});

const DEFAULT_ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

export function validateUpload(file: File) {
  const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);
  const allowed = (process.env.ALLOWED_UPLOAD_TYPES || DEFAULT_ALLOWED.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.includes(file.type) && !file.type.startsWith("image/")) {
    return { ok: false as const, error: `File type ${file.type || "unknown"} is not allowed.` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false as const, error: `File exceeds ${maxMb}MB limit.` };
  }
  return { ok: true as const };
}
