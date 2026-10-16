import type z from "zod";
import type { serviceSchema } from "./schemas";
import type { CoatType, PetSize, PetSpecies } from "../pets/types";

export type Service = {
  id: number;
  tenant_id: number;

  name: string;
  description?: string | null;
  is_active: boolean;
  species?: PetSpecies[] | null;
  sizes?: PetSize[] | null;
  coat_types?: CoatType[] | null;
  // Legacy backward-compat fields
  size?: string | null;
  coat_type?: string | null;
  price_cents: number;
  duration_minutes?: number | null;
  created_at?: string | null;
};

export type ServiceFormData = z.infer<typeof serviceSchema>;
