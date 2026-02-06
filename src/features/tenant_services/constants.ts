import type { ServiceFormData } from "../tenant_services/ServiceForm";

export const DEFAULT_SERVICE_FORM: ServiceFormData = {
  name: "",
  description: "",
  duration_minutes:0 ,
  price_cents:0,
  type: "BATH"
};