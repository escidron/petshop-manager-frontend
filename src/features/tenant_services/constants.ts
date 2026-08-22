import type { ServiceFormData } from "./types";

export const DEFAULT_SERVICE_FORM: ServiceFormData = {
  name: "",
  is_active: true,
  price_cents: undefined,
  description: "",
  species: undefined,
  size: undefined,
  coat_type: undefined,
  duration_minutes: undefined,
};
