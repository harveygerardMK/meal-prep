import type { GrocerySection } from "@/lib/groceryList";

export function GroceryListView({ sections }: { sections: GrocerySection[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {sections.map((section) => (
        <div key={section.section} className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {section.section}
          </h3>
          <ul className="space-y-3 text-sm">
            {section.items.map((item) => (
              <li key={item.name}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="font-medium capitalize text-foreground">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-meta">
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
