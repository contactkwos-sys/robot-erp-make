import type {
  AppStore,
  InventoryItem,
  InventoryTransaction,
  ProjectComponent,
  PurchaseItem,
  RequirementStatus,
  DashboardStats,
  ProjectCost,
} from "@/types";
import { deriveInventoryStatus, progressPercent } from "@/lib/utils";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";

function availableQty(item: InventoryItem) {
  return Math.max(0, item.quantity - item.reserved_quantity);
}

function matchInventory(store: AppStore, name: string, userId: string) {
  const lower = name.toLowerCase();
  return store.inventory.find(
    (i) =>
      i.user_id === userId &&
      (i.item_name.toLowerCase() === lower ||
        i.item_name.toLowerCase().includes(lower) ||
        lower.includes(i.item_name.toLowerCase()))
  );
}

export function computeRequirementStatus(
  required: number,
  available: number,
  reservedForProject = 0
): { status: RequirementStatus; missing: number } {
  const missing = Math.max(0, required - available - reservedForProject);
  if (missing > 0) return { status: "PURCHASE_REQUIRED", missing };
  if (reservedForProject > 0 && available === 0) return { status: "RESERVED", missing: 0 };
  if (available > 0 && available < required) return { status: "LOW_STOCK", missing: 0 };
  return { status: "AVAILABLE", missing: 0 };
}

export async function syncProjectInventory(projectId: string) {
  return updateStore((store) => {
    const userId = getDemoUserId();
    const components = store.project_components.filter((c) => c.project_id === projectId);
    const purchaseKeep: PurchaseItem[] = store.purchase_items.filter(
      (p) => p.project_id !== projectId || p.status === "ORDERED" || p.status === "RECEIVED"
    );
    const newPurchases: PurchaseItem[] = [];

    for (const comp of components) {
      const inv = comp.inventory_item_id
        ? store.inventory.find((i) => i.id === comp.inventory_item_id)
        : matchInventory(store, comp.component_name, userId);

      if (inv) {
        comp.inventory_item_id = inv.id;
        comp.available_quantity = availableQty(inv);
        comp.unit_cost = inv.unit_cost || comp.unit_cost;
      } else {
        comp.available_quantity = 0;
      }

      const { status, missing } = computeRequirementStatus(
        comp.quantity,
        comp.available_quantity,
        comp.reserved_quantity
      );
      comp.missing_quantity = missing;
      comp.inventory_status = status;
      comp.purchase_status = missing > 0 ? "REQUIRED" : "NOT_NEEDED";
      comp.updated_at = nowIso();

      if (missing > 0 && comp.required) {
        const existingOrdered = store.purchase_items.find(
          (p) =>
            p.project_id === projectId &&
            p.item_name === comp.component_name &&
            (p.status === "ORDERED" || p.status === "RECEIVED")
        );
        if (!existingOrdered) {
          newPurchases.push({
            id: newId(),
            user_id: userId,
            project_id: projectId,
            purchase_order_id: null,
            item_name: comp.component_name,
            required_qty: comp.quantity,
            available_qty: comp.available_quantity,
            purchase_qty: missing,
            recommended_product_id: null,
            recommended_product_name: comp.component_name,
            estimated_price: comp.unit_cost,
            estimated_total: missing * comp.unit_cost,
            supplier: inv?.supplier || "TBD",
            priority: comp.category === "POWER" || comp.category === "MECHANICAL" ? "HIGH" : "MEDIUM",
            status: "REQUIRED",
            notes: `Smart procurement: buy only missing qty (${missing}).`,
            created_at: nowIso(),
            updated_at: nowIso(),
          });
        }
      }
    }

    store.purchase_items = [...purchaseKeep, ...newPurchases];
    recalculateProjectCost(store, projectId);
  });
}

export function recalculateProjectCost(store: AppStore, projectId: string) {
  const userId = getDemoUserId();
  const comps = store.project_components.filter((c) => c.project_id === projectId);
  const purchases = store.purchase_items.filter(
    (p) => p.project_id === projectId && p.status !== "CANCELLED"
  );

  const byCat = (cat: string) =>
    comps
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + c.quantity * (c.unit_cost || 0), 0);

  const existing = comps.reduce((sum, c) => {
    const usedFromStock = Math.min(c.quantity, c.available_quantity + c.reserved_quantity);
    return sum + usedFromStock * (c.unit_cost || 0);
  }, 0);

  const newPurchase = purchases.reduce((sum, p) => sum + p.estimated_total, 0);
  const shipping = purchases.length > 0 ? 150 : 0;
  const gst = Math.round(newPurchase * 0.18);

  const cost: ProjectCost = {
    id: store.project_costs.find((c) => c.project_id === projectId)?.id || newId(),
    project_id: projectId,
    user_id: userId,
    mechanical: byCat("MECHANICAL"),
    electronics: byCat("ELECTRONICS"),
    sensors: byCat("SENSORS"),
    battery: byCat("POWER"),
    wiring: byCat("WIRING"),
    fasteners: byCat("FASTENERS"),
    tools: byCat("TOOLS"),
    purchase: newPurchase,
    shipping,
    gst,
    existing_inventory_value: existing,
    new_purchase_cost: newPurchase + shipping + gst,
    total_robot_cost: existing + newPurchase + shipping + gst,
    updated_at: nowIso(),
  };

  const idx = store.project_costs.findIndex((c) => c.project_id === projectId);
  if (idx >= 0) store.project_costs[idx] = cost;
  else store.project_costs.push(cost);
  return cost;
}

export async function reserveProjectStock(projectId: string) {
  return updateStore((store) => {
    const project = store.robot_projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Project not found");
    const comps = store.project_components.filter((c) => c.project_id === projectId);

    for (const comp of comps) {
      if (!comp.required) continue;
      const inv = comp.inventory_item_id
        ? store.inventory.find((i) => i.id === comp.inventory_item_id)
        : matchInventory(store, comp.component_name, project.user_id);
      if (!inv) continue;

      const need = Math.max(0, comp.quantity - comp.reserved_quantity);
      const canReserve = Math.min(need, availableQty(inv));
      if (canReserve <= 0) continue;

      const prev = inv.quantity;
      inv.reserved_quantity += canReserve;
      inv.status = deriveInventoryStatus(inv.quantity, inv.reserved_quantity, inv.minimum_stock, inv.status);
      inv.updated_at = nowIso();
      comp.reserved_quantity += canReserve;
      comp.available_quantity = availableQty(inv);
      const { status, missing } = computeRequirementStatus(
        comp.quantity,
        comp.available_quantity,
        comp.reserved_quantity
      );
      comp.missing_quantity = missing;
      comp.inventory_status = status;
      comp.updated_at = nowIso();

      store.inventory_transactions.push({
        id: newId(),
        user_id: project.user_id,
        inventory_item_id: inv.id,
        transaction_type: "RESERVE",
        quantity: canReserve,
        previous_stock: prev,
        new_stock: inv.quantity,
        reason: `Reserved for project ${project.name}`,
        reference: projectId,
        project_id: projectId,
        created_at: nowIso(),
      });
    }

    project.approved_at = nowIso();
    project.progress = "PURCHASE";
    project.progress_percent = progressPercent("PURCHASE");
    project.updated_at = nowIso();
    recalculateProjectCost(store, projectId);
  });
}

export async function applyInventoryTransaction(input: {
  inventory_item_id: string;
  transaction_type: InventoryTransaction["transaction_type"];
  quantity: number;
  reason: string;
  reference?: string;
  project_id?: string | null;
}) {
  return updateStore((store) => {
    const item = store.inventory.find((i) => i.id === input.inventory_item_id);
    if (!item) throw new Error("Inventory item not found");
    const prev = item.quantity;
    const qty = input.quantity;

    switch (input.transaction_type) {
      case "PURCHASE":
      case "RECEIVE":
      case "RETURN":
        item.quantity += qty;
        break;
      case "ISSUE":
      case "DAMAGE":
        if (availableQty(item) < qty) throw new Error("Insufficient available stock");
        item.quantity -= qty;
        break;
      case "RESERVE":
        if (availableQty(item) < qty) throw new Error("Insufficient available stock to reserve");
        item.reserved_quantity += qty;
        break;
      case "ADJUSTMENT":
        item.quantity = qty;
        break;
      default:
        throw new Error("Unknown transaction type");
    }

    item.total_value = item.quantity * item.unit_cost;
    item.status = deriveInventoryStatus(item.quantity, item.reserved_quantity, item.minimum_stock, item.status);
    item.updated_at = nowIso();

    store.inventory_transactions.push({
      id: newId(),
      user_id: item.user_id,
      inventory_item_id: item.id,
      transaction_type: input.transaction_type,
      quantity: qty,
      previous_stock: prev,
      new_stock: item.quantity,
      reason: input.reason,
      reference: input.reference || "",
      project_id: input.project_id || null,
      created_at: nowIso(),
    });
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const store = await readStore();
  const userId = getDemoUserId();
  const projects = store.robot_projects.filter((p) => p.user_id === userId);
  const inventory = store.inventory.filter((i) => i.user_id === userId);
  const missing = store.project_components.filter(
    (c) => c.user_id === userId && c.missing_quantity > 0
  ).length;
  const pending = store.purchase_items.filter(
    (p) => p.user_id === userId && (p.status === "REQUIRED" || p.status === "ORDERED")
  ).length;
  const active = projects.find((p) => p.status === "active");
  const cost = active
    ? store.project_costs.find((c) => c.project_id === active.id)
    : store.project_costs[0];
  const assembly = active
    ? store.assembly_steps.filter((s) => s.project_id === active.id)
    : [];
  const assemblyProgress =
    assembly.length === 0
      ? 0
      : Math.round((assembly.filter((s) => s.completed).length / assembly.length) * 100);

  return {
    total_projects: projects.length,
    active_projects: projects.filter((p) => p.status === "active").length,
    completed_projects: projects.filter((p) => p.status === "completed").length,
    total_inventory_items: inventory.length,
    missing_components: missing,
    pending_purchases: pending,
    total_inventory_value: inventory.reduce((s, i) => s + i.total_value, 0),
    current_project_cost: cost?.total_robot_cost || 0,
    assembly_progress: assemblyProgress,
    recent_projects: [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5),
    recent_inventory: [...inventory].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5),
    recent_scans: [...store.product_scans]
      .filter((s) => s.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5),
    ai_warnings: store.ai_recommendations.filter(
      (r) => r.user_id === userId && !r.dismissed && r.severity !== "info"
    ),
  };
}

export function bomFromComponents(components: ProjectComponent[]) {
  const groups: Record<string, ProjectComponent[]> = {};
  for (const c of components) {
    groups[c.category] = groups[c.category] || [];
    groups[c.category].push(c);
  }
  return Object.entries(groups).map(([category, items]) => ({
    category,
    items: items.map((item) => ({
      item_id: item.id,
      component_name: item.component_name,
      category: item.category,
      required_quantity: item.quantity,
      available_quantity: item.available_quantity,
      missing_quantity: item.missing_quantity,
      unit_cost: item.unit_cost,
      total_cost: item.unit_cost * item.quantity,
      specification: item.specification_confirmed
        ? item.suggested_specification
        : item.suggested_specification.includes("Specification not confirmed") ||
            item.suggested_specification.includes("REQUIRES VERIFICATION")
          ? item.suggested_specification
          : `${item.suggested_specification} (Specification not confirmed)`,
      purpose: item.purpose,
      installation_location: item.installation_location,
      inventory_status: item.inventory_status,
      purchase_status: item.purchase_status,
    })),
  }));
}
