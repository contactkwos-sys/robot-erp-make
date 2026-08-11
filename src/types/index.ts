export type InventoryStatus =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "RESERVED"
  | "ORDERED"
  | "USED"
  | "DAMAGED";

export type PurchaseStatus =
  | "REQUIRED"
  | "ORDERED"
  | "RECEIVED"
  | "CANCELLED";

export type PurchasePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ProjectProgress =
  | "IDEA"
  | "ANALYSIS"
  | "BOM"
  | "INVENTORY_CHECK"
  | "PURCHASE"
  | "PARTS_RECEIVED"
  | "MECHANICAL_ASSEMBLY"
  | "ELECTRONICS"
  | "WIRING"
  | "PROGRAMMING"
  | "TESTING"
  | "COMPLETED";

export type ComponentCategory =
  | "MECHANICAL"
  | "ELECTRONICS"
  | "POWER"
  | "SENSORS"
  | "WIRING"
  | "FASTENERS"
  | "TOOLS"
  | "OTHER";

export type TransactionType =
  | "PURCHASE"
  | "RECEIVE"
  | "ISSUE"
  | "RESERVE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE";

export type RequirementStatus =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "MISSING"
  | "RESERVED"
  | "PURCHASE_REQUIRED";

export const PROGRESS_STEPS: ProjectProgress[] = [
  "IDEA",
  "ANALYSIS",
  "BOM",
  "INVENTORY_CHECK",
  "PURCHASE",
  "PARTS_RECEIVED",
  "MECHANICAL_ASSEMBLY",
  "ELECTRONICS",
  "WIRING",
  "PROGRAMMING",
  "TESTING",
  "COMPLETED",
];

export interface User {
  id: string;
  email: string;
  full_name: string;
  beginner_mode: boolean;
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
}

export interface RobotProject {
  id: string;
  user_id: string;
  name: string;
  purpose: string;
  description: string;
  target_load: string;
  dimensions: string;
  movement: string;
  environment: string;
  power_preference: string;
  status: "draft" | "active" | "completed" | "archived";
  progress: ProjectProgress;
  progress_percent: number;
  cover_image_url: string | null;
  is_demo: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RobotImage {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  image_kind: "concept" | "photo" | "sketch" | "drawing" | "pdf" | "reference";
  created_at: string;
}

export interface ComponentMarker {
  id: string;
  label: string;
  x_percent: number;
  y_percent: number;
  component_name: string;
}

export interface RobotAnalysis {
  id: string;
  project_id: string;
  user_id: string;
  provider: string;
  summary: string;
  markers: ComponentMarker[];
  warnings: string[];
  raw_response: Record<string, unknown>;
  created_at: string;
}

export interface Component {
  id: string;
  user_id: string;
  name: string;
  category: ComponentCategory;
  image_url: string | null;
  description: string;
  beginner_what_is_it: string;
  beginner_what_does_it_do: string;
  beginner_where_fits: string;
  beginner_what_else: string[];
  default_specification: string;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectComponent {
  id: string;
  project_id: string;
  component_id: string | null;
  user_id: string;
  component_name: string;
  category: ComponentCategory;
  image_url: string | null;
  quantity: number;
  purpose: string;
  where_used: string;
  required: boolean;
  suggested_specification: string;
  specification_confirmed: boolean;
  confidence: number;
  notes: string;
  unit_cost: number;
  installation_location: string;
  inventory_item_id: string | null;
  inventory_status: RequirementStatus;
  purchase_status: PurchaseStatus | "NOT_NEEDED";
  available_quantity: number;
  missing_quantity: number;
  reserved_quantity: number;
  beginner_what_is_it: string;
  beginner_what_does_it_do: string;
  beginner_where_fits: string;
  beginner_what_else: string[];
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: ComponentCategory;
  brand: string;
  model: string;
  sku: string;
  image_url: string | null;
  specification: string;
  unit: string;
  quantity: number;
  reserved_quantity: number;
  minimum_stock: number;
  unit_cost: number;
  gst_percent: number;
  total_value: number;
  supplier: string;
  purchase_date: string | null;
  storage_location: string;
  compatible_projects: string[];
  notes: string;
  status: InventoryStatus;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  user_id: string;
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference: string;
  project_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  model: string;
  price: number | null;
  mrp: number | null;
  discount: number | null;
  gst_percent: number | null;
  shipping: number | null;
  final_price: number | null;
  quantity: number;
  specification: string;
  voltage: string;
  current: string;
  rpm: string;
  torque: string;
  dimensions: string;
  weight: string;
  warranty: string;
  product_url: string;
  image_url: string | null;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProductScan {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  extracted_data: Partial<Product>;
  provider: string;
  status: "pending" | "extracted" | "saved" | "failed";
  error_message: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  user_id: string;
  order_number: string;
  supplier: string;
  status: PurchaseStatus;
  total_estimated: number;
  notes: string;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  user_id: string;
  project_id: string | null;
  purchase_order_id: string | null;
  item_name: string;
  required_qty: number;
  available_qty: number;
  purchase_qty: number;
  recommended_product_id: string | null;
  recommended_product_name: string;
  estimated_price: number;
  estimated_total: number;
  supplier: string;
  priority: PurchasePriority;
  status: PurchaseStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AssemblyStep {
  id: string;
  project_id: string;
  user_id: string;
  step_number: number;
  title: string;
  instructions: string;
  required_components: string[];
  quantities: Record<string, number>;
  tools: string[];
  installation_location: string;
  reference_image_url: string | null;
  safety_warning: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface WiringConnection {
  id: string;
  project_id: string;
  user_id: string;
  from_component: string;
  to_component: string;
  pin: string;
  wire: string;
  purpose: string;
  voltage_note: string;
  verified: boolean;
  warning: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  entity_type: "project" | "component" | "product" | "purchase" | "general";
  entity_id: string | null;
  metadata: Record<string, string>;
  created_at: string;
}

export interface AiRecommendation {
  id: string;
  user_id: string;
  project_id: string | null;
  category: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  dismissed: boolean;
  created_at: string;
}

export interface ProjectCost {
  id: string;
  project_id: string;
  user_id: string;
  mechanical: number;
  electronics: number;
  sensors: number;
  battery: number;
  wiring: number;
  fasteners: number;
  tools: number;
  purchase: number;
  shipping: number;
  gst: number;
  existing_inventory_value: number;
  new_purchase_cost: number;
  total_robot_cost: number;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface EngineeringCheckItem {
  id: string;
  check_name: string;
  status: "PASS" | "FAIL" | "REQUIRES_VERIFICATION";
  detail: string;
}

export interface EngineeringCheck {
  id: string;
  project_id: string;
  user_id: string;
  items: EngineeringCheckItem[];
  overall_status: "PASS" | "FAIL" | "REQUIRES_VERIFICATION";
  created_at: string;
}

export interface AppStore {
  users: User[];
  robot_projects: RobotProject[];
  robot_images: RobotImage[];
  robot_analysis: RobotAnalysis[];
  components: Component[];
  project_components: ProjectComponent[];
  inventory: InventoryItem[];
  inventory_transactions: InventoryTransaction[];
  products: Product[];
  product_scans: ProductScan[];
  purchase_orders: PurchaseOrder[];
  purchase_items: PurchaseItem[];
  assembly_steps: AssemblyStep[];
  wiring_connections: WiringConnection[];
  documents: DocumentRecord[];
  ai_recommendations: AiRecommendation[];
  project_costs: ProjectCost[];
  project_notes: ProjectNote[];
  engineering_checks: EngineeringCheck[];
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_inventory_items: number;
  missing_components: number;
  pending_purchases: number;
  total_inventory_value: number;
  current_project_cost: number;
  assembly_progress: number;
  recent_projects: RobotProject[];
  recent_inventory: InventoryItem[];
  recent_scans: ProductScan[];
  ai_warnings: AiRecommendation[];
}
