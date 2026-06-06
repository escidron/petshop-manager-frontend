// src/modules/clients/types.ts

import type z from "zod";
import type { clientSchema } from "./schemas";

export type Client = {
  id: number;
  tenant_id: number;

  // Dados básicos
  name: string;
  email?: string | null;
  is_active: boolean;
  document_type?: DocumentType | null;
  document?: string | null;
  birth_date?: string | null;

  // Telefones
  phone: string
  phone_secondary_name?: string | null;
  phone_secondary?: string | null;

  phone_tertiary_name?: string | null;
  phone_tertiary?: string | null;

  // Endereço
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;

  // Redes sociais
  instagram?: string | null;
  facebook?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientFormData = z.infer<typeof clientSchema>;

export type DocumentType = "CPF" | "CNPJ";