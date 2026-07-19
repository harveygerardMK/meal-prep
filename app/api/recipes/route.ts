import { NextRequest, NextResponse } from "next/server";
import { listCatalogRecipes, saveCatalogRecipe } from "@/lib/dataStore";
import { parseCatalogRecipeInput } from "@/lib/recipes/recipeValidation";

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid/i.test(error.message) ? 400 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const recipes = await listCatalogRecipes();
    return NextResponse.json({ recipes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const recipe = parseCatalogRecipeInput(
      { ...body, id: body?.id || undefined },
      { requireId: false }
    );
    const existing = (await listCatalogRecipes()).find((item) => item.id === recipe.id);
    if (existing) {
      recipe.id = `${recipe.id}-${Date.now().toString(36)}`;
    }
    const saved = await saveCatalogRecipe(recipe);
    return NextResponse.json({ recipe: saved }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
