import { isoToBrDate } from "../../utils/formatDates";
import type { Pet, PetFormData } from "./types";

export function petToFormData(
  pet?: Pet
): PetFormData | undefined {
  if (!pet) return undefined;
  console.log("pet", pet);
  return {
    // Obrigatórios
    name: pet.name,
    client_id: pet.client_id,
    species: pet.species,
    is_active: pet.is_active ?? true,

    // Básicos
    breed: pet.breed ?? undefined,
    gender: pet.gender ?? undefined,

    // Porte e pelagem
    size: pet.size ?? undefined,
    coat_type: pet.coat_type ?? undefined,
    coat_color: pet.coat_color ?? undefined,

    // Idade
    age: pet.age ?? undefined,
    age_unit: pet.age_unit ?? undefined,
    birth_date: pet.birth_date ? isoToBrDate(pet.birth_date) : undefined,

    // Observações
    notes: pet.notes ?? undefined,
  };
}
