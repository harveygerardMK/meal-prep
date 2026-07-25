#!/usr/bin/env node
/**
 * Cloudflare/OpenNext build wrapper.
 *
 * Next.js 16 uses Node-runtime `proxy.ts`. @opennextjs/cloudflare currently
 * rejects Node middleware, so for the Cloudflare build only we:
 *   1. Write an edge `middleware.ts` that reuses the shared auth gate
 *   2. Rename `proxy.ts` out of the way
 *   3. Run the OpenNext command (build / preview / deploy)
 *   4. Restore `proxy.ts` and remove the temporary middleware
 *
 * Workers AI always needs a remote Cloudflare session. In unauthenticated CI
 * (no CLOUDFLARE_API_TOKEN), we temporarily strip the `ai` binding so `next
 * build` can finish; deploy/local with Wrangler login keeps the binding.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const proxyPath = path.join(root, "proxy.ts");
const proxyBackupPath = path.join(root, "proxy.ts.cf-bak");
const middlewarePath = path.join(root, "middleware.ts");
const wranglerPath = path.join(root, "wrangler.jsonc");

const command = process.argv[2];
if (!command || !["build", "preview", "deploy", "upload"].includes(command)) {
  console.error("Usage: node scripts/cloudflare-build.mjs <build|preview|deploy|upload>");
  process.exit(1);
}

const middlewareSource = `import { NextRequest } from "next/server";
import { authGate } from "@/lib/auth/authGate";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|apple-touch-icon|oven-mitt-icon).*)",
  ],
};

export async function middleware(request: NextRequest) {
  return authGate(request);
}
`;

let swapped = false;
let wranglerOriginal = null;

function hasCloudflareApiToken() {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY);
}

function shouldStripAiBinding() {
  // Deploy/upload must keep the AI binding in the shipped Worker config.
  // GitHub Actions verify builds have no Wrangler OAuth — strip only then.
  if (command !== "build") return false;
  if (hasCloudflareApiToken()) return false;
  return process.env.CI === "true";
}

function stripAiBindingIfNeeded() {
  if (!shouldStripAiBinding()) return;
  if (!existsSync(wranglerPath)) return;
  const original = readFileSync(wranglerPath, "utf8");
  if (!/"ai"\s*:/.test(original)) return;
  const stripped = original.replace(/,?\s*"ai"\s*:\s*\{[^{}]*\}\s*/m, "");
  if (stripped === original) return;
  wranglerOriginal = original;
  writeFileSync(wranglerPath, stripped, "utf8");
  console.warn(
    "CI build: temporarily removed Workers AI binding (no CLOUDFLARE_API_TOKEN)."
  );
}

function cleanup() {
  if (wranglerOriginal !== null) {
    try {
      writeFileSync(wranglerPath, wranglerOriginal, "utf8");
    } catch {
      // ignore
    }
    wranglerOriginal = null;
  }
  if (!swapped) return;
  try {
    if (existsSync(middlewarePath)) unlinkSync(middlewarePath);
  } catch {
    // ignore
  }
  try {
    if (existsSync(proxyBackupPath)) renameSync(proxyBackupPath, proxyPath);
  } catch {
    // ignore
  }
  swapped = false;
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});
process.on("SIGHUP", () => {
  cleanup();
  process.exit(129);
});
process.on("uncaughtException", (error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});

// `preview`, `deploy`, and `upload` do not build on their own — always build
// first so we ship the latest code, then run the requested command.
const steps = command === "build" ? ["build"] : ["build", command];

try {
  if (!existsSync(proxyPath)) {
    throw new Error("proxy.ts not found — refusing to run Cloudflare build swap");
  }
  stripAiBindingIfNeeded();
  writeFileSync(middlewarePath, middlewareSource, "utf8");
  renameSync(proxyPath, proxyBackupPath);
  swapped = true;

  for (const step of steps) {
    // Keep dashboard secrets (AUTH_SECRET, etc.) across CI / Workers Builds deploys.
    const args =
      step === "deploy" || step === "upload"
        ? ["opennextjs-cloudflare", step, "--", "--keep-vars"]
        : ["opennextjs-cloudflare", step];
    const result = spawnSync("npx", args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      cleanup();
      process.exit(result.status ?? 1);
    }
  }

  cleanup();
  process.exit(0);
} catch (error) {
  cleanup();
  console.error(error);
  process.exit(1);
}
