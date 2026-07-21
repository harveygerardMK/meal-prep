import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * `buildCommand` must call Next directly (not `npm run build`) so Workers Builds
 * can use `npm run build` for the full OpenNext Cloudflare bundle without
 * recursing when OpenNext invokes the Next.js compile step.
 */
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build",
};
