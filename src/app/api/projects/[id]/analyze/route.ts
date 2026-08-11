import { ok, fail } from "@/lib/api";
import { getAIProvider } from "@/lib/ai";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { syncProjectInventory } from "@/lib/db/inventory-logic";
import { progressPercent } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const store = await readStore();
    const project = store.robot_projects.find((p) => p.id === id);
    if (!project) return fail("Project not found", 404);

    const ai = getAIProvider();
    const image = store.robot_images.find((i) => i.project_id === id);
    const result = await ai.analyzeRobotImage({
      imageUrl: image?.file_path,
      description: project.description,
      purpose: project.purpose,
      movement: project.movement,
      environment: project.environment,
      powerPreference: project.power_preference,
    });

    const userId = getDemoUserId();
    const now = nowIso();

    await updateStore((s) => {
      const p = s.robot_projects.find((x) => x.id === id);
      if (!p) throw new Error("Project not found");
      s.robot_analysis = s.robot_analysis.filter((a) => a.project_id !== id);
      s.robot_analysis.push({
        id: newId(),
        project_id: id,
        user_id: userId,
        provider: result.provider,
        summary: result.summary,
        markers: result.markers,
        warnings: result.warnings,
        raw_response: result as unknown as Record<string, unknown>,
        created_at: now,
      });
      s.project_components = s.project_components.filter((c) => c.project_id !== id);
      for (const c of result.components) {
        s.project_components.push({
          id: newId(),
          project_id: id,
          component_id: null,
          user_id: userId,
          component_name: c.component_name,
          category: c.category,
          image_url: null,
          quantity: c.quantity,
          purpose: c.purpose,
          where_used: c.where_used,
          required: c.required,
          suggested_specification: c.suggested_specification,
          specification_confirmed: c.specification_confirmed,
          confidence: c.confidence,
          notes: c.notes,
          unit_cost: 0,
          installation_location: c.where_used,
          inventory_item_id: null,
          inventory_status: "PURCHASE_REQUIRED",
          purchase_status: "REQUIRED",
          available_quantity: 0,
          missing_quantity: c.quantity,
          reserved_quantity: 0,
          beginner_what_is_it: c.beginner_what_is_it,
          beginner_what_does_it_do: c.beginner_what_does_it_do,
          beginner_where_fits: c.beginner_where_fits,
          beginner_what_else: c.beginner_what_else,
          created_at: now,
          updated_at: now,
        });
      }
      for (const w of result.warnings) {
        s.ai_recommendations.push({
          id: newId(),
          user_id: userId,
          project_id: id,
          category: "analysis",
          title: "AI analysis warning",
          body: w,
          severity: "warning",
          dismissed: false,
          created_at: now,
        });
      }
      p.progress = "ANALYSIS";
      p.progress_percent = progressPercent("ANALYSIS");
      p.updated_at = now;
    });

    await syncProjectInventory(id);

    // Generate assembly + wiring + engineering
    const assembly = await ai.generateAssemblyGuide({
      projectName: project.name,
      components: result.components,
    });
    const wiring = await ai.generateWiringPlan({
      projectName: project.name,
      components: result.components,
    });
    const engineering = await ai.runEngineeringCheck({
      projectName: project.name,
      components: result.components,
    });

    await updateStore((s) => {
      s.assembly_steps = s.assembly_steps.filter((a) => a.project_id !== id);
      for (const step of assembly.steps) {
        s.assembly_steps.push({
          id: newId(),
          project_id: id,
          user_id: userId,
          step_number: step.step_number,
          title: step.title,
          instructions: step.instructions,
          required_components: step.required_components,
          quantities: Object.fromEntries(step.required_components.map((n) => [n, 1])),
          tools: step.tools,
          installation_location: step.installation_location,
          reference_image_url: null,
          safety_warning: step.safety_warning,
          completed: false,
          completed_at: null,
          created_at: nowIso(),
        });
      }
      s.wiring_connections = s.wiring_connections.filter((w) => w.project_id !== id);
      for (const conn of wiring.connections) {
        s.wiring_connections.push({
          id: newId(),
          project_id: id,
          user_id: userId,
          ...conn,
          verified: false,
          created_at: nowIso(),
        });
      }
      s.engineering_checks = s.engineering_checks.filter((e) => e.project_id !== id);
      s.engineering_checks.push({
        id: newId(),
        project_id: id,
        user_id: userId,
        items: engineering.items.map((item) => ({ id: newId(), ...item })),
        overall_status: engineering.overall_status,
        created_at: nowIso(),
      });
      const p = s.robot_projects.find((x) => x.id === id);
      if (p) {
        p.progress = "BOM";
        p.progress_percent = progressPercent("BOM");
        p.updated_at = nowIso();
      }
    });

    await syncProjectInventory(id);
    const fresh = await readStore();
    return ok({
      analysis: fresh.robot_analysis.find((a) => a.project_id === id),
      components: fresh.project_components.filter((c) => c.project_id === id),
      warnings: result.warnings,
      provider: result.provider,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Analysis failed", 500);
  }
}
