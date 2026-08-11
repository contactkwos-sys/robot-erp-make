import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PROGRESS_STEPS, type ProjectProgress, type InventoryStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function progressPercent(progress: ProjectProgress) {
  const idx = PROGRESS_STEPS.indexOf(progress);
  if (idx < 0) return 0;
  return Math.round((idx / (PROGRESS_STEPS.length - 1)) * 100);
}

export function deriveInventoryStatus(
  quantity: number,
  reserved: number,
  minimum: number,
  current?: InventoryStatus
): InventoryStatus {
  if (current === "DAMAGED" || current === "ORDERED" || current === "USED") {
    return current;
  }
  const available = quantity - reserved;
  if (available <= 0 && reserved > 0) return "RESERVED";
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= minimum) return "LOW_STOCK";
  return "AVAILABLE";
}

export function notAvailable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }
  return value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
