import { z } from "zod";

export const tenantSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do estabelecimento é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome pode ter no máximo 100 caracteres"),

  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),

  document: z.string().nullable().optional(),
  max_simultaneous_appointments: z.number().nullable().optional(),
  allow_discount: z.boolean().optional(),
  max_discount_percentage: z.number().nullable().optional(),
  cep: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
});