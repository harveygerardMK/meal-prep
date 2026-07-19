import { HeaderNavLink } from "./AppHeader";

export function SiteNav({
  active,
}: {
  active?: "plan" | "recipes" | "import" | "shopping" | "settings";
}) {
  return (
    <>
      <HeaderNavLink href="/" active={active === "plan"}>
        This week
      </HeaderNavLink>
      <HeaderNavLink href="/recipes" active={active === "recipes"}>
        Recipes
      </HeaderNavLink>
      <HeaderNavLink href="/import" active={active === "import"}>
        Import
      </HeaderNavLink>
      <HeaderNavLink href="/shopping" active={active === "shopping"}>
        Shop
      </HeaderNavLink>
      <HeaderNavLink href="/settings" active={active === "settings"}>
        Settings
      </HeaderNavLink>
    </>
  );
}
