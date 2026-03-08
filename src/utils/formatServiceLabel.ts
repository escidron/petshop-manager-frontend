import type { CoatType } from "../features/pets/types";
import type { Service } from "../features/tenant_services/types";
import { getCoatTypeLabel } from "./formatCoatType";

export const formatServiceLabel = (service:Service) => {
  const parts = [service.name];

  if (service.size) parts.push(service.size);
  if (service.coat_type) parts.push(`Pelagem ${getCoatTypeLabel(service.coat_type as CoatType)}`);

  return parts.join(" - ");
};

export const formatPrice = (priceCents: number) =>
  (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
