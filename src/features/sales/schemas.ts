import { z } from "zod";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Product } from "../products/types";
import type { Service } from "../tenant_services/types";
import type { Package } from "../packages/types";
import type { Appointment } from "../appointments/types";
import type { ClientPackage } from "../client_packages/types";

export const SaleItemSchema = z.object({
  item_type: z.enum(["product", "service", "package"]),
  item_id: z.number(),
  name: z.string(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
  pet_ids: z.array(z.number()).optional(),
  employee_id: z.number().nullable().optional(),
  client_package_id_to_pay: z.number().nullable().optional(),
  unit: z.string().optional(),
  appointment_id: z.number().nullable().optional(),
});

export const SalePaymentSchema = z.object({
  payment_method: z.enum(["pix", "credit_card", "debit_card", "money", "other", "package"]),
  amount: z.number().min(0, "O valor deve ser maior ou igual a zero"),
});

export const SaleCreateSchema = z.object({
  client_id: z.number().nullable().optional(),
  pet_id: z.number().nullable().optional(),
  appointment_id: z.number().nullable().optional(),
  comanda_id: z.number().nullable().optional(),
  total_amount: z.number().min(0),
  discount_amount: z.number().min(0).default(0),
  payment_method: z.enum(["pix", "credit_card", "debit_card", "money", "other", "package", "multiple"]),
  status: z.enum(["completed", "canceled"]).default("completed"),
  items: z.array(SaleItemSchema).min(1, "Adicione pelo menos um item"),
  payments: z.array(SalePaymentSchema).optional(),
  cash_register_id: z.number().nullable().optional(),
  unpaid_remainder: z.number().min(0).optional(),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;
export type SalePayment = z.infer<typeof SalePaymentSchema>;
export type SaleCreate = z.infer<typeof SaleCreateSchema>;

export interface SalePaymentResponse extends SalePayment {
  id?: number;
  sale_id?: number;
}

export interface SaleResponse extends SaleCreate {
  id: number;
  tenant_id: number;
  created_at: string;
  items: (SaleItem & { id: number; sale_id: number })[];
  payments?: (SalePayment & { id: number; sale_id: number })[];
  client?: {
    id: number;
    name: string;
    phone?: string | null;
    pets?: Array<{ id: number; name: string }>;
  };
  pet?: { id: number; name: string };
  appointment_id?: number | null;
  comanda_id?: number | null;
  appointment?: {
    id: number;
    client: {
      id: number;
      name: string;
      phone?: string | null;
      pets?: Array<{ id: number; name: string }>;
    };
    items: {
      services: { id: number; price_cents: number }[];
      pet?: { id: number; name: string };
    }[];
  } | null;
}

export interface ComandaItem {
  id?: number;
  comanda_id?: number;
  item_type: "product" | "service" | "package";
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  employee_id?: number | null;
  pet_ids?: number[];
  client_package_id_to_pay?: number | null;
  unit?: string;
  appointment_id?: number | null;
}

export interface Comanda {
  id: number;
  tenant_id: number;
  client_id: number;
  appointment_id?: number | null;
  status: "open" | "completed" | "canceled";
  total_amount: number;
  discount_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items: ComandaItem[];
  client?: { id: number; name: string; pets?: Array<{ id: number; name: string }> };
}

export interface ComandaSavePayload {
  comanda_id?: number | null;
  client_id: number;
  appointment_id?: number | null;
  items: ComandaItem[];
  discount_amount?: number;
  notes?: string | null;
}

import type { CashRegisterResponse, CurrentCashStatusResponse } from "../cash_register/types";

export interface POSStartupResponse {
  products: Product[];
  services: Service[];
  packages: Package[];
  clients: Client[];
  appointments: Appointment[];
  pets: Pet[];
  open_comandas?: Comanda[];
  cash_registers?: CashRegisterResponse[];
  cash_status?: CurrentCashStatusResponse | null;
}

export interface POSClientDetailsResponse {
  client_pets: Pet[];
  client_packages: ClientPackage[];
  client_appointments: Appointment[];
  open_comandas?: Comanda[];
}
