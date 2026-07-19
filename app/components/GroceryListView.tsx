import type { GrocerySection } from "@/lib/groceryList";

export function GroceryListView({ sections }: { sections: GrocerySection[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.section}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="mb-2 font-semibold">{section.section}</h3>
          <ul className="space-y-2 text-sm">
            {section.items.map((item) => (
              <li key={item.name}>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" />
                  <span>
                    <span className="font-medium capitalize">{item.name}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {item.entries.map((e) => e.text).join("; ")}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
