import type { PetGender } from "../features/pets/types";

export function formatePetGender(gender: PetGender): string {
  const map: Record<PetGender, string> = {
    male: "Macho",
    female: "Fêmea",
    other: "Outro",
  };

  return map[gender];
}