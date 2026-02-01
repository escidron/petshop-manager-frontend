import { AGE_UNIT_LABELS } from "../features/pets/constants";
import type { AgeUnit } from "../pages/PetsPage";

export const getAgeUnitLabel = (
  age: number,
  unit: AgeUnit
): string => {
  const labels = AGE_UNIT_LABELS[unit];
  return age === 1 ? labels.singular : labels.plural;
};