import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { getTrendById } from "@/lib/market-trends";
import type { RobotBuildPlan } from "@/types";

function planFromTrend(
  userId: string,
  trendId: string,
  locale: "en" | "hinglish",
  ownIdea = ""
): RobotBuildPlan | null {
  const trend = getTrendById(trendId);
  if (!trend) return null;
  const copy = trend[locale];
  const ts = nowIso();
  return {
    id: newId(),
    user_id: userId,
    trend_id: trend.id,
    title: copy.title,
    tagline: copy.tagline,
    how_made: copy.how_made,
    market_why: copy.market_why,
    sell_use: copy.sell_use,
    own_idea: ownIdea || copy.your_idea_prompt,
    name: trend.starter_fields.name,
    purpose: trend.starter_fields.purpose,
    description: trend.starter_fields.description,
    target_load: trend.starter_fields.target_load,
    dimensions: trend.starter_fields.dimensions,
    movement: trend.starter_fields.movement,
    environment: trend.starter_fields.environment,
    power_preference: trend.starter_fields.power_preference,
    demand: trend.demand,
    sell_score: trend.sell_score,
    difficulty: trend.difficulty,
    keywords: [...trend.keywords],
    status: "EDITING",
    selected: false,
    project_id: null,
    created_at: ts,
    updated_at: ts,
  };
}

export async function GET() {
  const store = await readStore();
  const userId = getDemoUserId();
  const plans = store.robot_build_plans
    .filter((p) => p.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const selected = plans.find((p) => p.selected) || null;
  return ok({ plans, selected });
}

/** Create a build plan from a market trend (or blank custom). */
export async function POST(request: Request) {
  try {
    const body = await parseJson<{
      trend_id: string;
      locale?: "en" | "hinglish";
      own_idea?: string;
      select?: boolean;
    }>(request);
    if (!body.trend_id) return fail("trend_id required");

    const userId = getDemoUserId();
    const locale = body.locale === "en" ? "en" : "hinglish";
    const draft = planFromTrend(userId, body.trend_id, locale, body.own_idea);
    if (!draft) return fail("Unknown trend plan", 404);

    await updateStore((store) => {
      if (body.select) {
        for (const p of store.robot_build_plans) {
          if (p.user_id === userId) {
            p.selected = false;
            if (p.status === "SELECTED") p.status = "DRAFT";
          }
        }
        draft.selected = true;
        draft.status = "SELECTED";
      }
      store.robot_build_plans.unshift(draft);
    });

    return ok(draft, { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not create build plan", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<
      Partial<RobotBuildPlan> & {
        id: string;
        select?: boolean;
        apply_to_project?: boolean;
      }
    >(request);
    if (!body.id) return fail("Plan id required");

    const userId = getDemoUserId();
    const ts = nowIso();
    let projectId: string | null = null;

    await updateStore((store) => {
      const plan = store.robot_build_plans.find(
        (p) => p.id === body.id && p.user_id === userId
      );
      if (!plan) throw new Error("Build plan not found");

      const fields: (keyof RobotBuildPlan)[] = [
        "title",
        "tagline",
        "how_made",
        "market_why",
        "sell_use",
        "own_idea",
        "name",
        "purpose",
        "description",
        "target_load",
        "dimensions",
        "movement",
        "environment",
        "power_preference",
        "status",
      ];
      for (const key of fields) {
        const value = body[key];
        if (value !== undefined) {
          Object.assign(plan, { [key]: value });
        }
      }

      if (body.select) {
        for (const p of store.robot_build_plans) {
          if (p.user_id === userId) {
            p.selected = p.id === plan.id;
            if (p.selected) p.status = "SELECTED";
            else if (p.status === "SELECTED") p.status = "DRAFT";
          }
        }
      }

      if (body.apply_to_project) {
        plan.selected = true;
        plan.status = "BUILDING";
        for (const p of store.robot_build_plans) {
          if (p.user_id === userId && p.id !== plan.id) p.selected = false;
        }

        let project = store.robot_projects.find(
          (p) => p.user_id === userId && p.status === "active"
        );
        if (!project) {
          project = {
            id: newId(),
            user_id: userId,
            name: plan.name,
            purpose: plan.purpose,
            description: `${plan.description}\n\nOwn idea / IDH:\n${plan.own_idea}\n\nSell / utilize:\n${plan.sell_use}`,
            target_load: plan.target_load,
            dimensions: plan.dimensions,
            movement: plan.movement,
            environment: plan.environment,
            power_preference: plan.power_preference,
            status: "active",
            progress: "IDEA",
            progress_percent: 8,
            cover_image_url: "/demo/inspection-robot.svg",
            is_demo: false,
            approved_at: null,
            build_plan_id: plan.id,
            trend_id: plan.trend_id,
            created_at: ts,
            updated_at: ts,
          };
          store.robot_projects.unshift(project);
          store.project_notes.push({
            id: newId(),
            project_id: project.id,
            user_id: userId,
            title: "Market trend + IDH plan",
            body: `Trend: ${plan.title}\nHow market makes it: ${plan.how_made}\nSell: ${plan.sell_use}\nOwn idea: ${plan.own_idea}`,
            created_at: ts,
            updated_at: ts,
          });
        } else {
          project.name = plan.name;
          project.purpose = plan.purpose;
          project.description = `${plan.description}\n\nOwn idea / IDH:\n${plan.own_idea}\n\nSell / utilize:\n${plan.sell_use}`;
          project.target_load = plan.target_load;
          project.dimensions = plan.dimensions;
          project.movement = plan.movement;
          project.environment = plan.environment;
          project.power_preference = plan.power_preference;
          project.build_plan_id = plan.id;
          project.trend_id = plan.trend_id;
          project.updated_at = ts;
          if (project.progress === "IDEA" || project.progress_percent < 15) {
            project.progress = "ANALYSIS";
            project.progress_percent = 15;
          }
        }
        plan.project_id = project.id;
        projectId = project.id;
      }

      plan.updated_at = ts;
    });

    const store = await readStore();
    const plan = store.robot_build_plans.find((p) => p.id === body.id);
    return ok({ plan, project_id: projectId || plan?.project_id || null });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Build plan update failed", 400);
  }
}
