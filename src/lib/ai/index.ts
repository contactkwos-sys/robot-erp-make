import { MockAIProvider } from "@/lib/ai/providers/mock";
import type { AIProvider } from "@/lib/ai/providers/types";
import {
  ROBOT_ANALYSIS_PROMPT,
  PRODUCT_OCR_PROMPT,
  COMPARISON_PROMPT,
  ASSEMBLY_PROMPT,
  WIRING_PROMPT,
  ENGINEERING_CHECK_PROMPT,
} from "@/lib/ai/prompts";

/**
 * Provider adapters call external Vision APIs when keys exist.
 * Without keys, all methods fall back to the mock provider so the app stays usable.
 */
async function callOpenAI(system: string, user: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return JSON.parse(json.choices?.[0]?.message?.content || "{}");
}

async function callClaude(system: string, user: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${res.status}`);
  const json = await res.json();
  const text = json.content?.find((c: { type: string }) => c.type === "text")?.text || "{}";
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] || "{}");
}

async function callGemini(system: string, user: string) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
}

class OpenAIProvider extends MockAIProvider {
  name = "openai";
  async analyzeRobotImage(input: Parameters<AIProvider["analyzeRobotImage"]>[0]) {
    try {
      const raw = await callOpenAI(ROBOT_ANALYSIS_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeRobotImage(input);
      return { ...raw, provider: this.name };
    } catch {
      return super.analyzeRobotImage(input);
    }
  }
  async analyzeProductScreenshot(input: Parameters<AIProvider["analyzeProductScreenshot"]>[0]) {
    try {
      const raw = await callOpenAI(PRODUCT_OCR_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeProductScreenshot(input);
      return { data: raw, warnings: [], provider: this.name };
    } catch {
      return super.analyzeProductScreenshot(input);
    }
  }
}

class ClaudeProvider extends MockAIProvider {
  name = "claude";
  async analyzeRobotImage(input: Parameters<AIProvider["analyzeRobotImage"]>[0]) {
    try {
      const raw = await callClaude(ROBOT_ANALYSIS_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeRobotImage(input);
      return { ...raw, provider: this.name };
    } catch {
      return super.analyzeRobotImage(input);
    }
  }
  async analyzeProductScreenshot(input: Parameters<AIProvider["analyzeProductScreenshot"]>[0]) {
    try {
      const raw = await callClaude(PRODUCT_OCR_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeProductScreenshot(input);
      return { data: raw, warnings: [], provider: this.name };
    } catch {
      return super.analyzeProductScreenshot(input);
    }
  }
}

class GeminiProvider extends MockAIProvider {
  name = "gemini";
  async analyzeRobotImage(input: Parameters<AIProvider["analyzeRobotImage"]>[0]) {
    try {
      const raw = await callGemini(ROBOT_ANALYSIS_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeRobotImage(input);
      return { ...raw, provider: this.name };
    } catch {
      return super.analyzeRobotImage(input);
    }
  }
  async analyzeProductScreenshot(input: Parameters<AIProvider["analyzeProductScreenshot"]>[0]) {
    try {
      const raw = await callGemini(PRODUCT_OCR_PROMPT, JSON.stringify(input));
      if (!raw) return super.analyzeProductScreenshot(input);
      return { data: raw, warnings: [], provider: this.name };
    } catch {
      return super.analyzeProductScreenshot(input);
    }
  }
}

export function getAIProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (preferred === "openai" && process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (preferred === "claude" && process.env.ANTHROPIC_API_KEY) return new ClaudeProvider();
  if (preferred === "gemini" && process.env.GOOGLE_AI_API_KEY) return new GeminiProvider();
  if (process.env.ANTHROPIC_API_KEY) return new ClaudeProvider();
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (process.env.GOOGLE_AI_API_KEY) return new GeminiProvider();
  return new MockAIProvider();
}

export {
  ROBOT_ANALYSIS_PROMPT,
  PRODUCT_OCR_PROMPT,
  COMPARISON_PROMPT,
  ASSEMBLY_PROMPT,
  WIRING_PROMPT,
  ENGINEERING_CHECK_PROMPT,
};
