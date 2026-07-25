import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { parseJsonFromModel } from "./parseJson";

export const WORKERS_AI_TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct" as const;

export class AiUnavailableError extends Error {
  constructor(message = "Workers AI is not available") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

type AiBinding = {
  run: (
    model: string,
    inputs: {
      messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      max_tokens?: number;
    }
  ) => Promise<unknown>;
};

async function getAiBinding(): Promise<AiBinding | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const ai = (env as { AI?: AiBinding } | undefined)?.AI;
    return ai ?? null;
  } catch {
    return null;
  }
}

function responseText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    if (typeof record.response === "string") return record.response;
    if (typeof record.text === "string") return record.text;
    if (Array.isArray(record.result)) {
      const parts = record.result
        .map((part) =>
          part && typeof part === "object" && "response" in part
            ? String((part as { response: unknown }).response)
            : ""
        )
        .filter(Boolean);
      if (parts.length) return parts.join("");
    }
  }
  throw new Error("AI returned an empty response");
}

/**
 * Run a chat prompt on Workers AI and parse the reply as JSON.
 * Throws AiUnavailableError when the binding is missing (local/tests without AI).
 */
export async function runJsonPrompt<T>(
  prompt: string,
  options?: { system?: string; maxTokens?: number }
): Promise<T> {
  const ai = await getAiBinding();
  if (!ai) {
    throw new AiUnavailableError();
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (options?.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  const result = await ai.run(WORKERS_AI_TEXT_MODEL, {
    messages,
    max_tokens: options?.maxTokens ?? 1200,
  });

  return parseJsonFromModel<T>(responseText(result));
}
