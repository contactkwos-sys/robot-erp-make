"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  PageHeader,
  Panel,
  ProgressBar,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { apiSend } from "@/lib/client-api";

const STEPS = [
  "Robot Name",
  "Robot Purpose",
  "Upload Robot Image",
  "Describe Robot",
  "Target Load",
  "Approximate Dimensions",
  "Required Movement",
  "Environment",
  "Power Preference",
  "AI Analysis",
];

export default function CreateRobotPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    purpose: "",
    description: "",
    target_load: "",
    dimensions: "",
    movement: "",
    environment: "",
    power_preference: "",
    image_kind: "concept" as
      | "concept"
      | "photo"
      | "sketch"
      | "drawing"
      | "pdf"
      | "reference",
    image_path: "",
    file_name: "",
    file_type: "",
    file_size: 0,
    cover_image_url: "",
  });

  const set = (key: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const upload = async (file: File) => {
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "robots");
    try {
      const data = await apiSend<{
        file_path: string;
        file_name: string;
        file_type: string;
        file_size: number;
      }>("/api/uploads", "POST", body);
      setForm((f) => ({
        ...f,
        image_path: data.file_path,
        file_name: data.file_name,
        file_type: data.file_type,
        file_size: data.file_size,
        cover_image_url: data.file_path,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return form.name.trim().length > 1;
      case 1:
        return form.purpose.trim().length > 1;
      case 2:
        return Boolean(form.image_path);
      case 3:
        return form.description.trim().length > 1;
      case 4:
        return form.target_load.trim().length > 0;
      case 5:
        return form.dimensions.trim().length > 0;
      case 6:
        return form.movement.trim().length > 0;
      case 7:
        return form.environment.trim().length > 0;
      case 8:
        return form.power_preference.trim().length > 0;
      default:
        return true;
    }
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      const project = await apiSend<{ id: string }>("/api/projects", "POST", {
        ...form,
        cover_image_url: form.image_path,
      });
      await apiSend(`/api/projects/${project.id}/analyze`, "POST");
      router.push(`/robots/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create robot");
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Robot"
        subtitle="10-step wizard from idea to AI analysis. Upload concept art, photos, sketches, drawings, or PDFs."
      />

      <Panel className="mb-4">
        <div className="flex justify-between text-xs text-[var(--fg-muted)] mb-2">
          <span>
            Step {step + 1} / {STEPS.length}: {STEPS[step]}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <ProgressBar value={((step + 1) / STEPS.length) * 100} />
      </Panel>

      <Panel className="max-w-3xl animate-fade-up">
        {step === 0 && (
          <Field label="Robot Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Warehouse Scout Bot" />
          </Field>
        )}
        {step === 1 && (
          <Field label="Robot Purpose">
            <Textarea
              rows={4}
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="What should this robot do?"
            />
          </Field>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <Field label="Image Kind">
              <Select
                value={form.image_kind}
                onChange={(e) => set("image_kind", e.target.value)}
              >
                <option value="concept">AI-generated concept</option>
                <option value="photo">Real robot photo</option>
                <option value="sketch">Sketch</option>
                <option value="drawing">Drawing</option>
                <option value="pdf">PDF</option>
                <option value="reference">Reference image</option>
              </Select>
            </Field>
            <Field label="Upload Robot Image">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                }}
              />
            </Field>
            {form.image_path ? (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_path} alt="Upload preview" className="max-h-72 w-full object-contain bg-[var(--bg-muted)]" />
              </div>
            ) : null}
          </div>
        )}
        {step === 3 && (
          <Field label="Describe Robot">
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe structure, expected parts, and constraints."
            />
          </Field>
        )}
        {step === 4 && (
          <Field label="Target Load">
            <Input value={form.target_load} onChange={(e) => set("target_load", e.target.value)} placeholder="e.g. 2 kg payload" />
          </Field>
        )}
        {step === 5 && (
          <Field label="Approximate Dimensions">
            <Input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="e.g. 400 x 300 x 250 mm" />
          </Field>
        )}
        {step === 6 && (
          <Field label="Required Movement">
            <Input value={form.movement} onChange={(e) => set("movement", e.target.value)} placeholder="e.g. differential drive, turn in place" />
          </Field>
        )}
        {step === 7 && (
          <Field label="Environment">
            <Input value={form.environment} onChange={(e) => set("environment", e.target.value)} placeholder="e.g. indoor warehouse" />
          </Field>
        )}
        {step === 8 && (
          <Field label="Power Preference">
            <Input value={form.power_preference} onChange={(e) => set("power_preference", e.target.value)} placeholder="e.g. 12V battery pack" />
          </Field>
        )}
        {step === 9 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--fg-muted)]">
              Ready to run AI analysis. Exact specifications will never be invented. Unclear values become
              “Specification not confirmed” or “REQUIRES VERIFICATION”.
            </p>
            <ul className="text-sm space-y-1 text-[var(--fg-muted)]">
              <li>• Name: {form.name}</li>
              <li>• Purpose: {form.purpose}</li>
              <li>• Image: {form.file_name || "none"}</li>
              <li>• Power: {form.power_preference}</li>
            </ul>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
            Previous
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={!canNext() || busy} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="primary" disabled={busy} onClick={finish}>
              {busy ? "Analyzing…" : "Run AI Analysis & Create"}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">{label}</span>
      {children}
    </label>
  );
}
