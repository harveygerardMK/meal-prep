import { afterEach, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("session tokens", () => {
  const originalSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalSecret;
    }
  });

  it("round-trips a household session", async () => {
    process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long";
    const token = await createSessionToken({ householdId: "family" });
    const session = await verifySessionToken(token);
    expect(session).toEqual({ householdId: "family" });
  });

  it("rejects tampered tokens", async () => {
    process.env.AUTH_SECRET = "test-secret-at-least-32-characters-long";
    const token = await createSessionToken({ householdId: "family" });
    await expect(verifySessionToken(token + "x")).resolves.toBeNull();
  });
});
