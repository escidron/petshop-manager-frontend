import type { Service, ServiceFormData } from "./types";


export function serviceToFormData(
  service?: Service,
): ServiceFormData | undefined {
  if (!service) return undefined;

  return {
    // Service
    name: service.name,
    description: service.description ?? undefined,
    is_active: service.is_active ?? true,

    // ServicePricing
    species: service.species ?? undefined,
    size: service.size ?? undefined,
    coat_type: service.coat_type ?? undefined,
    price_cents: service.price_cents,
    duration_minutes: service.duration_minutes ?? undefined,
  };
}
