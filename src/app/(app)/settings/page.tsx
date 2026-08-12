"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { useAppSettings } from "@/contexts/app-settings";
import { useLocale } from "@/contexts/locale";
import type { Locale } from "@/lib/i18n/messages";
import {
  Button,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Select,
} from "@/components/ui/primitives";

export default function SettingsPage() {
  const { beginnerMode, setBeginnerMode, theme, setTheme, refresh } = useAppSettings();
  const { locale, setLocale, t } = useLocale();
  const [settings, setSettings] = useState<any>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<any>(null);

  useEffect(() => {
    apiGet("/api/settings").then((s: any) => {
      setSettings(s);
      setName(s.user?.full_name || "");
    });
    fetch("/api/storage/buckets")
      .then((r) => r.json())
      .then((json) => setBuckets(json?.data || null))
      .catch(() => setBuckets(null));
  }, []);

  if (!settings) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Beginner mode, language, theme, and integration status." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={beginnerMode} onChange={(e) => setBeginnerMode(e.target.checked)} />
            Beginner Mode — explain every component in simple language
          </label>
          <label className="block space-y-2 text-sm">
            <span>Language / भाषा</span>
            <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="hinglish">{t("lang.hinglish")}</option>
              <option value="en">{t("lang.en")}</option>
            </Select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Theme</span>
            <Select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </Select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>Display name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <Button
            variant="primary"
            onClick={async () => {
              await apiSend("/api/settings", "PATCH", { full_name: name });
              await refresh();
              setMessage("Settings saved.");
            }}
          >
            Save Settings
          </Button>
          {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
        </Panel>
        <Panel className="space-y-2 text-sm">
          <div>
            Mode:{" "}
            <strong>{settings.demo_mode ? "DEMO MODE" : "Connected"}</strong>
          </div>
          <div>
            Data backend: <strong>{settings.backend}</strong>
          </div>
          <div>
            Persistence: <strong>{settings.persistence || "n/a"}</strong>
          </div>
          <div>
            AI provider: <strong>{settings.ai_provider}</strong>
          </div>
          <div>
            Supabase configured:{" "}
            <strong>{settings.supabase_configured ? "Yes" : "No"}</strong>
          </div>
          {settings.serverless ? <div>Runtime: <strong>serverless</strong></div> : null}
          {settings.persistence_note ? (
            <p className="text-[var(--fg-muted)] mt-2">{settings.persistence_note}</p>
          ) : null}
          <p className="text-[var(--fg-muted)] mt-3">
            {settings.message ||
              "For durable Netlify data, run supabase/migrations/20260811165000_create_app_stores.sql and set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. Without keys, DEMO MODE keeps the workflow usable."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const res = await fetch("/api/health");
                const json = await res.json();
                const db = json?.data?.database;
                setBuckets(db?.storage_buckets || null);
                setMessage(
                  db?.message ||
                    json?.data?.warning ||
                    (json?.ok ? "Database check completed." : "Database check failed.")
                );
              }}
            >
              Check Database
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const res = await fetch("/api/storage/buckets", { method: "POST" });
                const json = await res.json();
                setBuckets(json?.data || null);
                setMessage(json?.data?.message || "Bucket ensure completed.");
              }}
            >
              Ensure Storage Buckets
            </Button>
            <Button
              onClick={async () => {
                await fetch("/api/seed", { method: "POST" });
                setMessage("Demo data reset.");
              }}
            >
              Reset Demo Data
            </Button>
          </div>
          {buckets ? (
            <div className="mt-4 rounded-md border border-[var(--border)] p-3 space-y-1">
              <div className="font-semibold">Storage buckets</div>
              <p className="text-[var(--fg-muted)]">{buckets.message}</p>
              {(buckets.buckets || []).map((b: any) => (
                <div key={b.name} className="font-mono text-xs">
                  {b.name}: {b.exists ? "exists" : "MISSING"}
                  {b.empty === true ? " · EMPTY" : b.empty === false ? " · has files" : ""}
                </div>
              ))}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
