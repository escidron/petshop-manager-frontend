import * as z from "zod";
import type { WaitingListPeriod } from "./types";

export const waitingListItemSchema = z.object({
  pet_id: z.number().min(1, "Selecione o pet"),
  service_ids: z.array(z.number()),
});

export const waitingListSchema = z
  .object({
    client_id: z.number().min(1, "Selecione o cliente"),
    items: z.array(waitingListItemSchema).min(1, "Adicione ao menos um pet"),
    preferred_date: z.string().nullable().optional(),
    preferred_period: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const validItems = (data.items || []).filter(
      (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
    );

    if (validItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione ao menos um serviço para adicionar à fila de espera",
        path: ["items", 0, "service_ids"],
      });
    }
  });

export type WaitingListFormData = {
  client_id: number;
  items: {
    pet_id: number;
    service_ids: number[];
  }[];
  preferred_date?: string | null;
  preferred_period: WaitingListPeriod;
  notes?: string;
};
