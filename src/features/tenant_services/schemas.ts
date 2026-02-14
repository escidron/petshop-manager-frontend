import { z } from "zod";
import { PET_SIZES, PET_SPECIES } from "../pets/constants";
import type { PetSize, PetSpecies } from "../pets/types";

const petSpeciesValues = PET_SPECIES.map(s => s.value) as [
  PetSpecies,
  ...PetSpecies[]
];
const petSizeValues = PET_SIZES.map(s => s.value) as [
  PetSize,
  ...PetSize[]
];


export const serviceSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(120, "Nome pode ter no máximo 120 caracteres"),
    is_active: z.boolean(),
    price_cents: z
      .number()
      .int("Preço deve ser inteiro")
      .min(0, "Preço não pode ser negativo")
      .optional()
      .refine((val) => val !== undefined, {
        message: "Preço é obrigatório",
      }),

    description: z.string().max(255).optional(),
    species: z.enum(petSpeciesValues).optional(),
    size: z.enum(petSizeValues).optional(),
    coat_type: z.string().max(50).optional(),
    duration_minutes: z
      .number()
      .int("Duração deve ser um número inteiro")
      .positive("Duração deve ser maior que zero")
      .optional(),
  })
  .superRefine((data, ctx) => {
    /* Regra opcional: se preencher duration, precisa ser >0 */
    if (data.duration_minutes !== undefined && data.duration_minutes <= 0) {
      ctx.addIssue({
        path: ["duration_minutes"],
        message: "A duração deve ser maior que zero",
        code: z.ZodIssueCode.custom,
      });
    }
  });

