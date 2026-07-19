import { SignJWT, jwtVerify } from "jose";

export type HouseholdSession = {
  householdId: string;
};

const COOKIE_NAME = "meal_prep_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.HOUSEHOLD_PASSWORD);
}

export function verifyHouseholdPassword(password: string): boolean {
  const expected = process.env.HOUSEHOLD_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export async function createSessionToken(
  session: HouseholdSession
): Promise<string> {
  return new SignJWT({ householdId: session.householdId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined
): Promise<HouseholdSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.householdId !== "string" || !payload.householdId) {
      return null;
    }
    return { householdId: payload.householdId };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
