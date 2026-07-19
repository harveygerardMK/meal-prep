import { NextRequest, NextResponse } from "next/server";
import {
  archiveCatalogRecipe,
  getCatalogRecipe,
  isRecipeReferencedInHistory,
  saveCatalogRecipe,
} from "@/lib/dataStore";
import { parseCatalogRecipeInput } from "@/lib/recipes/recipeValidation";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid|unknown recipe/i.test(error.message)
      ? 400
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const recipe = await getCatalogRecipe(id);
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getCatalogRecipe(id);
    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    const body = await req.json();
    const recipe = parseCatalogRecipeInput({ ...body, id });
    const saved = await saveCatalogRecipe(recipe);
    return NextResponse.json({ recipe: saved });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getCatalogRecipe(id);
    if (!existing) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    // Never hard-delete — archive so history IDs remain resolvable for past weeks.
    const referenced = await isRecipeReferencedInHistory(id);
    const recipe = await archiveCatalogRecipe(id);
    return NextResponse.json({ recipe, archived: true, referencedInHistory: referenced });
  } catch (error) {
    return errorResponse(error);
  }
}
