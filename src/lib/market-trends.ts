/** Latest market-trend robot plans (hobby → professional sell potential). */

export type TrendLocaleCopy = {
  title: string;
  tagline: string;
  how_made: string;
  market_why: string;
  sell_use: string;
  your_idea_prompt: string;
};

export type MarketTrendPlan = {
  id: string;
  year_label: string;
  demand: "HOT" | "RISING" | "STABLE";
  sell_score: number; // 1-10 professional sell / utilize potential
  difficulty: "BEGINNER" | "INTERMEDIATE" | "PRO";
  keywords: string[];
  starter_fields: {
    name: string;
    purpose: string;
    description: string;
    target_load: string;
    dimensions: string;
    movement: string;
    environment: string;
    power_preference: string;
  };
  en: TrendLocaleCopy;
  hinglish: TrendLocaleCopy;
};

export const MARKET_TREND_PLANS: MarketTrendPlan[] = [
  {
    id: "trend-home-patrol-ai",
    year_label: "2025–2026",
    demand: "HOT",
    sell_score: 9,
    difficulty: "INTERMEDIATE",
    keywords: ["home security", "AI camera", "patrol", "WiFi", "alerts"],
    starter_fields: {
      name: "AI Home Patrol Bot",
      purpose:
        "Patrol indoor rooms, detect motion/people with camera AI, send phone alerts.",
      description:
        "Compact wheeled robot with ESP32-CAM or Pi camera, ultrasonic bump safety, night LED. Latest home-security trend: people want affordable patrol helpers, not full humanoid robots.",
      target_load: "Camera + small speaker only",
      dimensions: "250 x 200 x 180 mm",
      movement: "4-wheel or 2-wheel differential, slow indoor patrol",
      environment: "Indoor flat floor, home/shop",
      power_preference: "12V or 7.4V rechargeable pack",
    },
    en: {
      title: "AI Home Patrol Robot",
      tagline: "Market is buying small camera patrol bots for homes & shops.",
      how_made:
        "Build a rolling base + camera + WiFi alerts. Start with obstacle avoid, then add camera streaming and simple person detection.",
      market_why:
        "Security cameras are fixed; a moving bot covers more rooms. Hot for small shops, PG, and homes.",
      sell_use:
        "Sell as DIY kit, offer install+app setup, or rent monthly patrol bots to shops. Upsell night vision and siren.",
      your_idea_prompt:
        "Add your twist: pet-safe mode, shop theft angle, Hindi voice alerts, solar dock…",
    },
    hinglish: {
      title: "AI Home Patrol Robot",
      tagline: "Market छोटा camera patrol bot खरीद रहा है — घर / दुकान के लिए।",
      how_made:
        "Wheels + camera + WiFi alert। पहले obstacle avoid, फिर camera stream और simple person detect।",
      market_why:
        "Fixed CCTV सब जगह नहीं देखता। Moving bot ज्यादा cover करता है — HOT trend।",
      sell_use:
        "DIY kit बेचो, install+app service दो, या दुकानों को monthly rent पर दो। Night vision / siren upsell।",
      your_idea_prompt:
        "अपना idea डालो: pet-safe mode, दुकान theft alert, Hindi voice, solar dock…",
    },
  },
  {
    id: "trend-agri-scout",
    year_label: "2025–2026",
    demand: "HOT",
    sell_score: 9,
    difficulty: "INTERMEDIATE",
    keywords: ["agriculture", "crop scout", "soil", "India farms", "NDVI-lite"],
    starter_fields: {
      name: "Farm Scout Rover",
      purpose:
        "Roll between crop rows, take photos, log soil moisture / temperature for farmers.",
      description:
        "Rugged small rover with moisture probe option, GPS/phone logging, and photo capture. India agri-tech trend: low-cost scouts beat expensive drones for many small farms.",
      target_load: "Sensor pack ~1 kg",
      dimensions: "400 x 300 x 250 mm",
      movement: "4-wheel high-torque, slow outdoor",
      environment: "Dry soil paths, farm rows (not deep mud v1)",
      power_preference: "12V high-capacity battery",
    },
    en: {
      title: "Agri / Farm Scout Robot",
      tagline: "Low-cost farm scouts are a strong sell trend in India.",
      how_made:
        "Strong motors + bigger wheels + moisture/temp sensor + phone app logging. Keep v1 simple: photo + moisture points on a map.",
      market_why:
        "Farmers want crop health data without hiring drones every week.",
      sell_use:
        "Sell kits to agri colleges, offer per-acre survey service, partner with fertilizer shops.",
      your_idea_prompt:
        "Your idea: specific crop (tomato/cotton), Hindi farmer app, solar top-up…",
    },
    hinglish: {
      title: "Agri / Farm Scout Robot",
      tagline: "India में सस्ता farm scout = मजबूत sell trend।",
      how_made:
        "मज़बूत motors + बड़े wheels + moisture/temp + phone पर log। v1: photo + नमी points।",
      market_why:
        "किसान हर हफ्ते drone नहीं लगवा सकते — सस्ता rover demand में है।",
      sell_use:
        "Agri college kits, per-acre survey service, fertilizer shop partnership।",
      your_idea_prompt:
        "Idea: कौन सी फसल, Hindi farmer app, solar charging…",
    },
  },
  {
    id: "trend-warehouse-line",
    year_label: "2025–2026",
    demand: "RISING",
    sell_score: 8,
    difficulty: "INTERMEDIATE",
    keywords: ["warehouse", "line follow", "QR", "inventory", "AMR-lite"],
    starter_fields: {
      name: "Mini Line-Follow Warehouse Bot",
      purpose:
        "Follow floor line / QR markers to move small bins between stations.",
      description:
        "AMR-lite trend for small warehouses and maker shops. Line sensors or camera QR; carry light trays. Easier and more sellable than full industrial AMR.",
      target_load: "2–5 kg tray",
      dimensions: "350 x 300 x 200 mm",
      movement: "Differential drive + line follow",
      environment: "Indoor warehouse / workshop with tape line",
      power_preference: "12V pack with easy swap",
    },
    en: {
      title: "Warehouse Line / QR Helper",
      tagline: "Small businesses want cheap ‘AMR-lite’, not ₹lakhs robots.",
      how_made:
        "Chassis + line sensors (or camera QR) + tray deck + simple station stops. Add weight limit and bump sensor.",
      market_why:
        "E-commerce micro-warehouses and print shops need short material moves.",
      sell_use:
        "Sell to local warehouses, coaching-kit for institutes, maintenance contracts.",
      your_idea_prompt:
        "Idea: medicine shop runner, library book bot, restaurant tray…",
    },
    hinglish: {
      title: "Warehouse Line / QR Helper",
      tagline: "छोटे गोदाम सस्ता AMR-lite चाहते हैं — महंगा industrial नहीं।",
      how_made:
        "Chassis + line/QR + tray + station stop। Weight limit और bump sensor ज़रूरी।",
      market_why:
        "छोटे e-com / print shop में short material move की ज़रूरत बहुत है।",
      sell_use:
        "Local warehouse को बेचो, institute kit, yearly maintenance contract।",
      your_idea_prompt:
        "Idea: दवाई shop runner, library bot, restaurant tray…",
    },
  },
  {
    id: "trend-edu-stem-kit",
    year_label: "2025–2026",
    demand: "HOT",
    sell_score: 10,
    difficulty: "BEGINNER",
    keywords: ["STEM", "education", "kit", "school", "YouTube"],
    starter_fields: {
      name: "STEM Learning Robot Kit",
      purpose:
        "Teach coding + electronics with a fun obstacle/line robot students can build.",
      description:
        "Education kits are the easiest professional sell path: schools, workshops, YouTube courses. Same Friendly Obstacle Bot core, packaged with lesson cards and Hinglish manuals.",
      target_load: "None — learning platform",
      dimensions: "200 x 150 x 100 mm",
      movement: "2-wheel obstacle / line follow modes",
      environment: "Classroom table / floor",
      power_preference: "USB powerbank or 6xAA",
    },
    en: {
      title: "STEM Education Robot Kit",
      tagline: "Highest beginner sell potential — schools & workshops.",
      how_made:
        "Use the easy obstacle bot, add line-follow mode, printed lesson cards, and Bambu-printed parts. Film a Hinglish build series.",
      market_why:
        "NEP / STEM demand is rising; parents and schools buy kits that teach.",
      sell_use:
        "Weekend workshops, school bulk kits, online course + kit bundle, 3D-print parts shop.",
      your_idea_prompt:
        "Idea: age group, city workshops, franchise teaching model…",
    },
    hinglish: {
      title: "STEM Education Robot Kit",
      tagline: "Beginner के लिए सबसे ज़्यादा sell — school / workshop।",
      how_made:
        "Easy obstacle bot + line mode + lesson cards + 3D parts। Hinglish YouTube series बनाओ।",
      market_why:
        "STEM / NEP से school-parents kit खरीद रहे हैं जो सिखाए।",
      sell_use:
        "Weekend workshop, school bulk, online course+kit, 3D parts shop।",
      your_idea_prompt:
        "Idea: किस उम्र के लिए, किस शहर में workshop, teaching franchise…",
    },
  },
  {
    id: "trend-delivery-lastmile",
    year_label: "2025–2026",
    demand: "RISING",
    sell_score: 7,
    difficulty: "PRO",
    keywords: ["delivery", "campus", "last mile", "locker", "hotel"],
    starter_fields: {
      name: "Campus Last-Mile Delivery Bot",
      purpose:
        "Carry small packages inside campus / hotel corridors to a door or locker.",
      description:
        "Last-mile indoor delivery is trending in campuses and hotels. Start in controlled corridors before roads. Focus on tray + map waypoints + obstacle safety.",
      target_load: "3–8 kg package",
      dimensions: "450 x 350 x 400 mm",
      movement: "Differential or 4-wheel, waypoint navigation",
      environment: "Indoor corridors, elevators later (v2)",
      power_preference: "Hot-swap 12V packs",
    },
    en: {
      title: "Indoor Last-Mile Delivery",
      tagline: "Campus/hotel delivery bots — rising professional niche.",
      how_made:
        "Bigger chassis, covered tray, waypoint nav (QR on walls first), strong obstacle stop. Do NOT start on public roads.",
      market_why:
        "Hotels and campuses want contactless small deliveries.",
      sell_use:
        "Pilot with one hotel/campus, then service contract. Sell software+bot bundle.",
      your_idea_prompt:
        "Idea: medicine trolley, hostel laundry, office tea runner…",
    },
    hinglish: {
      title: "Indoor Last-Mile Delivery",
      tagline: "Campus / hotel delivery — rising professional niche।",
      how_made:
        "बड़ा chassis, ढका tray, wall QR waypoints, strong stop। Public road से शुरू मत करो।",
      market_why:
        "Hotel/campus contactless small delivery चाहते हैं।",
      sell_use:
        "एक hotel/campus pilot → फिर service contract। Bot+software bundle।",
      your_idea_prompt:
        "Idea: दवाई trolley, hostel laundry, office tea runner…",
    },
  },
  {
    id: "trend-custom-blank",
    year_label: "Your idea",
    demand: "STABLE",
    sell_score: 5,
    difficulty: "BEGINNER",
    keywords: ["custom", "own idea", "blank plan"],
    starter_fields: {
      name: "My Custom Robot",
      purpose: "Describe what your robot should do.",
      description:
        "Blank plan — write your own idea. You can still copy sell tips from other trends.",
      target_load: "To be decided",
      dimensions: "To be decided",
      movement: "To be decided",
      environment: "To be decided",
      power_preference: "To be decided",
    },
    en: {
      title: "My Own Idea (blank plan)",
      tagline: "No trend fit? Write your plan and build from it.",
      how_made:
        "Fill purpose, parts, movement, and sell angle yourself. Use Easy path + Print center + Plan chart.",
      market_why:
        "Unique ideas can still sell if they solve a clear local problem.",
      sell_use:
        "Validate with 5 possible buyers before buying expensive parts.",
      your_idea_prompt: "Write your full idea here in your words…",
    },
    hinglish: {
      title: "मेरा अपना Idea (खाली प्लान)",
      tagline: "Trend पसंद नहीं? अपना plan लिखो और उसी से बनाओ।",
      how_made:
        "Purpose, parts, movement, sell angle खुद भरो। Easy + Print + Plan chart use करो।",
      market_why:
        "Local problem solve करो तो unique idea भी बिक सकती है।",
      sell_use:
        "महंगे parts से पहले 5 possible buyers से पूछ लो।",
      your_idea_prompt: "यहाँ अपना पूरा idea अपने शब्दों में लिखो…",
    },
  },
];

export function getTrendById(id: string) {
  return MARKET_TREND_PLANS.find((t) => t.id === id) || null;
}
