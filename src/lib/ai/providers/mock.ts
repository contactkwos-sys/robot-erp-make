import type {
  AIProvider,
  AnalyzedComponent,
  AssemblyGuideResult,
  ComparisonResult,
  EngineeringCheckResult,
  ProductExtractionResult,
  RobotAnalysisResult,
  WiringPlanResult,
} from "@/lib/ai/providers/types";
import type { Product } from "@/types";

const SAFETY = "Verify voltage, current and polarity before connecting.";

function baseComponents(purpose?: string): AnalyzedComponent[] {
  return [
    {
      component_name: "DC Gear Motor",
      category: "MECHANICAL",
      quantity: 4,
      purpose: "Drive wheels",
      where_used: "Wheel assemblies",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.84,
      notes: "Confirm voltage/RPM/torque before purchase.",
      beginner_what_is_it: "A motor that moves the robot wheel.",
      beginner_what_does_it_do: "It gives movement to the robot.",
      beginner_where_fits: "Left/right wheel assembly.",
      beginner_what_else: ["Motor bracket", "Screws", "Motor driver", "Wires"],
      marker: { label: "01 Motor", x_percent: 20, y_percent: 70 },
    },
    {
      component_name: "Rubber Wheel",
      category: "MECHANICAL",
      quantity: 4,
      purpose: "Traction",
      where_used: "Motor shafts",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.8,
      notes: "",
      beginner_what_is_it: "Wheels that roll on the floor.",
      beginner_what_does_it_do: "They let the robot move.",
      beginner_where_fits: "On each motor.",
      beginner_what_else: ["Motors", "Screws"],
    },
    {
      component_name: "Motor Driver",
      category: "ELECTRONICS",
      quantity: 1,
      purpose: "Control motors from microcontroller",
      where_used: "Electronics deck",
      required: true,
      suggested_specification: "Current rating REQUIRES VERIFICATION",
      specification_confirmed: false,
      confidence: 0.78,
      notes: "",
      beginner_what_is_it: "A board that helps control strong motors.",
      beginner_what_does_it_do: "It switches motor power safely.",
      beginner_where_fits: "Near the controller.",
      beginner_what_else: ["Controller", "Battery", "Wires"],
    },
    {
      component_name: "ESP32 / Microcontroller",
      category: "ELECTRONICS",
      quantity: 1,
      purpose: "Main controller",
      where_used: "Electronics deck",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.82,
      notes: "",
      beginner_what_is_it: "A tiny computer that runs the robot.",
      beginner_what_does_it_do: "It reads sensors and controls motors.",
      beginner_where_fits: "On the electronics deck.",
      beginner_what_else: ["Motor driver", "Sensors", "USB cable"],
      marker: { label: "03 Controller", x_percent: 50, y_percent: 40 },
    },
    {
      component_name: "Camera Module",
      category: "SENSORS",
      quantity: 1,
      purpose: purpose?.toLowerCase().includes("inspect") ? "Inspection imaging" : "Vision",
      where_used: "Front mast",
      required: false,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.65,
      notes: "Optional unless vision is required.",
      beginner_what_is_it: "A small camera.",
      beginner_what_does_it_do: "It takes pictures for the robot.",
      beginner_where_fits: "Front of the robot.",
      beginner_what_else: ["Mount", "Cable"],
      marker: { label: "04 Camera", x_percent: 78, y_percent: 30 },
    },
    {
      component_name: "Ultrasonic Sensor",
      category: "SENSORS",
      quantity: 2,
      purpose: "Obstacle detection",
      where_used: "Front bumper",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.7,
      notes: "",
      beginner_what_is_it: "A sensor that measures distance.",
      beginner_what_does_it_do: "It helps avoid collisions.",
      beginner_where_fits: "Front bumper.",
      beginner_what_else: ["Wires", "Mount"],
      marker: { label: "05 Sensor", x_percent: 82, y_percent: 50 },
    },
    {
      component_name: "Battery Pack",
      category: "POWER",
      quantity: 1,
      purpose: "Power source",
      where_used: "Battery bay",
      required: true,
      suggested_specification: "Voltage/capacity REQUIRES VERIFICATION",
      specification_confirmed: false,
      confidence: 0.75,
      notes: "",
      beginner_what_is_it: "The battery that powers the robot.",
      beginner_what_does_it_do: "It stores electricity.",
      beginner_where_fits: "Battery bay.",
      beginner_what_else: ["Fuse", "Switch", "Charger"],
      marker: { label: "02 Battery", x_percent: 45, y_percent: 65 },
    },
    {
      component_name: "Fuse + Switch",
      category: "POWER",
      quantity: 1,
      purpose: "Safety and power control",
      where_used: "Battery positive line / side panel",
      required: true,
      suggested_specification: "Fuse rating REQUIRES VERIFICATION",
      specification_confirmed: false,
      confidence: 0.8,
      notes: "",
      beginner_what_is_it: "Safety fuse and on/off switch.",
      beginner_what_does_it_do: "They protect and control power.",
      beginner_where_fits: "On the battery power line.",
      beginner_what_else: ["Battery", "Wires"],
    },
    {
      component_name: "Chassis Frame",
      category: "MECHANICAL",
      quantity: 1,
      purpose: "Structural base",
      where_used: "Entire robot",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.77,
      notes: "",
      beginner_what_is_it: "The body of the robot.",
      beginner_what_does_it_do: "It holds all parts together.",
      beginner_where_fits: "It is the main structure.",
      beginner_what_else: ["Brackets", "Screws"],
    },
    {
      component_name: "Wires & Connectors",
      category: "WIRING",
      quantity: 1,
      purpose: "Electrical interconnect",
      where_used: "Harness",
      required: true,
      suggested_specification: "Wire gauge REQUIRES VERIFICATION",
      specification_confirmed: false,
      confidence: 0.7,
      notes: "",
      beginner_what_is_it: "Wires and plugs.",
      beginner_what_does_it_do: "They connect electrical parts.",
      beginner_where_fits: "Throughout the electronics.",
      beginner_what_else: ["Cable ties"],
    },
    {
      component_name: "Fasteners",
      category: "FASTENERS",
      quantity: 1,
      purpose: "Assembly",
      where_used: "All mounts",
      required: true,
      suggested_specification: "Specification not confirmed",
      specification_confirmed: false,
      confidence: 0.85,
      notes: "",
      beginner_what_is_it: "Screws and nuts.",
      beginner_what_does_it_do: "They keep parts attached.",
      beginner_where_fits: "Everywhere parts join.",
      beginner_what_else: ["Screwdriver"],
    },
  ];
}

export class MockAIProvider implements AIProvider {
  name = "mock";

  async analyzeRobotImage(input: {
    imageUrl?: string;
    description?: string;
    purpose?: string;
    movement?: string;
    environment?: string;
    powerPreference?: string;
  }): Promise<RobotAnalysisResult> {
    const components = baseComponents(input.purpose);
    const markers = components
      .filter((c) => c.marker)
      .map((c, idx) => ({
        id: `mk-${idx + 1}`,
        label: c.marker!.label,
        x_percent: c.marker!.x_percent,
        y_percent: c.marker!.y_percent,
        component_name: c.component_name,
      }));

    return {
      provider: this.name,
      summary: `Probable mobile robot for "${input.purpose || "general use"}". Movement: ${
        input.movement || "not specified"
      }. Environment: ${input.environment || "not specified"}. Exact electrical ratings are not confirmed from the provided image/description.`,
      components,
      warnings: [
        "Exact motor torque/current not confirmed — REQUIRES VERIFICATION",
        "Battery capacity not confirmed",
        "Fuse rating cannot be determined without load current",
      ],
      markers,
    };
  }

  async analyzeProductScreenshot(input: {
    imageUrl?: string;
    fileName?: string;
    notes?: string;
  }): Promise<ProductExtractionResult> {
    const nameHint = input.fileName?.toLowerCase() || "";
    const isMotor = nameHint.includes("motor");
    return {
      provider: this.name,
      warnings: [
        "Mock OCR used because no AI API key is configured. Review and edit all fields before saving.",
      ],
      data: {
        product_name: isMotor ? "DC Gear Motor (from screenshot)" : "Product (from screenshot)",
        brand: "Not available",
        model: "Not available",
        price: null,
        mrp: null,
        discount: null,
        gst_percent: null,
        shipping: null,
        final_price: null,
        quantity: 1,
        specification: "Not available",
        voltage: isMotor ? "Not available" : "Not available",
        current: "Not available",
        rpm: isMotor ? "Not available" : "Not available",
        torque: "Not available",
        dimensions: "Not available",
        weight: "Not available",
        warranty: "Not available",
        product_url: "",
        source: "screenshot",
        notes: input.notes || "Extracted via mock provider — edit manually.",
      },
    };
  }

  async compareProducts(products: Product[]): Promise<ComparisonResult> {
    if (products.length === 0) {
      return { labels: {}, explanations: {}, winner_id: null, provider: this.name };
    }
    const sorted = [...products].sort(
      (a, b) => (a.final_price ?? a.price ?? 999999) - (b.final_price ?? b.price ?? 999999)
    );
    const bestValue = sorted[0];
    const premium = sorted[sorted.length - 1];
    const recommended =
      sorted.find((p) => p.id !== premium.id && (p.warranty && p.warranty !== "Not available")) ||
      sorted[Math.min(1, sorted.length - 1)] ||
      bestValue;

    const labels: ComparisonResult["labels"] = {};
    const explanations: ComparisonResult["explanations"] = {};
    for (const p of products) {
      labels[p.id] = null;
      explanations[p.id] = "No special label.";
    }
    labels[bestValue.id] = "BEST_VALUE";
    explanations[bestValue.id] = "Lowest confirmed landed cost among compared items.";
    labels[recommended.id] = "RECOMMENDED";
    explanations[recommended.id] =
      "Best balance of available specs, compatibility notes, and cost for this project.";
    if (premium.id !== bestValue.id) {
      labels[premium.id] = "PREMIUM";
      explanations[premium.id] = "Highest price tier; choose only if durability features are confirmed.";
    }
    return { labels, explanations, winner_id: recommended.id, provider: this.name };
  }

  async generateAssemblyGuide(input: {
    projectName: string;
    components: AnalyzedComponent[];
  }): Promise<AssemblyGuideResult> {
    return {
      provider: this.name,
      steps: [
        {
          step_number: 1,
          title: "Build frame",
          instructions: `Assemble the chassis for ${input.projectName}.`,
          required_components: ["Chassis Frame", "Fasteners"],
          tools: ["Screwdriver"],
          installation_location: "Workbench",
          safety_warning: "Wear eye protection when cutting or drilling.",
        },
        {
          step_number: 2,
          title: "Install motor brackets",
          instructions: "Mount brackets at motor positions.",
          required_components: ["Motor brackets"],
          tools: ["Screwdriver"],
          installation_location: "Chassis corners",
          safety_warning: "Do not overtighten soft materials.",
        },
        {
          step_number: 3,
          title: "Install motors",
          instructions: "Secure motors and route leads upward.",
          required_components: ["DC Gear Motor"],
          tools: ["Screwdriver"],
          installation_location: "Motor mounts",
          safety_warning: "Keep clear of shafts during later tests.",
        },
        {
          step_number: 4,
          title: "Install wheels",
          instructions: "Fit wheels and check free rotation.",
          required_components: ["Rubber Wheel"],
          tools: ["Allen key"],
          installation_location: "Motor shafts",
          safety_warning: "Support chassis while fitting wheels.",
        },
        {
          step_number: 5,
          title: "Install battery holder",
          instructions: "Mount battery bay with space for fuse/switch.",
          required_components: ["Battery Pack"],
          tools: ["Screwdriver"],
          installation_location: "Battery bay",
          safety_warning: "Do not short battery terminals.",
        },
        {
          step_number: 6,
          title: "Install controller",
          instructions: "Mount microcontroller with USB access.",
          required_components: ["ESP32 / Microcontroller"],
          tools: ["Screwdriver"],
          installation_location: "Electronics deck",
          safety_warning: "Power off before wiring GPIO.",
        },
        {
          step_number: 7,
          title: "Install motor driver",
          instructions: "Mount driver near motors.",
          required_components: ["Motor Driver"],
          tools: ["Screwdriver"],
          installation_location: "Electronics deck",
          safety_warning: SAFETY,
        },
        {
          step_number: 8,
          title: "Install sensors",
          instructions: "Mount sensors and camera.",
          required_components: ["Ultrasonic Sensor", "Camera Module"],
          tools: ["Screwdriver", "Cable ties"],
          installation_location: "Front bumper / mast",
          safety_warning: "Avoid stressing sensor pins.",
        },
        {
          step_number: 9,
          title: "Complete wiring",
          instructions: "Follow wiring guide carefully.",
          required_components: ["Wires & Connectors", "Fuse + Switch"],
          tools: ["Wire stripper", "Multimeter"],
          installation_location: "Harness routes",
          safety_warning: SAFETY,
        },
        {
          step_number: 10,
          title: "Upload firmware",
          instructions: "Flash test firmware and verify serial output.",
          required_components: ["ESP32 / Microcontroller"],
          tools: ["Computer", "USB cable"],
          installation_location: "Workbench",
          safety_warning: "Elevate wheels before first motor test.",
        },
        {
          step_number: 11,
          title: "Testing",
          instructions: "Validate drive, sensing, and emergency power-off.",
          required_components: [],
          tools: ["Multimeter"],
          installation_location: "Open test area",
          safety_warning: "Supervise first powered runs.",
        },
      ],
    };
  }

  async generateWiringPlan(): Promise<WiringPlanResult> {
    return {
      provider: this.name,
      connections: [
        {
          from_component: "Battery +",
          to_component: "Fuse",
          pin: "BAT+",
          wire: "Red",
          purpose: "Protected positive",
          voltage_note: "Battery voltage REQUIRES VERIFICATION",
          warning: SAFETY,
        },
        {
          from_component: "Fuse",
          to_component: "Switch",
          pin: "FUSE_OUT",
          wire: "Red",
          purpose: "Switched positive",
          voltage_note: "Fuse rating REQUIRES VERIFICATION",
          warning: SAFETY,
        },
        {
          from_component: "Switch",
          to_component: "Motor Driver VIN+",
          pin: "SW_OUT",
          wire: "Red",
          purpose: "Driver power",
          voltage_note: "Driver input must match battery",
          warning: SAFETY,
        },
        {
          from_component: "Battery -",
          to_component: "Motor Driver GND",
          pin: "BAT-",
          wire: "Black",
          purpose: "Common ground",
          voltage_note: "Common ground required",
          warning: SAFETY,
        },
        {
          from_component: "Controller GPIO",
          to_component: "Motor Driver Input",
          pin: "GPIO TBD",
          wire: "Signal",
          purpose: "Motor control",
          voltage_note: "Logic level compatibility REQUIRES VERIFICATION",
          warning: SAFETY,
        },
        {
          from_component: "Motor Driver Output",
          to_component: "Motors",
          pin: "OUTx",
          wire: "Motor leads",
          purpose: "Drive motors",
          voltage_note: "Motor current REQUIRES VERIFICATION",
          warning: SAFETY,
        },
      ],
    };
  }

  async runEngineeringCheck(): Promise<EngineeringCheckResult> {
    return {
      provider: this.name,
      overall_status: "REQUIRES_VERIFICATION",
      items: [
        {
          check_name: "Motor voltage compatibility",
          status: "REQUIRES_VERIFICATION",
          detail: "Motor and battery voltages are not both confirmed.",
        },
        {
          check_name: "Battery capacity",
          status: "REQUIRES_VERIFICATION",
          detail: "Capacity unknown from current data.",
        },
        {
          check_name: "Motor driver current rating",
          status: "REQUIRES_VERIFICATION",
          detail: "Driver continuous current vs motor stall current unknown.",
        },
        {
          check_name: "Controller compatibility",
          status: "PASS",
          detail: "A microcontroller can generate control signals once pins are assigned.",
        },
        {
          check_name: "Sensor voltage",
          status: "REQUIRES_VERIFICATION",
          detail: "Sensor voltage levels not confirmed.",
        },
        {
          check_name: "Fuse requirement",
          status: "REQUIRES_VERIFICATION",
          detail: "Fuse amp rating cannot be set without current data.",
        },
        {
          check_name: "Missing components",
          status: "REQUIRES_VERIFICATION",
          detail: "Run inventory sync to confirm missing items.",
        },
        {
          check_name: "Unknown specifications",
          status: "REQUIRES_VERIFICATION",
          detail: "Multiple specifications remain unconfirmed.",
        },
      ],
    };
  }
}
