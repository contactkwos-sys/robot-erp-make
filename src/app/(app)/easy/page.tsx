"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AI_HELPERS,
  EASY_PARTS,
  EASY_ROBOT,
  EASY_STEPS,
} from "@/lib/easy-robot";
import { useLocale } from "@/contexts/locale";
import {
  Badge,
  Button,
  PageHeader,
  Panel,
} from "@/components/ui/primitives";
import {
  Sparkles,
  ShoppingCart,
  Wrench,
  Code2,
  Copy,
  Check,
  ArrowRight,
  Heart,
} from "lucide-react";

export default function EasyRobotPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const hi = locale === "hinglish";
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };

  const startEasy = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/easy/start", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed");
      router.push(`/robots/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start");
      setBusy(false);
    }
  };

  return (
    <div className="easy-page">
      <section className="easy-hero animate-fade-up">
        <div className="easy-hero-inner">
          <Badge tone="accent">
            {hi ? "Hobby · Beginner · आसान रास्ता" : "Hobby · Beginner · Easiest path"}
          </Badge>
          <h1 className="easy-brand">
            {hi ? EASY_ROBOT.name_hi : EASY_ROBOT.name_en}
          </h1>
          <p className="easy-lead">
            {hi ? EASY_ROBOT.why_hi : EASY_ROBOT.why_en}
          </p>
          <p className="easy-meta">
            <Heart size={14} className="inline -mt-0.5 text-[var(--accent)]" />{" "}
            {hi
              ? "Professional होने की ज़रूरत नहीं — personally robot बनाना मज़ेदार है।"
              : "You do not need to be a professional — making robots for fun is enough."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" disabled={busy} onClick={startEasy}>
              {hi ? "एक क्लिक में शुरू करो" : "Start this easy robot"}
              <ArrowRight size={16} />
            </Button>
            <Link href="/plan">
              <Button>{hi ? "पूरा Chart Flow" : "Full chart flow"}</Button>
            </Link>
            <Link href="/print">
              <Button variant="secondary">
                {hi ? "Bambu Handy 3D Print" : "Bambu Handy 3D Print"}
              </Button>
            </Link>
            <Link href="/scanner">
              <Button variant="secondary">
                {hi ? "Amazon screenshot स्कैन" : "Scan Amazon screenshot"}
              </Button>
            </Link>
          </div>
          {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-mono uppercase tracking-wide text-[var(--fg-muted)]">
            <span>{hi ? EASY_ROBOT.time_hi : EASY_ROBOT.time_en}</span>
            <span>·</span>
            <span>{hi ? EASY_ROBOT.cost_hi : EASY_ROBOT.cost_en}</span>
            <span>·</span>
            <span>{hi ? EASY_ROBOT.skill_hi : EASY_ROBOT.skill_en}</span>
          </div>
        </div>
      </section>

      <PageHeader
        title={hi ? "6 आसान steps" : "6 easy steps"}
        subtitle={
          hi
            ? "Gemini + ChatGPT + Claude आपकी मदद करेंगे। आप सिर्फ follow करो।"
            : "Gemini, ChatGPT, and Claude help — you just follow along."
        }
      />

      <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {EASY_STEPS.map((step, i) => {
          const copy = step[locale];
          return (
            <Panel
              key={step.id}
              className="easy-step animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="easy-step-num">{String(step.id).padStart(2, "0")}</div>
              <h3 className="mt-2 font-semibold">{copy.title}</h3>
              <p className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed">{copy.body}</p>
            </Panel>
          );
        })}
      </div>

      <Panel className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {hi ? "छोटी shopping list (इतना ही काफी)" : "Short shopping list (this is enough)"}
          </h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{hi ? "Item" : "Item"}</th>
                <th>Qty</th>
                <th>{hi ? "क्यों चाहिए?" : "Why?"}</th>
              </tr>
            </thead>
            <tbody>
              {EASY_PARTS.map((p) => (
                <tr key={p.name_en}>
                  <td>{hi ? p.name_hi : p.name_en}</td>
                  <td className="font-mono">{p.qty}</td>
                  <td className="text-sm text-[var(--fg-muted)]">{hi ? p.why_hi : p.why_en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          {hi
            ? "Amazon screenshot लो → Product Scanner में डालो → Inventory में save। Used items बाद में Use 1 से mark करो।"
            : "Take an Amazon screenshot → Product Scanner → save to Inventory. Later mark used parts with Use 1."}
        </p>
      </Panel>

      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--accent-2)]" />
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {hi
            ? "Gemini · ChatGPT · Claude — copy & paste prompts"
            : "Gemini · ChatGPT · Claude — copy & paste prompts"}
        </h2>
      </div>
      <p className="mb-4 text-sm text-[var(--fg-muted)] max-w-3xl">
        {hi
          ? "तीनों AI दोस्त की तरह मदद करेंगे। Prompt copy करके उनकी chat में paste करो — beginner language में जवाब माँगो।"
          : "Treat them as friendly helpers. Copy a prompt, paste into their chat, and ask for beginner-level answers."}
      </p>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {AI_HELPERS.map((ai, i) => {
          const prompt = hi ? ai.prompt_hi : ai.prompt_en;
          return (
            <Panel
              key={ai.id}
              className="flex flex-col animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-lg" style={{ color: ai.color }}>
                    {ai.name}
                  </div>
                  <div className="text-xs text-[var(--fg-muted)] mt-1">
                    {hi ? ai.role_hi : ai.role_en}
                  </div>
                </div>
                <Button
                  onClick={() => copyPrompt(ai.id, prompt)}
                  className="shrink-0"
                >
                  {copied === ai.id ? <Check size={14} /> : <Copy size={14} />}
                  {copied === ai.id ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="easy-prompt mt-3 flex-1">{prompt}</pre>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Panel>
          <Wrench size={18} className="text-[var(--accent)] mb-2" />
          <h3 className="font-semibold">{hi ? "जोड़ना" : "Build"}</h3>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            {hi
              ? "Chassis → motors → sensor → board. Assembly guide app में भी है।"
              : "Chassis → motors → sensor → board. Use the in-app assembly guide too."}
          </p>
          <Link href="/assembly" className="mt-3 inline-block">
            <Button>Assembly</Button>
          </Link>
        </Panel>
        <Panel>
          <Code2 size={18} className="text-[var(--accent-2)] mb-2" />
          <h3 className="font-semibold">{hi ? "कोड" : "Code"}</h3>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            {hi
              ? "ChatGPT वाला prompt paste करो। Code Arduino IDE में upload। Wiring Claude से check।"
              : "Paste the ChatGPT prompt. Upload in Arduino IDE. Recheck wiring with Claude."}
          </p>
          <Link href="/wiring" className="mt-3 inline-block">
            <Button>Wiring</Button>
          </Link>
        </Panel>
        <Panel>
          <Sparkles size={18} className="text-[var(--warning)] mb-2" />
          <h3 className="font-semibold">{hi ? "सोचो + ट्रैक करो" : "Think + track"}</h3>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            {hi
              ? "Plan chart में देखो क्या है, क्या कम है, अगला step क्या है।"
              : "Use the plan chart to see what you have, what is missing, and the next step."}
          </p>
          <Link href="/plan" className="mt-3 inline-block">
            <Button variant="secondary">Robot Plan</Button>
          </Link>
        </Panel>
      </div>

      <Panel className="text-center py-8 easy-cta animate-fade-up">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {hi ? "आज ही छोटा robot शुरू करो" : "Start your small robot today"}
        </h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)] max-w-xl mx-auto">
          {hi
            ? "बड़ा सोचोगे तो अटक जाओगे। छोटा obstacle bot = सबसे आसान जीत।"
            : "Thinking too big stalls you. A tiny obstacle bot is the easiest win."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="primary" disabled={busy} onClick={startEasy}>
            {hi ? "Easy robot बनाओ" : "Create easy robot project"}
          </Button>
          <Link href="/robots/create">
            <Button>{hi ? "Custom wizard" : "Custom wizard"}</Button>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
