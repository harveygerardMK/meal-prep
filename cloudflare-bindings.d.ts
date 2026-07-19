/**
 * Minimal Cloudflare binding stubs for Next.js typechecking.
 * Full Workers runtime types conflict with the DOM lib used by Next.js,
 * so we keep Env-only wrangler output and declare only what meal-prep uses.
 */

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface ImagesBinding {
  // Unused in app code; present for wrangler binding typing.
  info(stream: ReadableStream | string): Promise<unknown>;
}
