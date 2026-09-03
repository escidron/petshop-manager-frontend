import { z } from "zod";

export const clientSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(80, "Nome pode ter no máximo 80 caracteres"),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10 || v.length === 11, "Telefone inválido"),
  email: z
    .string()
    .max(80, "E-mail pode ter no máximo 80 caracteres")
    .transform((v) => v.trim())
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "E-mail inválido")
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  is_active: z.boolean(),
  document_type: z.enum(["CPF", "CNPJ"]).optional(),
  document: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .transform(v => (v === "" ? undefined : v))
    .refine(v => !v || v.length === 11 || v.length === 14, "Documento inválido")
    .optional(),
  birth_date: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .transform(v => (v === "" ? undefined : v))
    .refine(v => !v || v.length === 8, "Data inválida")
    .optional(),
  cep: z
    .string()
    .transform(v => v.replace(/\D/g, ""))
    .transform(v => (v === "" ? undefined : v))
    .refine(v => !v || v.length === 8, "CEP inválido")
    .optional(),
  street: z.string().max(100, "Logradouro pode ter no máximo 100 caracteres").optional(),
  number: z.string().max(10, "Número pode ter no máximo 10 caracteres").optional(),
  complement: z.string().max(50, "Complemento pode ter no máximo 50 caracteres").optional(),
  neighborhood: z.string().max(50, "Bairro pode ter no máximo 50 caracteres").optional(),
  city: z.string().max(50, "Cidade pode ter no máximo 50 caracteres").optional(),
  state: z.string().max(2, "UF pode ter no máximo 2 caracteres").optional(),
  instagram: z.string().max(50, "Instagram pode ter no máximo 50 caracteres").optional(),
  facebook: z.string().max(50, "Facebook pode ter no máximo 50 caracteres").optional(),
  phone_secondary_name: z.string().max(30, "Nome do contato secundário pode ter no máximo 30 caracteres").optional(),
  phone_secondary: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform(v => (v === "" ? undefined : v))
    .refine((v) => !v || v.length === 10 || v.length === 11, "Telefone inválido")
    .optional(),
  phone_tertiary_name: z.string().max(30, "Nome do contato terciário pode ter no máximo 30 caracteres").optional(),
  phone_tertiary: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .transform(v => (v === "" ? undefined : v))
    .refine((v) => !v || v.length === 10 || v.length === 11, "Telefone inválido")
    .optional(),
});
