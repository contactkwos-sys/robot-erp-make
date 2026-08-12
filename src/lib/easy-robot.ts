/** Easiest hobby robot path for non-professionals. */

export type EasyLocale = "en" | "hinglish";

export const EASY_ROBOT = {
  id: "easy-obstacle-bot",
  name_en: "Friendly Obstacle Bot",
  name_hi: "Friendly Obstacle Bot / आसान रोबोट",
  why_en:
    "This is the easiest first robot: it drives, sees a wall with a sensor, and turns. No pro skills needed.",
  why_hi:
    "ये सबसे आसान पहला रोबोट है: चलता है, sensor से दीवार देखता है, मुड़ जाता है। Professional होने की ज़रूरत नहीं।",
  time_en: "1–2 weekends",
  time_hi: "1–2 weekends",
  cost_en: "Approx ₹2,500–4,500 (India hobby kit range)",
  cost_hi: "लगभग ₹2,500–4,500 (Amazon hobby kit)",
  skill_en: "Beginner / hobby",
  skill_hi: "Beginner / शौक से",
} as const;

export const EASY_PARTS = [
  {
    name_en: "ESP32 or Arduino Uno board",
    name_hi: "ESP32 या Arduino Uno",
    qty: 1,
    why_en: "Brain — runs your program",
    why_hi: "दिमाग — program यहीं चलता है",
    category: "ELECTRONICS",
  },
  {
    name_en: "L298N motor driver",
    name_hi: "L298N motor driver",
    qty: 1,
    why_en: "Lets the board control strong motors safely",
    why_hi: "Board से motors को safely control करता है",
    category: "ELECTRONICS",
  },
  {
    name_en: "Geared DC motors + wheels",
    name_hi: "Geared DC motors + wheels",
    qty: 2,
    why_en: "Move the robot left/right",
    why_hi: "Robot को आगे-पीछे / मुड़ने देता है",
    category: "MECHANICAL",
  },
  {
    name_en: "HC-SR04 ultrasonic sensor",
    name_hi: "HC-SR04 ultrasonic sensor",
    qty: 1,
    why_en: "Sees obstacles in front",
    why_hi: "सामने दीवार / object देखता है",
    category: "SENSORS",
  },
  {
    name_en: "7.4V / 12V battery pack + switch",
    name_hi: "Battery pack + on/off switch",
    qty: 1,
    why_en: "Power for motors and board",
    why_hi: "Power देता है",
    category: "POWER",
  },
  {
    name_en: "Chassis (buy kit or cardboard / 3D print)",
    name_hi: "Chassis (kit / गत्ता / 3D print)",
    qty: 1,
    why_en: "Body that holds everything",
    why_hi: "सभी parts यहीं बैठते हैं",
    category: "MECHANICAL",
  },
  {
    name_en: "Jumper wires + mini breadboard",
    name_hi: "Jumper wires + breadboard",
    qty: 1,
    why_en: "Connect parts without soldering first",
    why_hi: "पहले बिना soldering connect करो",
    category: "WIRING",
  },
] as const;

export const EASY_STEPS = [
  {
    id: 1,
    en: {
      title: "Pick this one robot only",
      body: "Do not start with a humanoid or arm. Start with a small driving robot that avoids walls.",
    },
    hinglish: {
      title: "सिर्फ यही एक robot चुनो",
      body: "Humanoid या arm से मत शुरू करो। छोटा सा चलने वाला obstacle-avoid robot सबसे आसान है।",
    },
  },
  {
    id: 2,
    en: {
      title: "Buy / scan only these parts",
      body: "Use Amazon screenshots in Product Scanner. Add what you already own to Inventory.",
    },
    hinglish: {
      title: "ये parts खरीद / स्कैन करो",
      body: "Amazon screenshot Product Scanner में डालो। जो पहले से है वो Inventory में add करो।",
    },
  },
  {
    id: 3,
    en: {
      title: "Build the body",
      body: "Screw motors to chassis, mount board and sensor on the front. Cardboard is OK for v1.",
    },
    hinglish: {
      title: "Body जोड़ो",
      body: "Motors chassis पर लगाओ, board और sensor सामने। पहली बार गत्ता भी चल जाएगा।",
    },
  },
  {
    id: 4,
    en: {
      title: "Wire simply",
      body: "Battery → switch → motor driver → motors. Sensor → board. Double-check GND and 5V.",
    },
    hinglish: {
      title: "Simple wiring",
      body: "Battery → switch → motor driver → motors. Sensor → board. GND और 5V दोबारा check करो।",
    },
  },
  {
    id: 5,
    en: {
      title: "Ask AI for the code",
      body: "Paste the ready prompt into Gemini, ChatGPT, or Claude. Upload that sketch to Arduino IDE / PlatformIO.",
    },
    hinglish: {
      title: "Code AI से लो",
      body: "नीचे वाला prompt Gemini / ChatGPT / Claude में paste करो। Code Arduino IDE में upload करो।",
    },
  },
  {
    id: 6,
    en: {
      title: "Test on the floor",
      body: "Put it down, power on, watch it reverse when it sees a wall. Then paint / decorate.",
    },
    hinglish: {
      title: "Floor पर test",
      body: "Robot नीचे रखो, power on — दीवार देखकर मुड़ना चाहिए। फिर रंग / decorate करो।",
    },
  },
] as const;

export const AI_HELPERS = [
  {
    id: "gemini",
    name: "Gemini",
    role_en: "Best for idea image + shopping list",
    role_hi: "Idea image + shopping list के लिए अच्छा",
    color: "#8ab4f8",
    prompt_en: `I am a complete beginner making my first hobby robot (not a professional).
I want a simple 2-wheel obstacle-avoiding robot using ESP32 or Arduino, L298N, HC-SR04, battery, and a basic chassis.
1) Draw/describe a clear picture of the robot layout (top view).
2) Give a short Amazon India shopping list with approximate prices.
3) Explain each part in very simple English + Hindi mix.
Do not invent exact specs you are unsure about.`,
    prompt_hi: `Main bilkul beginner hoon, personally robot banana seekh raha/rahi hoon (professional nahi).
Mujhe simple 2-wheel obstacle-avoiding robot chahiye: ESP32/Arduino, L298N, HC-SR04, battery, simple chassis.
1) Robot ka top-view layout clearly batao / describe karo.
2) Amazon India shopping list + approx price do.
3) Har part simple Hindi+English mein samjhao.
Jo exact spec confirm na ho, mat gadhna.`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    role_en: "Best for beginner Arduino / ESP32 code",
    role_hi: "Beginner code के लिए अच्छा",
    color: "#74aa9c",
    prompt_en: `Write the easiest Arduino IDE sketch for a beginner obstacle-avoiding robot:
- Ultrasonic HC-SR04 on the front
- Two DC motors through L298N
- If distance < 20 cm: stop, reverse a little, turn, then go forward
Add lots of comments in simple English. Also give a short Hindi summary of what the code does.
Keep wiring pin numbers clearly listed at the top.`,
    prompt_hi: `Beginner ke liye sabse easy Arduino IDE code likho (obstacle-avoid robot):
- HC-SR04 front pe
- 2 DC motors L298N se
- Distance < 20 cm ho to: stop, thoda reverse, turn, phir forward
Code ke upar pin list clearly do. Comments simple English mein.
End mein 5 lines Hindi mein batao code kya karta hai.`,
  },
  {
    id: "claude",
    name: "Claude",
    role_en: "Best for safe wiring + step checklist",
    role_hi: "Safe wiring + checklist के लिए अच्छा",
    color: "#d4a27f",
    prompt_en: `I am a hobby beginner. Create a safe, step-by-step wiring and assembly checklist for an ESP32/Arduino + L298N + 2 motors + HC-SR04 robot.
Include: what to connect first, polarity warnings, what NOT to do, and a final test order.
Use simple language. Add Hindi labels for each step title.`,
    prompt_hi: `Main hobby beginner hoon. ESP32/Arduino + L298N + 2 motors + HC-SR04 ke liye SAFE wiring + assembly checklist banao.
Pehle kya jodna hai, polarity warnings, kya bilkul nahi karna, aur final test order.
Har step title Hindi+English mein do. Simple language.`,
  },
] as const;

export const STARTER_PROJECT = {
  name: "Friendly Obstacle Bot",
  purpose:
    "Beginner hobby robot that drives forward and turns when it sees an obstacle. Easy first build — not professional grade.",
  description:
    "2-wheel differential drive robot with ultrasonic sensing. Chassis can be a purchased kit, cardboard, or simple 3D print. Aimed at personal learning with Gemini / ChatGPT / Claude help.",
  target_load: "No payload — just own weight",
  dimensions: "About 200 x 150 x 100 mm",
  movement: "2-wheel differential drive, reverse and turn",
  environment: "Indoor flat floor",
  power_preference: "7.4V Li-ion pack or 6xAA with switch",
  image_kind: "concept" as const,
};
