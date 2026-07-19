import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  isAuthEnabled,
  sessionCookieOptions,
  verifyHouseholdPassword,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json(
        { error: "Auth is not configured. Set HOUSEHOLD_PASSWORD to enable login." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!verifyHouseholdPassword(password)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = await createSessionToken({ householdId: "household" });
    const response = NextResponse.json({ ok: true });
    const cookie = sessionCookieOptions(token);
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
