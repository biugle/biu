export interface CatalogSectionProps {
  pro: boolean;
}

export interface CatalogDirectionProps extends CatalogSectionProps {
  showcaseDirection: "ltr" | "rtl";
  setShowcaseDirection: (direction: "ltr" | "rtl") => void;
}
