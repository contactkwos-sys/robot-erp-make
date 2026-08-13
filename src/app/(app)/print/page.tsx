"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  PrintJob,
  PrintTransferMethod,
  PrintablePart,
  PrinterProfile,
  RobotProject,
} from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { useLocale } from "@/contexts/locale";
import {
  Badge,
  Button,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/primitives";
import {
  Printer,
  Smartphone,
  MonitorSmartphone,
  Upload,
  Send,
  Copy,
  Check,
  Download,
} from "lucide-react";

type PrinterPayload = {
  printer: PrinterProfile;
  printers: PrinterProfile[];
};

export default function PrintCenterPage() {
  const { locale } = useLocale();
  const hi = locale === "hinglish";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printer, setPrinter] = useState<PrinterProfile | null>(null);
  const [parts, setParts] = useState<PrintablePart[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [projects, setProjects] = useState<RobotProject[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [printerData, partList, jobList, projectList] = await Promise.all([
        apiGet<PrinterPayload>("/api/printer"),
        apiGet<PrintablePart[]>("/api/printable-parts"),
        apiGet<PrintJob[]>("/api/print-jobs"),
        apiGet<RobotProject[]>("/api/projects"),
      ]);
      setPrinter(printerData.printer);
      setParts(partList);
      setJobs(jobList);
      setProjects(projectList);
      if (partList.length === 0) {
        await fetch("/api/printer", { method: "POST" });
        const seeded = await apiGet<PrintablePart[]>("/api/printable-parts");
        setParts(seeded);
        const refreshed = await apiGet<PrinterPayload>("/api/printer");
        setPrinter(refreshed.printer);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Print center failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePrinter = async () => {
    if (!printer) return;
    setBusyId("printer");
    try {
      const saved = await apiSend<PrinterProfile>("/api/printer", "PATCH", printer);
      setPrinter(saved);
      setMessage(hi ? "Bambu Handy / printer settings save हो गए।" : "Printer settings saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  };

  const uploadFile = async (partId: string, file: File) => {
    setBusyId(partId);
    try {
      const body = new FormData();
      body.append("part_id", partId);
      body.append("file", file);
      const res = await fetch("/api/printable-parts", { method: "POST", body });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Upload failed");
      setMessage(hi ? "3D file ready — अब command भेज सकते हो।" : "3D file ready — you can send the command.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyId(null);
    }
  };

  const queueAndSend = async (part: PrintablePart, method?: PrintTransferMethod) => {
    setBusyId(part.id);
    try {
      const transfer = method || printer?.preferred_transfer || "ANYDESK";
      const job = await apiSend<PrintJob>("/api/print-jobs", "POST", {
        printable_part_id: part.id,
        project_id: part.project_id,
        transfer_method: transfer,
      });
      const sent = await apiSend<PrintJob>("/api/print-jobs", "PATCH", {
        id: job.id,
        status: "SENT",
        transfer_method: transfer,
        transfer_notes:
          transfer === "ANYDESK"
            ? "File path ready for AnyDesk copy to printer PC → Bambu Handy/Studio print"
            : transfer === "ULTRAVIEWER"
              ? "File path ready for UltraViewer copy to printer PC → Bambu Handy/Studio print"
              : "Queued for Bambu Handy / LAN print workflow",
      });
      setMessage(
        hi
          ? `${part.part_name}: command pack ready (${transfer}). AnyDesk/UltraViewer से printer PC पर भेजो, फिर Bambu Handy से Print.`
          : `${part.part_name}: command pack ready (${transfer}). Send via AnyDesk/UltraViewer, then Print in Bambu Handy.`
      );
      await navigator.clipboard.writeText(JSON.stringify(sent.command_pack, null, 2));
      setCopied(sent.id);
      setTimeout(() => setCopied(null), 2000);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusyId(null);
    }
  };

  const markJob = async (jobId: string, status: PrintJob["status"]) => {
    await apiSend("/api/print-jobs", "PATCH", { id: jobId, status });
    await load();
  };

  if (loading) return <LoadingState label="Loading Bambu print center…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!printer) return null;

  return (
    <div>
      <PageHeader
        title={hi ? "3D Print Center / Bambu Handy" : "3D Print Center + Bambu Handy"}
        subtitle={
          hi
            ? "Robot के 3D parts → file → AnyDesk/UltraViewer → Bambu Handy से printer को command।"
            : "Robot 3D parts → file → AnyDesk/UltraViewer → send print command with Bambu Handy."
        }
        actions={
          <>
            <Link href="/easy">
              <Button>{hi ? "Easy Robot" : "Easy Robot"}</Button>
            </Link>
            <Button variant="primary" onClick={load}>
              Refresh
            </Button>
          </>
        }
      />

      {message ? (
        <Panel className="mb-4 border-[color-mix(in_oklab,var(--accent-2)_40%,var(--border))] text-sm">
          {message}
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="text-[var(--accent)]" size={18} />
            <h2 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Bambu Handy {hi ? "(active app)" : "(your active app)"}
            </h2>
            <Badge tone={printer.bambu_handy_active ? "success" : "warning"}>
              {printer.bambu_handy_active ? "ACTIVE" : "OFF"}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>Printer name</span>
              <Input
                value={printer.name}
                onChange={(e) => setPrinter({ ...printer, name: e.target.value })}
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Model</span>
              <Input
                value={printer.model}
                onChange={(e) => setPrinter({ ...printer, model: e.target.value })}
                placeholder="A1 / P1S / X1C…"
              />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={printer.bambu_handy_active}
                onChange={(e) =>
                  setPrinter({ ...printer, bambu_handy_active: e.target.checked })
                }
              />
              {hi
                ? "Bambu Handy phone pe download + active है"
                : "Bambu Handy is downloaded and active on my phone"}
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <span>Notes</span>
              <Textarea
                rows={2}
                value={printer.bambu_handy_notes}
                onChange={(e) =>
                  setPrinter({ ...printer, bambu_handy_notes: e.target.value })
                }
              />
            </label>
          </div>
        </Panel>

        <Panel className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <MonitorSmartphone className="text-[var(--accent-2)]" size={18} />
            <h2 className="font-semibold">
              {hi ? "Laptop → Printer PC" : "Laptop → Printer PC"}
            </h2>
          </div>
          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <span>AnyDesk ID</span>
              <Input
                value={printer.anydesk_id}
                onChange={(e) => setPrinter({ ...printer, anydesk_id: e.target.value })}
                placeholder="e.g. 1 234 567 890"
              />
            </label>
            <label className="text-sm space-y-1 block">
              <span>UltraViewer ID</span>
              <Input
                value={printer.ultraviewer_id}
                onChange={(e) => setPrinter({ ...printer, ultraviewer_id: e.target.value })}
                placeholder="UltraViewer ID"
              />
            </label>
            <label className="text-sm space-y-1 block">
              <span>{hi ? "Preferred transfer" : "Preferred transfer"}</span>
              <Select
                value={printer.preferred_transfer}
                onChange={(e) =>
                  setPrinter({
                    ...printer,
                    preferred_transfer: e.target.value as PrintTransferMethod,
                  })
                }
              >
                <option value="ANYDESK">AnyDesk</option>
                <option value="ULTRAVIEWER">UltraViewer</option>
                <option value="BAMBU_HANDY">Bambu Handy direct</option>
                <option value="LAN">LAN (advanced)</option>
                <option value="USB">USB stick</option>
              </Select>
            </label>
            <label className="text-sm space-y-1 block">
              <span>{hi ? "Printer PC folder" : "Printer PC folder"}</span>
              <Input
                value={printer.printer_pc_path}
                onChange={(e) =>
                  setPrinter({ ...printer, printer_pc_path: e.target.value })
                }
              />
            </label>
          </div>
        </Panel>
      </div>

      <Panel className="mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm space-y-1">
            <span>LAN IP (optional)</span>
            <Input
              value={printer.lan_ip}
              onChange={(e) => setPrinter({ ...printer, lan_ip: e.target.value })}
              placeholder="192.168.x.x"
            />
          </label>
          <label className="text-sm space-y-1">
            <span>Access code</span>
            <Input
              value={printer.access_code}
              onChange={(e) => setPrinter({ ...printer, access_code: e.target.value })}
              placeholder="Bambu LAN access code"
            />
          </label>
          <label className="text-sm space-y-1">
            <span>Serial</span>
            <Input
              value={printer.serial}
              onChange={(e) => setPrinter({ ...printer, serial: e.target.value })}
              placeholder="Printer serial"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={busyId === "printer"} onClick={savePrinter}>
            {hi ? "Settings Save करो" : "Save printer settings"}
          </Button>
          <Badge tone="info">
            {hi
              ? "Beginner path: AnyDesk/UltraViewer + Bambu Handy"
              : "Beginner path: AnyDesk/UltraViewer + Bambu Handy"}
          </Badge>
        </div>
        <ol className="mt-4 space-y-2 text-sm text-[var(--fg-muted)] list-decimal pl-5">
          <li>
            {hi
              ? "Robot part का STL/3MF यहीं upload करो।"
              : "Upload the robot part STL/3MF here."}
          </li>
          <li>
            {hi
              ? "Send command दबाओ — pack clipboard में copy हो जाता है।"
              : "Click Send command — pack is copied to clipboard."}
          </li>
          <li>
            {hi
              ? `AnyDesk (${printer.anydesk_id || "ID"}) या UltraViewer (${printer.ultraviewer_id || "ID"}) से printer PC खोलो।`
              : `Open printer PC with AnyDesk (${printer.anydesk_id || "ID"}) or UltraViewer (${printer.ultraviewer_id || "ID"}).`}
          </li>
          <li>
            {hi
              ? `File को ${printer.printer_pc_path} में copy करो।`
              : `Copy the file into ${printer.printer_pc_path}.`}
          </li>
          <li>
            {hi
              ? "Phone पर Bambu Handy खोलो → Print / Send to printer।"
              : "Open Bambu Handy on phone → Print / Send to printer."}
          </li>
        </ol>
      </Panel>

      <PageHeader
        title={hi ? "Robot के 3D print parts" : "Robot 3D print parts"}
        subtitle={
          hi
            ? "जो parts print करने हैं — file लगाओ, command भेजो।"
            : "Parts needed for the robot — attach file, send command."
        }
      />

      <div className="mb-6 grid gap-3">
        {parts.map((part) => {
          const project = projects.find((p) => p.id === part.project_id);
          return (
            <Panel key={part.id} className="animate-fade-up">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Printer size={16} className="text-[var(--accent)]" />
                    <h3 className="font-semibold">
                      {hi ? part.part_name_hi || part.part_name : part.part_name}
                    </h3>
                    <StatusBadge status={part.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">
                    {hi ? part.purpose_hi || part.purpose : part.purpose}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-mono text-[var(--fg-muted)]">
                    <span>
                      {part.material} · {part.color}
                    </span>
                    <span>x{part.quantity}</span>
                    <span>~{part.estimated_minutes} min</span>
                    {project ? <span>Project: {project.name}</span> : null}
                  </div>
                  {part.file_path ? (
                    <div className="mt-2 text-sm">
                      <a className="underline" href={part.file_path} target="_blank" rel="noreferrer">
                        <Download size={14} className="inline mr-1" />
                        {part.file_name}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--warning)]">
                      {hi ? "अभी file नहीं — STL/3MF upload करो" : "No file yet — upload STL/3MF"}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[12rem]">
                  <label className="btn cursor-pointer justify-center">
                    <Upload size={14} />
                    {hi ? "STL/3MF Upload" : "Upload STL/3MF"}
                    <input
                      type="file"
                      accept=".stl,.3mf,.obj,.gcode,.gcode.3mf,model/*,application/octet-stream"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(part.id, file);
                      }}
                    />
                  </label>
                  <Button
                    variant="primary"
                    disabled={busyId === part.id || !part.file_path}
                    onClick={() => queueAndSend(part)}
                  >
                    <Send size={14} />
                    {hi ? "Command भेजो" : "Send command"}
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      className="flex-1 text-xs"
                      disabled={!part.file_path || busyId === part.id}
                      onClick={() => queueAndSend(part, "ANYDESK")}
                    >
                      AnyDesk
                    </Button>
                    <Button
                      className="flex-1 text-xs"
                      disabled={!part.file_path || busyId === part.id}
                      onClick={() => queueAndSend(part, "ULTRAVIEWER")}
                    >
                      UltraViewer
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <h2 className="font-semibold mb-3">
          {hi ? "Print jobs / commands" : "Print jobs / commands"}
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">
            {hi
              ? "अभी कोई job नहीं। Part पर file लगाकर Send command दबाओ।"
              : "No jobs yet. Upload a file and send a command."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Transfer</th>
                  <th>Status</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-[var(--fg-muted)]">
                        {job.material} · x{job.quantity}
                      </div>
                    </td>
                    <td>
                      <Badge tone="info">{job.transfer_method}</Badge>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="text-sm">
                      {job.file_path ? (
                        <a className="underline" href={job.file_path} target="_blank" rel="noreferrer">
                          {job.file_name}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          className="text-xs"
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              JSON.stringify(job.command_pack, null, 2)
                            );
                            setCopied(job.id);
                            setTimeout(() => setCopied(null), 1500);
                          }}
                        >
                          {copied === job.id ? <Check size={12} /> : <Copy size={12} />}
                          Pack
                        </Button>
                        <Button className="text-xs" onClick={() => markJob(job.id, "PRINTING")}>
                          Printing
                        </Button>
                        <Button
                          className="text-xs"
                          variant="secondary"
                          onClick={() => markJob(job.id, "DONE")}
                        >
                          Done
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
