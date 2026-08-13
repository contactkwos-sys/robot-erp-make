import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { buildBambuCommandPack } from "@/lib/print/defaults";
import type { PrintJob, PrintPartStatus, PrintTransferMethod } from "@/types";

export async function GET() {
  const store = await readStore();
  const userId = getDemoUserId();
  return ok(
    store.print_jobs
      .filter((j) => j.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function POST(request: Request) {
  try {
    const body = await parseJson<{
      printable_part_id?: string;
      project_id?: string | null;
      title?: string;
      file_name?: string;
      file_path?: string;
      file_type?: string;
      material?: string;
      color?: string;
      quantity?: number;
      transfer_method?: PrintTransferMethod;
    }>(request);

    const userId = getDemoUserId();
    const ts = nowIso();
    let created: PrintJob | null = null;

    await updateStore((store) => {
      const part = body.printable_part_id
        ? store.printable_parts.find((p) => p.id === body.printable_part_id)
        : null;
      const printer = store.printer_profiles.find((p) => p.user_id === userId) || null;
      const transfer =
        body.transfer_method ||
        printer?.preferred_transfer ||
        ("ANYDESK" as PrintTransferMethod);

      const job: PrintJob = {
        id: newId(),
        user_id: userId,
        project_id: body.project_id ?? part?.project_id ?? null,
        printable_part_id: part?.id || null,
        printer_id: printer?.id || null,
        title: body.title || part?.part_name || "Robot 3D print",
        file_name: body.file_name || part?.file_name || "",
        file_path: body.file_path || part?.file_path || "",
        file_type: body.file_type || part?.file_type || "",
        material: body.material || part?.material || "PLA",
        color: body.color || part?.color || "Any",
        quantity: body.quantity || part?.quantity || 1,
        transfer_method: transfer,
        command_pack: {},
        status: "QUEUED",
        transfer_notes: "",
        created_at: ts,
        updated_at: ts,
        sent_at: null,
        completed_at: null,
      };
      job.command_pack = buildBambuCommandPack({ job, part: part || null, printer });
      store.print_jobs.unshift(job);
      if (part) {
        part.status = "QUEUED";
        part.updated_at = ts;
      }
      created = job;
    });

    return ok(created, { status: 201 });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not queue print job", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<{
      id: string;
      status?: PrintPartStatus;
      transfer_method?: PrintTransferMethod;
      transfer_notes?: string;
    }>(request);
    if (!body.id) return fail("Job id required");

    const ts = nowIso();
    const store = await updateStore((s) => {
      const job = s.print_jobs.find((j) => j.id === body.id);
      if (!job) throw new Error("Print job not found");
      if (body.transfer_method) job.transfer_method = body.transfer_method;
      if (body.transfer_notes !== undefined) job.transfer_notes = body.transfer_notes;
      if (body.status) {
        job.status = body.status;
        if (body.status === "SENT" || body.status === "PRINTING") {
          job.sent_at = job.sent_at || ts;
        }
        if (body.status === "DONE") job.completed_at = ts;
        if (job.printable_part_id) {
          const part = s.printable_parts.find((p) => p.id === job.printable_part_id);
          if (part) {
            part.status = body.status;
            part.updated_at = ts;
          }
        }
      }
      const printer = s.printer_profiles.find((p) => p.id === job.printer_id) || null;
      const part = job.printable_part_id
        ? s.printable_parts.find((p) => p.id === job.printable_part_id) || null
        : null;
      job.command_pack = buildBambuCommandPack({ job, part, printer });
      job.updated_at = ts;
    });

    return ok(store.print_jobs.find((j) => j.id === body.id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Print job update failed", 400);
  }
}
