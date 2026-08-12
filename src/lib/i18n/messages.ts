export type Locale = "en" | "hinglish";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.easy": "Easiest Robot",
  "nav.plan": "Robot Plan",
  "nav.robots": "My Robots",
  "nav.create": "Create Robot",
  "nav.analysis": "Robot Analysis",
  "nav.bom": "BOM / Components",
  "nav.inventory": "Inventory",
  "nav.purchases": "Purchase Required",
  "nav.scanner": "Product Scanner",
  "nav.comparison": "Product Comparison",
  "nav.assembly": "Assembly Guide",
  "nav.wiring": "Wiring Guide",
  "nav.costing": "Costing",
  "nav.recommendations": "AI Recommendations",
  "nav.documents": "Documents",
  "nav.settings": "Settings",
  "plan.title": "AI Robot Build Plan",
  "plan.subtitle":
    "Chart flow from idea → image → stock → missing parts → 3D print → code → finish.",
  "plan.bucket_ok": "Storage buckets ready",
  "plan.bucket_empty": "Bucket empty / missing — fix uploads",
  "plan.stock_empty": "Stock bucket empty — add items you own",
  "plan.stock_ok": "Stock has items",
  "plan.have": "Items you have",
  "plan.missing": "Items still needed",
  "plan.useful": "Useful for this robot",
  "plan.ensure_buckets": "Ensure Buckets",
  "plan.refresh": "Refresh Plan",
  "lang.en": "English",
  "lang.hinglish": "Hindi + English",
};

const hinglish: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.easy": "Easiest / आसान रोबोट",
  "nav.plan": "Robot Plan / प्लान",
  "nav.robots": "My Robots / मेरे रोबोट",
  "nav.create": "Create Robot / नया रोबोट",
  "nav.analysis": "Analysis / विश्लेषण",
  "nav.bom": "BOM / पार्ट्स लिस्ट",
  "nav.inventory": "Inventory / स्टॉक",
  "nav.purchases": "Purchase / खरीदना है",
  "nav.scanner": "Scanner / Amazon स्कैन",
  "nav.comparison": "Compare / तुलना",
  "nav.assembly": "Assembly / जोड़ना",
  "nav.wiring": "Wiring / वायरिंग",
  "nav.costing": "Costing / खर्च",
  "nav.recommendations": "AI Tips / सुझाव",
  "nav.documents": "Documents / दस्तावेज़",
  "nav.settings": "Settings / सेटिंग्स",
  "plan.title": "AI Robot Build Plan / रोबोट बनाने का प्लान",
  "plan.subtitle":
    "Idea → Image → Stock → Missing → 3D Print → Code → Finish — पूरा flowchart एक जगह।",
  "plan.bucket_ok": "Storage buckets तैयार हैं",
  "plan.bucket_empty": "Bucket खाली / missing है — upload fix करें",
  "plan.stock_empty": "Stock खाली है — जो items आपके पास हैं वो डालें",
  "plan.stock_ok": "Stock में items हैं",
  "plan.have": "आपके पास है",
  "plan.missing": "अभी कम है / खरीदना है",
  "plan.useful": "इस रोबोट के लिए useful",
  "plan.ensure_buckets": "Buckets बनाओ / Fix",
  "plan.refresh": "Plan Refresh",
  "lang.en": "English",
  "lang.hinglish": "Hindi + English",
};

const TABLES: Record<Locale, Dict> = { en, hinglish };

export function t(locale: Locale, key: string): string {
  return TABLES[locale][key] || TABLES.en[key] || key;
}

export const PLAN_STEPS = [
  {
    id: "idea",
    en: { title: "Robot Idea", body: "Name the robot and decide what it should do." },
    hinglish: {
      title: "Idea / आइडिया",
      body: "Robot का नाम और ये क्या करेगा — पहले clear करो।",
    },
  },
  {
    id: "image",
    en: { title: "Robot Image", body: "Upload sketch, photo, or AI concept image." },
    hinglish: {
      title: "Image / इमेज",
      body: "Sketch, photo या AI concept image upload करो।",
    },
  },
  {
    id: "purpose",
    en: { title: "What Will It Do?", body: "Purpose, movement, load, and environment." },
    hinglish: {
      title: "क्या करेगा?",
      body: "Purpose, movement, load और environment लिखो।",
    },
  },
  {
    id: "analysis",
    en: { title: "How It Works", body: "AI breaks down systems, parts, and risks." },
    hinglish: {
      title: "कैसे काम करेगा?",
      body: "AI systems, parts और risks बताएगा।",
    },
  },
  {
    id: "stock",
    en: { title: "Stock You Have", body: "Add purchased parts; mark used items." },
    hinglish: {
      title: "Stock / आपके पास क्या है",
      body: "खरीदे हुए parts डालो; used items mark करो।",
    },
  },
  {
    id: "gap",
    en: { title: "What Is Missing?", body: "Balance: have vs need → buy only the gap." },
    hinglish: {
      title: "क्या कम है?",
      body: "Balance: पास vs ज़रूरत → सिर्फ missing खरीदो।",
    },
  },
  {
    id: "scan",
    en: { title: "Amazon Screenshot", body: "Scan product screenshots into inventory." },
    hinglish: {
      title: "Amazon Screenshot",
      body: "Product screenshot डालो — app recognize करके stock में ले आएगा।",
    },
  },
  {
    id: "print",
    en: { title: "3D Print & Build", body: "Print chassis/brackets and assemble mechanically." },
    hinglish: {
      title: "3D Print + Build",
      body: "Chassis/brackets 3D print करो और mechanical assembly करो।",
    },
  },
  {
    id: "code",
    en: { title: "Code & Wire", body: "Firmware, sensors, motors, and wiring plan." },
    hinglish: {
      title: "Code + Wiring",
      body: "Firmware, sensors, motors और wiring plan follow करो।",
    },
  },
  {
    id: "finish",
    en: { title: "Color & Finish", body: "Paint/finish, test, and mark the robot complete." },
    hinglish: {
      title: "रंग + Finish",
      body: "Color/finish, testing, फिर robot को complete mark करो।",
    },
  },
] as const;
