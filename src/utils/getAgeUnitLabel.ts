import { AGE_UNIT_LABELS } from "../features/pets/constants";
import type { PetAgeUnit } from "../features/pets/types";

export const getAgeUnitLabel = (
  age: number,
  unit: PetAgeUnit
): string => {
  const labels = AGE_UNIT_LABELS[unit];
  return age === 1 ? labels.singular : labels.plural;
};