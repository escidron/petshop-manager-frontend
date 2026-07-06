import { z } from "zod";
import { PET_SIZES } from "./constants";
import type { PetSize } from "./types";
const petSizeValues = PET_SIZES.map(s => s.value) as [
  PetSize,
  ...PetSize[]
];
export const petSchema = z
  .object({
    /* =========================
     * Obrigatórios
     * ========================= */
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(50, "Nome pode ter no máximo 50 caracteres"),
    client_id: z.number().min(1, "Cliente é obrigatório"),
    species: z
      .string()
      .min(1, "Espécie é obrigatória")
      .max(30, "Espécie pode ter no máximo 30 caracteres"),

    is_active: z.boolean(),
    is_deceased: z.boolean().optional(),

    /* =========================
     * Básicos
     * ========================= */
    breed: z.string().max(50, "Raça pode ter no máximo 50 caracteres").optional(),

    gender: z
      .enum(["male", "female", "other", "unknown"])
      .optional(),

    is_neutered: z
      .boolean()
      .nullable()
      .optional(),

    /* =========================
     * Porte
     * ========================= */
    size: z
      .enum(petSizeValues)
      .optional(),

    /* =========================
     * Pelagem
     * ========================= */
    coat_type: z
      .string()
      .max(30, "Tipo de pelagem muito longo")
      .optional(),

    coat_color: z
      .string()
      .max(50, "Cor da pelagem muito longa")
      .optional(),

    /* =========================
     * Idade
     * ========================= */
    age: z
      .number()
      .int("Idade deve ser um número inteiro")
      .positive("Idade deve ser maior que zero")
      .optional(),

    age_unit: z
      .enum(["days", "weeks", "months", "years"])
      .optional(),

    birth_date: z
      .string()
      .transform(v => v.replace(/\D/g, ""))
      .transform(v => (v === "" ? undefined : v))
      .refine(v => !v || v.length === 8, "Data inválida")
      .optional(),
    notes: z
      .string()
      .max(1000, "Observações muito longas")
      .optional(),
  })
  
