// defaults.ts
import type { AppointmentFormData } from "./types";

export const DEFAULT_APPOINTMENT_FORM: AppointmentFormData = {
  client_id: 0,          // 0 = ainda não selecionado
  scheduled_at: "",      // será preenchido no submit

  notes: undefined,

  items: [
    {
      pet_id: 0,         // ainda não selecionado
      service_ids: [],   // precisa ter pelo menos 1 para passar no zod
    },
  ],
};
