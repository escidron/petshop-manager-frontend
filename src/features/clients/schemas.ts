import { z } from "zod";

export const clientSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome pode ter no máximo 100 caracteres"),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),
  email: z.email("E-mail inválido").optional(),
  is_active: z.boolean(),
  document_type: z.enum(["CPF", "CNPJ"]).optional(),
  document: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .refine(v => v.length === 11 || v.length === 14, "Documento inválido")
    .optional(),
  birth_date: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .refine(v => v.length === 8, "Data inválida")
    .optional(),
  cep: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .refine(v => v.length === 8, "CEP inválido")
    .optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  x: z.string().optional(),
  phone_secondary_name: z.string().optional(),
  phone_secondary: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido")
    .optional(),
  phone_tertiary_name: z.string().optional(),
  phone_tertiary: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido")
    .optional(),
});
