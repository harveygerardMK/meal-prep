/**
 * Strip optional markdown fences and parse the first JSON value in model output.
 */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  let start = -1;
  if (objectStart >= 0 && arrayStart >= 0) start = Math.min(objectStart, arrayStart);
  else start = Math.max(objectStart, arrayStart);
  if (start < 0) return trimmed;

  const opening = trimmed[start];
  const closing = opening === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(closing);
  if (end > start) return trimmed.slice(start, end + 1);
  return trimmed.slice(start);
}

export function parseJsonFromModel<T>(raw: string): T {
  const text = extractJsonText(raw);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}
