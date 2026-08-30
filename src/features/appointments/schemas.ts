// schemas.ts

import { z } from "zod";

export const appointmentItemSchema = z.object({
  pet_id: z.number().min(1, "Pet é obrigatório"),
  service_ids: z.array(z.number()),
});

export const appointmentSchema = z
  .object({
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

    recurrence: z
      .object({
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        occurrences: z.coerce.number().min(2, "Mínimo 2"),
      })
      .superRefine((data, ctx) => {
        const max =
          data.frequency === "weekly"
            ? 52
            : data.frequency === "biweekly"
            ? 26
            : 12;
        if (data.occurrences > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Máximo de ${max} (1 ano)`,
            path: ["occurrences"],
          });
        }
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const validItems = (data.items || []).filter(
      (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
    );

    if (validItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione ao menos um serviço para criar o agendamento",
        path: ["items", 0, "service_ids"],
      });
    }
  });
