"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type AppSettings = {
  beginnerMode: boolean;
  theme: Theme;
  setBeginnerMode: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AppSettings | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [beginnerMode, setBeginnerModeState] = useState(true);
  const [theme, setThemeState] = useState<Theme>("dark");

  const refresh = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.ok && json.data?.user) {
        setBeginnerModeState(Boolean(json.data.user.beginner_mode));
        setThemeState(json.data.user.theme || "dark");
        applyTheme(json.data.user.theme || "dark");
      }
    } catch {
      applyTheme("dark");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setBeginnerMode = async (v: boolean) => {
    setBeginnerModeState(v);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beginner_mode: v }),
    });
  };

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
    });
  };

  return (
    <Ctx.Provider value={{ beginnerMode, theme, setBeginnerMode, setTheme, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppSettings must be used within AppProviders");
  return ctx;
}
