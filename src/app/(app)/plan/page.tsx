"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { PLAN_STEPS } from "@/lib/i18n/messages";
import { useLocale } from "@/contexts/locale";
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from "@/components/ui/primitives";
import { TrendIdeaPlanner } from "@/components/plan/trend-idea-planner";
import {
  CheckCircle2,
  Circle,
  ArrowDown,
  Package,
  AlertTriangle,
  Boxes,
  Camera,
  Printer,
  Code2,
  Palette,
  Lightbulb,
  ImageIcon,
  Cog,
  ScanSearch,
  TrendingUp,
} from "lucide-react";

type PlanData = {
  inventory_empty: boolean;
  inventory_count: number;
  available_count: number;
  stock_value: number;
  used_transactions: number;
  buckets: {
    ok: boolean;
    message: string;
    missing: string[];
    empty: string[];
    buckets: Array<{
      name: string;
      exists: boolean;
      empty: boolean | null;
      detail?: string;
    }>;
  };
  active_project: {
    id: string;
    name: string;
    purpose: string;
    description: string;
    progress: string;
    progress_percent: number;
    cover_image_url: string | null;
    movement: string;
    power_preference: string;
  } | null;
  balance: {
    required: number;
    have: number;
    missing: number;
    useful: number;
    have_items: Array<{ id: string; name: string; qty: number; available: number }>;
    missing_items: Array<{ id: string; name: string; qty: number; missing: number }>;
    useful_items: Array<{
      id: string;
      name: string;
      available: number;
      reserved: number;
    }>;
  };
  steps: Array<{ id: string; done: boolean; href: string }>;
  projects_count: number;
};

const STEP_ICONS: Record<string, typeof Lightbulb> = {
  idh: TrendingUp,
  idea: Lightbulb,
  image: ImageIcon,
  purpose: Cog,
  analysis: ScanSearch,
  stock: Package,
  gap: AlertTriangle,
  scan: Camera,
  print: Printer,
  code: Code2,
  finish: Palette,
};

export default function PlanPage() {
  const { locale, t } = useLocale();
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [bucketMsg, setBucketMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<PlanData>("/api/plan"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ensureBuckets = async () => {
    setBusy(true);
    setBucketMsg(null);
    try {
      const res = await fetch("/api/storage/buckets", { method: "POST" });
      const json = await res.json();
      setBucketMsg(json?.data?.message || json?.error || "Bucket check done");
      await load();
    } catch (e) {
      setBucketMsg(e instanceof Error ? e.message : "Ensure buckets failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading robot plan…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const doneCount = data.steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / data.steps.length) * 100);
  const bucketsMissing = data.buckets.missing.length > 0;
  const bucketsEmpty =
    !bucketsMissing && data.buckets.empty.length === data.buckets.buckets.length;

  return (
    <div className="plan-page">
      <PageHeader
        title={t("plan.title")}
        subtitle={t("plan.subtitle")}
        actions={
          <>
            <Button onClick={load}>{t("plan.refresh")}</Button>
            <Button variant="secondary" disabled={busy} onClick={ensureBuckets}>
              {t("plan.ensure_buckets")}
            </Button>
            <Link href="/easy">
              <Button variant="secondary">
                {locale === "hinglish" ? "सबसे आसान रास्ता" : "Easiest path"}
              </Button>
            </Link>
            <Link href="/robots/create">
              <Button variant="primary">
                {locale === "hinglish" ? "नया Robot बनाओ" : "Create Robot"}
              </Button>
            </Link>
          </>
        }
      />

      <Panel className="mb-6 animate-fade-up border-[color-mix(in_oklab,var(--accent)_40%,var(--border))]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="accent">
              {locale === "hinglish" ? "Beginner shortcut" : "Beginner shortcut"}
            </Badge>
            <h2 className="mt-2 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {locale === "hinglish"
                ? "Professional नहीं? कोई बात नहीं — Easy Robot से शुरू करो"
                : "Not a professional? Start with the Easy Robot path"}
            </h2>
            <p className="mt-2 text-sm text-[var(--fg-muted)] max-w-2xl">
              {locale === "hinglish"
                ? "Gemini + ChatGPT + Claude के ready prompts, छोटी shopping list, और 6 simple steps। Personal hobby के लिए सबसे आसान।"
                : "Ready prompts for Gemini, ChatGPT, and Claude, a short shopping list, and 6 simple steps — easiest for personal hobby builds."}
            </p>
          </div>
          <Link href="/easy">
            <Button variant="primary">
              {locale === "hinglish" ? "Easy Start खोलो" : "Open Easy Start"}
            </Button>
          </Link>
        </div>
      </Panel>

      <div id="idh-trends">
        <TrendIdeaPlanner />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Panel className="animate-fade-up">
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-mono">
            Storage Buckets
          </div>
          <div className="mt-2 flex items-center gap-2">
            {bucketsMissing || bucketsEmpty ? (
              <Badge tone="warning">{t("plan.bucket_empty")}</Badge>
            ) : (
              <Badge tone="success">{t("plan.bucket_ok")}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">{data.buckets.message}</p>
          {bucketMsg ? <p className="mt-2 text-xs text-[var(--accent-2)]">{bucketMsg}</p> : null}
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-mono">
            Stock / स्टॉक
          </div>
          <div className="mt-2 flex items-center gap-2">
            {data.inventory_empty ? (
              <Badge tone="warning">{t("plan.stock_empty")}</Badge>
            ) : (
              <Badge tone="success">{t("plan.stock_ok")}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm">
            {data.inventory_count} items · {data.available_count} available ·{" "}
            {formatCurrency(data.stock_value)}
          </p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">
            Used / इस्तेमाल: {data.used_transactions} transactions
          </p>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-mono">
            Balance / बैलेंस
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-semibold text-[var(--success)]">{data.balance.have}</div>
              <div className="text-[10px] uppercase text-[var(--fg-muted)]">{t("plan.have")}</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--danger)]">{data.balance.missing}</div>
              <div className="text-[10px] uppercase text-[var(--fg-muted)]">{t("plan.missing")}</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-[var(--accent-2)]">{data.balance.useful}</div>
              <div className="text-[10px] uppercase text-[var(--fg-muted)]">{t("plan.useful")}</div>
            </div>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="text-xs uppercase tracking-wider text-[var(--fg-muted)] font-mono">
            Plan Progress
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span>
              {doneCount}/{data.steps.length} steps
            </span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={progress} />
          </div>
          {data.active_project ? (
            <p className="mt-2 text-sm truncate">
              Active: <strong>{data.active_project.name}</strong>
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              {locale === "hinglish" ? "अभी कोई active robot नहीं" : "No active robot yet"}
            </p>
          )}
        </Panel>
      </div>

      {data.active_project ? (
        <Panel className="mb-6 overflow-hidden plan-hero animate-fade-up">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="plan-hero-visual industrial-grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.active_project.cover_image_url || "/demo/inspection-robot.svg"}
                alt={data.active_project.name}
                className="h-full w-full max-h-72 object-contain"
              />
            </div>
            <div className="p-1">
              <Badge tone="accent">Active Robot</Badge>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                {data.active_project.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">{data.active_project.purpose}</p>
              <div className="mt-4 space-y-1 text-sm">
                <div>
                  <strong>{locale === "hinglish" ? "कैसे चलेगा:" : "Movement:"}</strong>{" "}
                  {data.active_project.movement || "—"}
                </div>
                <div>
                  <strong>{locale === "hinglish" ? "Power:" : "Power:"}</strong>{" "}
                  {data.active_project.power_preference || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <strong>Progress:</strong>
                  <StatusBadge status={data.active_project.progress} />
                  <span className="font-mono text-xs">{data.active_project.progress_percent}%</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/robots/${data.active_project.id}`}>
                  <Button variant="primary">Open Robot</Button>
                </Link>
                <Link href="/inventory">
                  <Button>Stock</Button>
                </Link>
                <Link href="/scanner">
                  <Button>Amazon Scan</Button>
                </Link>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {locale === "hinglish" ? "Chart Flow / चार्ट फ्लो" : "Build Chart Flow"}
          </h2>
          <Badge tone="info">
            {locale === "hinglish" ? "सोचो → बनाओ → कोड → फिनिश" : "Think → Build → Code → Finish"}
          </Badge>
        </div>

        <div className="plan-flow">
          {PLAN_STEPS.map((step, index) => {
            const runtime = data.steps.find((s) => s.id === step.id);
            const copy = step[locale];
            const Icon = STEP_ICONS[step.id] || Boxes;
            const done = Boolean(runtime?.done);
            return (
              <div key={step.id} className="plan-flow-item animate-fade-up" style={{ animationDelay: `${index * 45}ms` }}>
                <Link
                  href={runtime?.href || "/robots/create"}
                  className={`plan-node ${done ? "is-done" : "is-todo"}`}
                >
                  <div className="plan-node-icon">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{copy.title}</span>
                      {done ? (
                        <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
                      ) : (
                        <Circle size={16} className="text-[var(--fg-muted)] shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--fg-muted)] leading-relaxed">{copy.body}</p>
                  </div>
                  <span className="plan-step-num">{String(index + 1).padStart(2, "0")}</span>
                </Link>
                {index < PLAN_STEPS.length - 1 ? (
                  <div className="plan-connector" aria-hidden>
                    <ArrowDown size={16} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Panel>
          <h3 className="font-semibold mb-3">{t("plan.have")}</h3>
          {data.balance.have_items.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">
              {locale === "hinglish" ? "अभी matched stock नहीं" : "No matched stock yet"}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.balance.have_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <span>{item.name}</span>
                  <span className="font-mono text-xs text-[var(--success)]">
                    {item.available}/{item.qty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h3 className="font-semibold mb-3">{t("plan.missing")}</h3>
          {data.balance.missing_items.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">
              {locale === "hinglish" ? "कुछ missing नहीं 🎉" : "Nothing missing"}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.balance.missing_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <span>{item.name}</span>
                  <span className="font-mono text-xs text-[var(--danger)]">-{item.missing}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/purchases" className="mt-3 inline-block">
            <Button variant="secondary">
              {locale === "hinglish" ? "Purchase list खोलो" : "Open purchase list"}
            </Button>
          </Link>
        </Panel>
        <Panel>
          <h3 className="font-semibold mb-3">{t("plan.useful")}</h3>
          {data.balance.useful_items.length === 0 ? (
            <p className="text-sm text-[var(--fg-muted)]">
              {locale === "hinglish" ? "पहले analysis चलाओ" : "Run analysis first"}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.balance.useful_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
                  <span>{item.name}</span>
                  <span className="font-mono text-xs text-[var(--accent-2)]">
                    avail {item.available}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <h3 className="font-semibold mb-3">
          {locale === "hinglish" ? "Bucket Status / बकेट स्टेटस" : "Bucket Status"}
        </h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Exists</th>
                <th>Empty?</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets.buckets.map((b) => (
                <tr key={b.name}>
                  <td className="font-mono text-xs">{b.name}</td>
                  <td>{b.exists ? "Yes" : "No"}</td>
                  <td>
                    {b.empty === null ? "—" : b.empty ? "Yes / खाली" : "No / भरा"}
                  </td>
                  <td className="text-sm text-[var(--fg-muted)]">{b.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">
          SQL: <code>supabase/migrations/20260812234000_create_storage_buckets.sql</code>
        </p>
      </Panel>
    </div>
  );
}
