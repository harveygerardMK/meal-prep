import { NextRequest, NextResponse } from "next/server";
import { approveImport, updateImportDraft } from "@/lib/imports/importService";
import { getImport } from "@/lib/repositories/importRepository";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /not found|invalid/i.test(error.message)
      ? 400
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const item = await getImport(id);
    if (!item) return NextResponse.json({ error: "Import not found" }, { status: 404 });
    return NextResponse.json({ import: item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    if (body?.action === "approve") {
      const item = await approveImport(id);
      return NextResponse.json({ import: item });
    }
    if (!body?.draft) throw new Error("Invalid draft");
    const item = await updateImportDraft(id, body.draft);
    return NextResponse.json({ import: item });
  } catch (error) {
    return errorResponse(error);
  }
}
