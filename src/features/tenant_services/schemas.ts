import { z } from "zod";
import { COAT_TYPES, PET_SIZES, PET_SPECIES } from "../pets/constants";
import type { CoatType, PetSize, PetSpecies } from "../pets/types";

const petSpeciesValues = PET_SPECIES.map((s) => s.value) as [
  PetSpecies,
  ...PetSpecies[]
];
const petSizeValues = PET_SIZES.map((s) => s.value) as [
  PetSize,
  ...PetSize[]
];
const coatTypeValues = COAT_TYPES.map((c) => c.value) as [
  CoatType,
  ...CoatType[]
];

export const serviceSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter no mínimo 2 caracteres")
      .max(80, "Nome pode ter no máximo 80 caracteres"),
    is_active: z.boolean(),
    price_cents: z
      .number()
      .int("Preço deve ser inteiro")
      .min(0, "Preço não pode ser negativo")
      .optional()
      .refine((val) => val !== undefined, {
        message: "Preço é obrigatório",
      }),

    description: z.string().max(255, "Descrição pode ter no máximo 255 caracteres").nullable().optional(),
    species: z.array(z.enum(petSpeciesValues)).nullable().optional(),
    sizes: z.array(z.enum(petSizeValues)).nullable().optional(),
    coat_types: z.array(z.enum(coatTypeValues)).nullable().optional(),
    duration_minutes: z
      .number()
      .int("Duração deve ser um número inteiro")
      .positive("Duração deve ser maior que zero")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    /* Regra opcional: se preencher duration, precisa ser >0 */
    if (data.duration_minutes !== undefined && data.duration_minutes !== null && data.duration_minutes <= 0) {
      ctx.addIssue({
        path: ["duration_minutes"],
        message: "A duração deve ser maior que zero",
        code: z.ZodIssueCode.custom,
      });
    }
  });
