import type { CoatType } from "../features/pets/types";
import { getCoatTypeLabel } from "./formatCoatType";

export interface ServiceLabelProps {
  name: string;
  size?: string | null;
  sizes?: string[] | null;
  coat_type?: string | null;
  coat_types?: string[] | null;
  species?: string | string[] | null;
}

export const formatServiceLabel = (service: ServiceLabelProps) => {
  const parts = [service.name];

  const sizeText = service.sizes && service.sizes.length > 0
    ? service.sizes.join(", ")
    : service.size;

  if (sizeText) parts.push(sizeText);

  let coatLabels: string[] = [];
  if (service.coat_types && service.coat_types.length > 0) {
    coatLabels = service.coat_types
      .map((c) => getCoatTypeLabel(c as CoatType))
      .filter((l) => l && l !== "-");
  } else if (service.coat_type) {
    const l = getCoatTypeLabel(service.coat_type as CoatType);
    if (l && l !== "-") coatLabels = [l];
  }

  if (coatLabels.length > 0) {
    parts.push(`Pelagem ${coatLabels.join(", ")}`);
  }

  return parts.join(" - ");
};

export const formatPrice = (priceCents: number) =>
  (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
