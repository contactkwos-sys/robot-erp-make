"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RobotBuildPlan } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { useLocale } from "@/contexts/locale";
import {
  Badge,
  Button,
  Input,
  Panel,
  Textarea,
} from "@/components/ui/primitives";
import {
  TrendingUp,
  Pencil,
  Check,
  Sparkles,
  Briefcase,
  Lightbulb,
} from "lucide-react";

type TrendCard = {
  id: string;
  year_label: string;
  demand: "HOT" | "RISING" | "STABLE";
  sell_score: number;
  difficulty: string;
  keywords: string[];
  en: {
    title: string;
    tagline: string;
    how_made: string;
    market_why: string;
    sell_use: string;
    your_idea_prompt: string;
  };
  hinglish: {
    title: string;
    tagline: string;
    how_made: string;
    market_why: string;
    sell_use: string;
    your_idea_prompt: string;
  };
};

export function TrendIdeaPlanner() {
  const { locale } = useLocale();
  const hi = locale === "hinglish";
  const router = useRouter();
  const [trends, setTrends] = useState<TrendCard[]>([]);
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RobotBuildPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<RobotBuildPlan[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSaved = async () => {
    const data = await apiGet<{ plans: RobotBuildPlan[]; selected: RobotBuildPlan | null }>(
      "/api/build-plans"
    );
    setSavedPlans(data.plans);
    if (data.selected) {
      setDraft(data.selected);
      setSelectedTrendId(data.selected.trend_id);
    }
  };

  useEffect(() => {
    apiGet<{ trends: TrendCard[] }>("/api/trends")
      .then((d) => setTrends(d.trends))
      .catch(() => setTrends([]));
    loadSaved().catch(() => undefined);
  }, []);

  const pickTrend = async (trendId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const plan = await apiSend<RobotBuildPlan>("/api/build-plans", "POST", {
        trend_id: trendId,
        locale: hi ? "hinglish" : "en",
        select: true,
      });
      setDraft(plan);
      setSelectedTrendId(trendId);
      setMessage(
        hi
          ? "Plan select हो गया — अब समझो, edit करो, अपना idea डालो।"
          : "Plan selected — review, edit, and add your own idea."
      );
      await loadSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not select plan");
    } finally {
      setBusy(false);
    }
  };

  const saveEdits = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await apiSend<{ plan: RobotBuildPlan }>("/api/build-plans", "PATCH", {
        ...draft,
        status: "EDITING",
        select: true,
      });
      setDraft(res.plan);
      setMessage(hi ? "Idea Update (IDH) save हो गया।" : "Idea Update (IDH) saved.");
      await loadSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const makeRobot = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await apiSend<{ plan: RobotBuildPlan; project_id: string | null }>(
        "/api/build-plans",
        "PATCH",
        {
          ...draft,
          apply_to_project: true,
          select: true,
        }
      );
      setDraft(res.plan);
      setMessage(
        hi
          ? "इसी plan से robot project बन / update हो गया। अब build शुरू करो।"
          : "Robot project created/updated from this plan. Start building."
      );
      if (res.project_id) router.push(`/robots/${res.project_id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Apply failed");
      setBusy(false);
    }
  };

  const activeTrend = trends.find((t) => t.id === selectedTrendId) || null;
  const copy = activeTrend ? activeTrend[locale] : null;

  return (
    <div className="mb-8">
      <Panel className="mb-4 border-[color-mix(in_oklab,var(--accent-2)_45%,var(--border))] animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="accent">IDH · Idea Update</Badge>
            <h2
              className="mt-2 text-xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {hi
                ? "Latest market trend से plan चुनो → समझो → edit → अपना idea → बनाओ"
                : "Pick a latest market-trend plan → understand → edit → your idea → build"}
            </h2>
            <p className="mt-2 text-sm text-[var(--fg-muted)] max-w-3xl">
              {hi
                ? "Robot अभी market में कैसे बन / बिक रहा है, professional तरीके से utilize/sell कैसे कर सकते हो — और अगर चाहो तो अपना plan डाल कर उसी से बनाओ।"
                : "See how robots are being made and sold in the market now, how to utilize/sell professionally, or write your own plan and build from it."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-[var(--fg-muted)]">
            <TrendingUp size={16} className="text-[var(--accent)]" />
            2025–2026 trends
          </div>
        </div>
      </Panel>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trends.map((trend, i) => {
          const tcopy = trend[locale];
          const active = selectedTrendId === trend.id;
          return (
            <button
              key={trend.id}
              type="button"
              disabled={busy}
              onClick={() => pickTrend(trend.id)}
              className={`text-left panel rounded-xl p-4 transition hover:-translate-y-0.5 animate-fade-up ${
                active
                  ? "border-[color-mix(in_oklab,var(--accent)_55%,var(--border))] ring-1 ring-[color-mix(in_oklab,var(--accent)_35%,transparent)]"
                  : ""
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    trend.demand === "HOT"
                      ? "danger"
                      : trend.demand === "RISING"
                        ? "warning"
                        : "info"
                  }
                >
                  {trend.demand}
                </Badge>
                <Badge tone="accent">Sell {trend.sell_score}/10</Badge>
                <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                  {trend.difficulty}
                </span>
              </div>
              <h3 className="mt-2 font-semibold">{tcopy.title}</h3>
              <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed">
                {tcopy.tagline}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {trend.keywords.slice(0, 4).map((k) => (
                  <span key={k} className="badge">
                    {k}
                  </span>
                ))}
              </div>
              {active ? (
                <div className="mt-3 text-xs text-[var(--success)] flex items-center gap-1">
                  <Check size={14} /> {hi ? "Selected — नीचे edit करो" : "Selected — edit below"}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {draft && copy ? (
        <Panel className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pencil size={16} className="text-[var(--accent)]" />
            <h3 className="font-semibold">
              {hi ? "Selected plan — समझो + edit (IDH)" : "Selected plan — understand + edit (IDH)"}
            </h3>
            <Badge tone="info">{draft.status}</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mb-4">
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-muted)]">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Sparkles size={14} /> {hi ? "Market कैसे बना रहा है" : "How market is making it"}
              </div>
              <p className="text-sm text-[var(--fg-muted)]">{draft.how_made}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-muted)]">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <TrendingUp size={14} /> {hi ? "क्यों trend है" : "Why this trend"}
              </div>
              <p className="text-sm text-[var(--fg-muted)]">{draft.market_why}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-muted)]">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Briefcase size={14} /> {hi ? "Professional sell / utilize" : "Professional sell / utilize"}
              </div>
              <p className="text-sm text-[var(--fg-muted)]">{draft.sell_use}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>{hi ? "Robot नाम" : "Robot name"}</span>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>{hi ? "Plan title" : "Plan title"}</span>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span>{hi ? "Purpose / ये क्या करेगा" : "Purpose"}</span>
              <Textarea
                rows={2}
                value={draft.purpose}
                onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span>{hi ? "Description / कैसे बनेगा" : "Description / how it will be made"}</span>
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span className="flex items-center gap-1">
                <Lightbulb size={14} />
                {hi ? "मेरा अपना Idea (IDH update)" : "My own idea (IDH update)"}
              </span>
              <Textarea
                rows={3}
                value={draft.own_idea}
                onChange={(e) => setDraft({ ...draft, own_idea: e.target.value })}
                placeholder={copy.your_idea_prompt}
              />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span>{hi ? "Sell / utilize plan (professional)" : "Sell / utilize plan (professional)"}</span>
              <Textarea
                rows={2}
                value={draft.sell_use}
                onChange={(e) => setDraft({ ...draft, sell_use: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Movement</span>
              <Input
                value={draft.movement}
                onChange={(e) => setDraft({ ...draft, movement: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Environment</span>
              <Input
                value={draft.environment}
                onChange={(e) => setDraft({ ...draft, environment: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Dimensions</span>
              <Input
                value={draft.dimensions}
                onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Power</span>
              <Input
                value={draft.power_preference}
                onChange={(e) => setDraft({ ...draft, power_preference: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={saveEdits}>
              {hi ? "IDH Save / Edit रखो" : "Save IDH edits"}
            </Button>
            <Button variant="primary" disabled={busy} onClick={makeRobot}>
              {hi ? "इसी plan से Robot बनाओ" : "Make robot from this plan"}
            </Button>
          </div>
          {message ? <p className="mt-3 text-sm text-[var(--accent-2)]">{message}</p> : null}
        </Panel>
      ) : (
        <Panel>
          <p className="text-sm text-[var(--fg-muted)]">
            {hi
              ? "ऊपर से कोई latest trend card चुनो — या “मेरा अपना Idea” blank plan लो।"
              : "Select a latest trend card above — or pick the blank “My Own Idea” plan."}
          </p>
          {message ? <p className="mt-2 text-sm text-[var(--accent-2)]">{message}</p> : null}
        </Panel>
      )}

      {savedPlans.length > 0 ? (
        <Panel className="mt-4">
          <h3 className="font-semibold mb-2">
            {hi ? "Saved / selected plans" : "Saved / selected plans"}
          </h3>
          <ul className="space-y-2 text-sm">
            {savedPlans.slice(0, 6).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2"
              >
                <span>
                  {p.title}{" "}
                  <span className="text-[var(--fg-muted)]">· {p.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  {p.selected ? <Badge tone="success">SELECTED</Badge> : null}
                  <Badge tone="info">{p.status}</Badge>
                  <Button
                    className="text-xs"
                    onClick={() => {
                      setDraft(p);
                      setSelectedTrendId(p.trend_id);
                    }}
                  >
                    {hi ? "खोलो" : "Open"}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
