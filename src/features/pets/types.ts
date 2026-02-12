import type z from "zod";
import type { petSchema } from "./schemas";

export type PetGender = "male" | "female" | "other";
export type PetSize = "PP" | "P" | "M" | "G" | "GG" ;
export type PetAgeUnit = "days" | "weeks" | "months" | "years";

export type Pet = {
  id: number;
  tenant_id: number;
  client_id: number;

  // Dados básicos
  name: string;
  species: string;
  breed?: string | null;
  gender?: PetGender | null;
  is_active: boolean;

  // Porte e pelagem
  size?: PetSize | null;
  coat_type?: string | null;
  coat_color?: string | null;

  // Idade
  age?: number | null;
  age_unit?: PetAgeUnit;
  birth_date?: string | null;

  // Observações
  notes?: string | null;

  // Info derivada
  owner_name?: string | null;
};


export type PetFormData = z.infer<typeof petSchema>;
