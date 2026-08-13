import { ok, fail, parseJson } from "@/lib/api";
import { getDemoUserId, newId, nowIso, readStore, updateStore } from "@/lib/db/store";
import { defaultPrinterProfile } from "@/lib/print/defaults";
import type { PrintTransferMethod, PrinterProfile } from "@/types";

export async function GET() {
  try {
    const store = await readStore();
    const userId = getDemoUserId();
    let printers = store.printer_profiles.filter((p) => p.user_id === userId);
    if (printers.length === 0) {
      const profile = defaultPrinterProfile(userId, nowIso());
      await updateStore((s) => {
        s.printer_profiles.push(profile);
      });
      printers = [profile];
    }
    return ok({
      printer: printers[0],
      printers,
      transfer_options: ["BAMBU_HANDY", "ANYDESK", "ULTRAVIEWER", "LAN", "USB"],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Printer load failed", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJson<Partial<PrinterProfile>>(request);
    const userId = getDemoUserId();
    const ts = nowIso();

    const store = await updateStore((s) => {
      let printer = s.printer_profiles.find((p) => p.user_id === userId);
      if (!printer) {
        printer = defaultPrinterProfile(userId, ts);
        s.printer_profiles.push(printer);
      }
      if (body.name !== undefined) printer.name = String(body.name);
      if (body.model !== undefined) printer.model = String(body.model);
      if (body.brand !== undefined) printer.brand = String(body.brand);
      if (body.bambu_handy_active !== undefined) {
        printer.bambu_handy_active = Boolean(body.bambu_handy_active);
      }
      if (body.bambu_handy_notes !== undefined) {
        printer.bambu_handy_notes = String(body.bambu_handy_notes);
      }
      if (body.lan_ip !== undefined) printer.lan_ip = String(body.lan_ip);
      if (body.access_code !== undefined) printer.access_code = String(body.access_code);
      if (body.serial !== undefined) printer.serial = String(body.serial);
      if (body.anydesk_id !== undefined) printer.anydesk_id = String(body.anydesk_id);
      if (body.ultraviewer_id !== undefined) printer.ultraviewer_id = String(body.ultraviewer_id);
      if (body.preferred_transfer !== undefined) {
        printer.preferred_transfer = body.preferred_transfer as PrintTransferMethod;
      }
      if (body.printer_pc_path !== undefined) {
        printer.printer_pc_path = String(body.printer_pc_path);
      }
      if (body.status !== undefined) printer.status = body.status;
      printer.last_checked_at = ts;
      printer.updated_at = ts;
    });

    return ok(store.printer_profiles.find((p) => p.user_id === userId));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Printer update failed", 500);
  }
}

/** Seed default printable parts for active/demo project if empty. */
export async function POST() {
  try {
    const { DEFAULT_PRINTABLE_PARTS } = await import("@/lib/print/defaults");
    const userId = getDemoUserId();
    const ts = nowIso();
    const store = await updateStore((s) => {
      if (!s.printer_profiles.some((p) => p.user_id === userId)) {
        s.printer_profiles.push(defaultPrinterProfile(userId, ts));
      }
      if (s.printable_parts.filter((p) => p.user_id === userId).length === 0) {
        const project =
          s.robot_projects.find((p) => p.user_id === userId && p.status === "active") ||
          s.robot_projects.find((p) => p.user_id === userId);
        for (const part of DEFAULT_PRINTABLE_PARTS) {
          s.printable_parts.push({
            id: newId(),
            user_id: userId,
            project_id: project?.id || null,
            ...part,
            created_at: ts,
            updated_at: ts,
          });
        }
      }
    });
    return ok({
      printer: store.printer_profiles.find((p) => p.user_id === userId),
      parts: store.printable_parts.filter((p) => p.user_id === userId),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Printer seed failed", 500);
  }
}
