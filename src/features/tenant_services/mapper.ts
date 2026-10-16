import type { CoatType, PetSize, PetSpecies } from "../pets/types";
import type { Service, ServiceFormData } from "./types";

function normalizeSpeciesList(raw: unknown): PetSpecies[] {
  if (!raw) return [];
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [raw];

  const result: PetSpecies[] = [];
  for (const item of items) {
    if (!item) continue;
    const str = String(item).trim().toLowerCase();
    if (str === "canino" || str === "cachorro" || str === "cão" || str === "cao") {
      if (!result.includes("Canino")) result.push("Canino");
    } else if (str === "felino" || str === "gato") {
      if (!result.includes("Felino")) result.push("Felino");
    } else if (str.startsWith("exotic")) {
      if (!result.includes("Exotico")) result.push("Exotico");
    }
  }
  return result;
}

function normalizeSizesList(raw: unknown): PetSize[] {
  if (!raw) return [];
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [raw];

  const validSizes: PetSize[] = ["PP", "P", "M", "G", "GG"];
  const result: PetSize[] = [];
  for (const item of items) {
    if (!item) continue;
    const upper = String(item).trim().toUpperCase() as PetSize;
    if (validSizes.includes(upper) && !result.includes(upper)) {
      result.push(upper);
    }
  }
  return result;
}

function normalizeCoatTypesList(raw: unknown): CoatType[] {
  if (!raw) return [];
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [raw];

  const validCoats: CoatType[] = ["short", "medium", "long", "double", "hairless"];
  const result: CoatType[] = [];
  for (const item of items) {
    if (!item) continue;
    const lower = String(item).trim().toLowerCase() as CoatType;
    if (validCoats.includes(lower) && !result.includes(lower)) {
      result.push(lower);
    }
  }
  return result;
}

export function serviceToFormData(
  service?: Service,
): ServiceFormData | undefined {
  if (!service) return undefined;

  const speciesList = normalizeSpeciesList(service.species);
  const sizesList = normalizeSizesList(
    service.sizes && service.sizes.length > 0 ? service.sizes : service.size,
  );
  const coatTypesList = normalizeCoatTypesList(
    service.coat_types && service.coat_types.length > 0 ? service.coat_types : service.coat_type,
  );

  return {
    name: service.name,
    description: service.description ?? undefined,
    is_active: service.is_active ?? true,

    species: speciesList,
    sizes: sizesList,
    coat_types: coatTypesList,
    price_cents: service.price_cents,
    duration_minutes: service.duration_minutes ?? undefined,
  };
}
