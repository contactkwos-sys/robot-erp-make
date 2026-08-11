"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel rounded-xl p-4 md:p-5", className)} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between animate-fade-up">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          AI Robot Builder
        </div>
        <h1
          className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--fg-muted)] max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("select", props.className)} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("textarea", props.className)} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  className?: string;
}) {
  const colors: Record<string, string> = {
    neutral: "bg-[var(--bg-muted)] text-[var(--fg)]",
    success: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_40%,var(--border))]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_18%,transparent)] text-[var(--warning)] border-[color-mix(in_oklab,var(--warning)_40%,var(--border))]",
    danger: "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_40%,var(--border))]",
    info: "bg-[color-mix(in_oklab,var(--info)_18%,transparent)] text-[var(--info)] border-[color-mix(in_oklab,var(--info)_40%,var(--border))]",
    accent: "bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[var(--accent)] border-[color-mix(in_oklab,var(--accent)_40%,var(--border))]",
  };
  return <span className={cn("badge", colors[tone], className)}>{children}</span>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Panel className="animate-fade-up">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">{label}</div>
      <div className="mt-2 text-2xl md:text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-[var(--fg-muted)]">{hint}</div> : null}
    </Panel>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Panel className="text-center py-12">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--fg-muted)] max-w-md mx-auto">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Panel>
  );
}

function isDatabaseSetupMessage(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("database setup required") ||
    m.includes("app_stores") ||
    m.includes("schema cache") ||
    m.includes("supabase read failed") ||
    m.includes("supabase seed failed")
  );
}

export function ErrorState({
  message,
  onRetry,
  onCheckDatabase,
}: {
  message: string;
  onRetry?: () => void;
  onCheckDatabase?: () => void;
}) {
  const setupRequired = isDatabaseSetupMessage(message);

  if (setupRequired) {
    return (
      <Panel className="border-[color-mix(in_oklab,var(--warning)_45%,var(--border))]">
        <div className="font-semibold text-[var(--warning)]">Database setup required</div>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          {message ||
            "Could not reach the required Supabase tables. Run the app_stores migration, then retry."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {onCheckDatabase ? (
            <Button variant="secondary" onClick={onCheckDatabase}>
              Check Database
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/health";
              }}
            >
              Check Database
            </Button>
          )}
          {onRetry ? (
            <Button onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="border-[color-mix(in_oklab,var(--danger)_45%,var(--border))]">
      <div className="font-semibold text-[var(--danger)]">Something went wrong</div>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">{message}</p>
      {onRetry ? (
        <Button className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Panel>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Panel className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full bg-[var(--accent)] animate-pulse-soft" />
      <span className="text-sm text-[var(--fg-muted)]">{label}</span>
    </Panel>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status.includes("AVAILABLE") || status === "RECEIVED" || status === "PASS" || status === "COMPLETED"
      ? "success"
      : status.includes("REQUIRED") || status.includes("LOW") || status.includes("WARNING") || status === "ORDERED"
        ? "warning"
        : status.includes("OUT") || status === "FAIL" || status === "CANCELLED" || status === "DAMAGED"
          ? "danger"
          : status.includes("VERIFICATION") || status === "RESERVED"
            ? "info"
            : "neutral";
  return <Badge tone={tone as "success"}>{status.replaceAll("_", " ")}</Badge>;
}
