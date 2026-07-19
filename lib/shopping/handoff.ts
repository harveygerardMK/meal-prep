import type { GrocerySection } from "@/lib/groceryList";

export type ShoppingHandoffItem = {
  name: string;
  details: string;
  section: string;
  instacartSearchUrl: string;
};

export type ShoppingHandoff = {
  mode: "export" | "instacart_landing";
  items: ShoppingHandoffItem[];
  exportText: string;
  note: string;
};

function instacartSearchUrl(query: string): string {
  return `https://www.instacart.com/store/search/${encodeURIComponent(query)}`;
}

export function buildShoppingHandoff(
  sections: GrocerySection[],
  options: { instacartEnabled: boolean; instacartApiKeyPresent?: boolean }
): ShoppingHandoff {
  const items: ShoppingHandoffItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      items.push({
        name: item.name,
        details: item.entries.map((entry) => entry.text).join("; "),
        section: section.section,
        instacartSearchUrl: instacartSearchUrl(item.name),
      });
    }
  }

  const exportText = sections
    .map((section) => {
      const lines = section.items.map(
        (item) => `- ${item.name}: ${item.entries.map((e) => e.text).join("; ")}`
      );
      return `${section.section}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const canUseLanding =
    options.instacartEnabled && Boolean(options.instacartApiKeyPresent);

  return {
    mode: canUseLanding ? "instacart_landing" : "export",
    items,
    exportText,
    note: canUseLanding
      ? "Instacart landing-page handoff is enabled. Matching still happens on Instacart."
      : "Export/search-link mode: Instacart Developer Platform access is not configured or is closed to new apps.",
  };
}

export function getInstacartConfig() {
  return {
    instacartEnabled: process.env.INSTACART_ENABLED === "true",
    instacartApiKeyPresent: Boolean(process.env.INSTACART_API_KEY),
  };
}
