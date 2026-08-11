import type { ComponentCategory, Product } from "@/types";

export interface AnalyzedComponent {
  component_name: string;
  category: ComponentCategory;
  quantity: number;
  purpose: string;
  where_used: string;
  required: boolean;
  suggested_specification: string;
  specification_confirmed: boolean;
  confidence: number;
  notes: string;
  beginner_what_is_it: string;
  beginner_what_does_it_do: string;
  beginner_where_fits: string;
  beginner_what_else: string[];
  marker?: { label: string; x_percent: number; y_percent: number };
}

export interface RobotAnalysisResult {
  summary: string;
  components: AnalyzedComponent[];
  warnings: string[];
  markers: Array<{
    id: string;
    label: string;
    x_percent: number;
    y_percent: number;
    component_name: string;
  }>;
  provider: string;
}

export interface ProductExtractionResult {
  data: Partial<Product>;
  warnings: string[];
  provider: string;
}

export interface ComparisonResult {
  labels: Record<string, "BEST_VALUE" | "RECOMMENDED" | "PREMIUM" | null>;
  explanations: Record<string, string>;
  winner_id: string | null;
  provider: string;
}

export interface AssemblyGuideResult {
  steps: Array<{
    step_number: number;
    title: string;
    instructions: string;
    required_components: string[];
    tools: string[];
    installation_location: string;
    safety_warning: string;
  }>;
  provider: string;
}

export interface WiringPlanResult {
  connections: Array<{
    from_component: string;
    to_component: string;
    pin: string;
    wire: string;
    purpose: string;
    voltage_note: string;
    warning: string;
  }>;
  provider: string;
}

export interface EngineeringCheckResult {
  items: Array<{
    check_name: string;
    status: "PASS" | "FAIL" | "REQUIRES_VERIFICATION";
    detail: string;
  }>;
  overall_status: "PASS" | "FAIL" | "REQUIRES_VERIFICATION";
  provider: string;
}

export interface AIProvider {
  name: string;
  analyzeRobotImage(input: {
    imageUrl?: string;
    description?: string;
    purpose?: string;
    movement?: string;
    environment?: string;
    powerPreference?: string;
  }): Promise<RobotAnalysisResult>;
  analyzeProductScreenshot(input: {
    imageUrl?: string;
    fileName?: string;
    notes?: string;
  }): Promise<ProductExtractionResult>;
  compareProducts(products: Product[]): Promise<ComparisonResult>;
  generateAssemblyGuide(input: {
    projectName: string;
    components: AnalyzedComponent[];
  }): Promise<AssemblyGuideResult>;
  generateWiringPlan(input: {
    projectName: string;
    components: AnalyzedComponent[];
  }): Promise<WiringPlanResult>;
  runEngineeringCheck(input: {
    projectName: string;
    components: AnalyzedComponent[];
  }): Promise<EngineeringCheckResult>;
}
