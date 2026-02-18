import type { Service } from "../features/tenant_services/types";

export const formatServiceLabel = (service:Service) => {
  const parts = [service.name];

  if (service.size) parts.push(service.size);
  if (service.coat_type) parts.push(`Pelagem ${service.coat_type}`);

  return parts.join(" - ");
};

export const formatPrice = (priceCents: number) =>
  (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
