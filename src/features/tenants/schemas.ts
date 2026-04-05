import { z } from "zod";

export const tenantSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do estabelecimento é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome pode ter no máximo 100 caracteres"),

  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),
    
  document: z.string().nullable().optional(),
});