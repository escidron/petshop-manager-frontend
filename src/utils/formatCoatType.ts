import { COAT_TYPES } from "../features/pets/constants";
import type { CoatType } from "../features/pets/types";

export function getCoatTypeLabel(value?: CoatType | null): string {
  if (!value) return "";

  const found = COAT_TYPES.find((item) => item.value === value);
  return found?.label ?? "";
}