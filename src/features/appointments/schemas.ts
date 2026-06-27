// schemas.ts

import { z } from "zod";

export const appointmentItemSchema = z.object({
  pet_id: z.number().min(1, "Pet é obrigatório"),
  service_ids: z
    .array(z.number())
    .min(1, "Selecione pelo menos um serviço"),
});

export const appointmentSchema = z.object({
  client_id: z.number().min(1, "Cliente é obrigatório"),

  scheduled_at: z
    .string()
    .min(1, "Data e hora são obrigatórias"),

  notes: z
    .string()
    .max(5000, "Observações muito longas (máximo 5000 caracteres)")
    .optional(),

  items: z
    .array(appointmentItemSchema)
    .min(1, "Adicione pelo menos um pet"),
});
