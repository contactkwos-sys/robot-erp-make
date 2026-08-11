"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { useAppSettings } from "@/contexts/app-settings";
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
  const [settings, setSettings] = useState<any>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/settings").then((s: any) => {
      setSettings(s);
      setName(s.user?.full_name || "");
    });
  }, []);

  if (!settings) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Beginner mode, theme, and integration status." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={beginnerMode} onChange={(e) => setBeginnerMode(e.target.checked)} />
            Beginner Mode — explain every component in simple language
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
            <strong>{settings.supabase_configured ? "Yes" : "No (local / demo store)"}</strong>
          </div>
          <p className="text-[var(--fg-muted)] mt-3">
            {settings.message ||
              "Copy .env.example to .env.local and set Supabase + AI keys for production. Without keys, DEMO MODE keeps the full workflow usable."}
          </p>
          <Button
            onClick={async () => {
              await fetch("/api/seed", { method: "POST" });
              setMessage("Demo data reset.");
            }}
          >
            Reset Demo Data
          </Button>
        </Panel>
      </div>
    </div>
  );
}
