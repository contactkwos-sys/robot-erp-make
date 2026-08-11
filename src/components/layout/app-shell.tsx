"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Bot,
  PlusSquare,
  ScanSearch,
  Boxes,
  Warehouse,
  ShoppingCart,
  Camera,
  GitCompare,
  Wrench,
  Cable,
  Calculator,
  Sparkles,
  FileText,
  Settings,
  Menu,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/app-settings";
import { Button, Input } from "@/components/ui/primitives";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/robots", label: "My Robots", icon: Bot },
  { href: "/robots/create", label: "Create Robot", icon: PlusSquare },
  { href: "/analysis", label: "Robot Analysis", icon: ScanSearch },
  { href: "/bom", label: "BOM / Components", icon: Boxes },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/purchases", label: "Purchase Required", icon: ShoppingCart },
  { href: "/scanner", label: "Product Scanner", icon: Camera },
  { href: "/comparison", label: "Product Comparison", icon: GitCompare },
  { href: "/assembly", label: "Assembly Guide", icon: Wrench },
  { href: "/wiring", label: "Wiring Guide", icon: Cable },
  { href: "/costing", label: "Costing", icon: Calculator },
  { href: "/recommendations", label: "AI Recommendations", icon: Sparkles },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 px-3 pb-6">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
              active
                ? "bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-white"
                : "text-[var(--sidebar-muted)] hover:bg-white/5 hover:text-[var(--sidebar-fg)]"
            )}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown[]> | null>(null);
  const { beginnerMode, setBeginnerMode } = useAppSettings();

  const runSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const json = await res.json();
    if (json.ok) setResults(json.data);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-fg)] border-r border-black/20">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">
            Industrial Suite
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            AI ROBOT BUILDER
          </div>
          <div className="mt-1 text-xs text-[var(--sidebar-muted)]">From Robot Idea to Working Machine</div>
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
          <NavList />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--sidebar)] text-[var(--sidebar-fg)] shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div>
                <div className="font-semibold">AI ROBOT BUILDER</div>
                <div className="text-xs text-[var(--sidebar-muted)]">Navigation</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-64px)] pt-3">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg-elevated)_88%,transparent)] backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <button className="lg:hidden btn btn-ghost px-2" onClick={() => setOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
              <Input
                className="pl-9"
                placeholder="Search projects, inventory, products, purchases…"
                value={query}
                onChange={(e) => runSearch(e.target.value)}
              />
              {results ? (
                <div className="absolute mt-2 w-full panel rounded-lg p-3 max-h-80 overflow-auto z-50">
                  {Object.entries(results).map(([group, items]) =>
                    (items as { id?: string; name?: string; item_name?: string; product_name?: string; title?: string; component_name?: string }[]).length ? (
                      <div key={group} className="mb-3">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                          {group}
                        </div>
                        {(items as { id?: string; name?: string; item_name?: string; product_name?: string; title?: string; component_name?: string }[])
                          .slice(0, 5)
                          .map((item, idx) => (
                            <div key={item.id || idx} className="text-sm py-1 border-b border-[var(--border)] last:border-0">
                              {item.name || item.item_name || item.product_name || item.title || item.component_name}
                            </div>
                          ))}
                      </div>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
            <label className="hidden sm:flex items-center gap-2 text-xs font-mono uppercase tracking-wide">
              <input
                type="checkbox"
                checked={beginnerMode}
                onChange={(e) => setBeginnerMode(e.target.checked)}
              />
              Beginner Mode
            </label>
            <Link href="/robots/create">
              <Button variant="primary" className="hidden md:inline-flex">
                New Robot
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
