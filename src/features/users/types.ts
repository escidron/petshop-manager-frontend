import type z from "zod";
import type { userSchema } from "./schemas";

export type User = {
  id: number; // id gerado pelo backend
  name: string;
  email: string;
  is_active: boolean;
  phone?: string; // opcional se não preenchido
  role: string;
  created_at: string; // ou Date, dependendo do retorno
};

export type UserFormData = z.infer<typeof userSchema>;