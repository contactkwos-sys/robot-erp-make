import { ok } from "@/lib/api";
import { MARKET_TREND_PLANS } from "@/lib/market-trends";

/** Latest market-trend robot plans for Idea Update (IDH). */
export async function GET() {
  return ok({
    updated_label: "2025–2026 market trends",
    count: MARKET_TREND_PLANS.length,
    trends: MARKET_TREND_PLANS.map((t) => ({
      id: t.id,
      year_label: t.year_label,
      demand: t.demand,
      sell_score: t.sell_score,
      difficulty: t.difficulty,
      keywords: t.keywords,
      starter_fields: t.starter_fields,
      en: t.en,
      hinglish: t.hinglish,
    })),
  });
}
