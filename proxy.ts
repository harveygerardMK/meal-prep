import { NextRequest } from "next/server";
import { authGate } from "@/lib/auth/authGate";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(request: NextRequest) {
  return authGate(request);
}
