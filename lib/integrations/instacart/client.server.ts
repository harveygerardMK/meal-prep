import "server-only";

/**
 * Placeholder for Instacart Developer Platform products_link handoff.
 * The public meal-planning program is currently closed to new applicants and
 * is link-oriented (hosted Instacart matching page), not a full cart API.
 */
export async function createInstacartProductsLink(input: {
  title: string;
  lineItems: { name: string; quantity?: number }[];
}): Promise<{ url: string } | null> {
  const apiKey = process.env.INSTACART_API_KEY;
  if (process.env.INSTACART_ENABLED !== "true" || !apiKey) {
    return null;
  }

  // Reserved for when partner access is granted. Do not call undocumented APIs.
  void input;
  void apiKey;
  return null;
}
