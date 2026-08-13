import type { PrintJob, PrintablePart, PrinterProfile } from "@/types";

export const DEFAULT_PRINTABLE_PARTS: Omit<
  PrintablePart,
  "id" | "user_id" | "project_id" | "created_at" | "updated_at"
>[] = [
  {
    part_name: "Chassis Base Plate",
    part_name_hi: "Chassis Base Plate / बेस प्लेट",
    purpose: "Main body plate for motors, board, and battery",
    purpose_hi: "Motors, board, battery के लिए मुख्य प्लेट",
    material: "PLA",
    color: "Black / any",
    quantity: 1,
    estimated_minutes: 180,
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    status: "NEEDED",
    notes: "Easy robot / inspection robot body. Cardboard OK for v1 if no print yet.",
  },
  {
    part_name: "Ultrasonic Sensor Mount",
    part_name_hi: "Ultrasonic Mount / सेंसर माउंट",
    purpose: "Holds HC-SR04 on the front of the robot",
    purpose_hi: "सामने HC-SR04 पकड़ता है",
    material: "PLA",
    color: "Any",
    quantity: 1,
    estimated_minutes: 45,
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    status: "NEEDED",
    notes: "Small bracket — good first Bambu Handy print.",
  },
  {
    part_name: "ESP32 / Arduino Holder",
    part_name_hi: "Board Holder / बोर्ड होल्डर",
    purpose: "Keeps controller board fixed on chassis",
    purpose_hi: "Controller board को chassis पर फिक्स रखता है",
    material: "PLA",
    color: "Any",
    quantity: 1,
    estimated_minutes: 60,
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    status: "NEEDED",
    notes: "Use standoffs if you skip this print.",
  },
  {
    part_name: "Motor Mount Brackets (pair)",
    part_name_hi: "Motor Brackets / मोटर ब्रैकेट",
    purpose: "Secure geared motors to the frame",
    purpose_hi: "Motors को frame पर मजबूती से लगाता है",
    material: "PLA / PETG",
    color: "Any",
    quantity: 2,
    estimated_minutes: 90,
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    status: "NEEDED",
    notes: "PETG stronger if motors vibrate a lot.",
  },
  {
    part_name: "Battery Tray + Switch Clip",
    part_name_hi: "Battery Tray / बैटरी ट्रे",
    purpose: "Holds battery pack and on/off switch",
    purpose_hi: "Battery और switch के लिए",
    material: "PLA",
    color: "Any",
    quantity: 1,
    estimated_minutes: 70,
    file_name: "",
    file_path: "",
    file_type: "",
    file_size: 0,
    status: "NEEDED",
    notes: "Keep switch easy to reach.",
  },
];

export function defaultPrinterProfile(
  userId: string,
  now: string
): PrinterProfile {
  return {
    id: "printer-bambu-default",
    user_id: userId,
    name: "My Bambu Printer",
    brand: "Bambu Lab",
    model: "",
    bambu_handy_active: true,
    bambu_handy_notes: "Bambu Handy app phone pe download + active hai.",
    lan_ip: "",
    access_code: "",
    serial: "",
    anydesk_id: "",
    ultraviewer_id: "",
    preferred_transfer: "ANYDESK",
    printer_pc_path: "C:\\Users\\Public\\RobotPrints",
    status: "READY",
    last_checked_at: null,
    created_at: now,
    updated_at: now,
  };
}

export function buildBambuCommandPack(input: {
  job: PrintJob;
  part: PrintablePart | null;
  printer: PrinterProfile | null;
}) {
  const fileName = input.job.file_name || input.part?.file_name || "robot-part.3mf";
  return {
    app: "AI Robot Builder → Bambu Handy / Bambu Studio",
    created_for: "hobby robot 3D print",
    transfer: {
      recommended: input.printer?.preferred_transfer || "ANYDESK",
      anydesk_id: input.printer?.anydesk_id || "",
      ultraviewer_id: input.printer?.ultraviewer_id || "",
      printer_pc_folder: input.printer?.printer_pc_path || "C:\\Users\\Public\\RobotPrints",
      steps_hinglish: [
        "1) Is app se print file download / copy करो (STL/3MF).",
        "2) Laptop pe AnyDesk या UltraViewer खोलो — printer वाले PC से connect.",
        "3) File को printer PC के RobotPrints folder में copy करो.",
        "4) Phone pe Bambu Handy (active) खोलो — printer online होना चाहिए.",
        "5) Bambu Studio/Handy में file खोलो → slice (अगर STL है) → Print / Send.",
        "6) Yahan app में status: SENT → PRINTING → DONE mark करो.",
      ],
    },
    bambu_handy: {
      active: Boolean(input.printer?.bambu_handy_active),
      printer_name: input.printer?.name || "My Bambu Printer",
      model: input.printer?.model || "",
      lan_ip: input.printer?.lan_ip || "",
      note:
        "Bambu Handy cloud/LAN se printer control karta hai. LAN-only mode me Handy limited ho sakta hai — tab Bambu Studio + same WiFi use karo.",
    },
    print_job: {
      id: input.job.id,
      title: input.job.title,
      part_name: input.part?.part_name || input.job.title,
      file_name: fileName,
      material: input.job.material,
      color: input.job.color,
      quantity: input.job.quantity,
      project_id: input.job.project_id,
    },
    mqtt_lan_hint: input.printer?.lan_ip
      ? {
          host: input.printer.lan_ip,
          port: 8883,
          username: "bblp",
          password: "(printer access code)",
          topic: input.printer.serial
            ? `device/${input.printer.serial}/request`
            : "device/<SERIAL>/request",
          note: "Advanced: same WiFi + Developer Mode. Beginners should use AnyDesk → Bambu Handy/Studio.",
        }
      : null,
  };
}
