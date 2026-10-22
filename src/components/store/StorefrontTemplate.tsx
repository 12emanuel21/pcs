import Storefront from "@/components/store/Storefront";
import type { StoreHero, StoreTemplate } from "@/lib/templates";
import type { Product } from "@/types";

interface StorefrontTemplateProps {
  template: StoreTemplate;
  hero: StoreHero | null;
  initialProducts: Product[];
}

// Enrutador de plantillas de la vitrina: elige el catálogo según
// stores.template. "gamer" y "grid" todavía no tienen componente propio y
// usan el minimalista mientras tanto.
export default function StorefrontTemplate({
  template,
  hero,
  initialProducts,
}: StorefrontTemplateProps) {
  switch (template) {
    case "gamer":
    case "grid":
    case "minimal":
      return <Storefront hero={hero} initialProducts={initialProducts} />;
  }
}
