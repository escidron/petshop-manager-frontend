import { z } from "zod";

export const SaleItemSchema = z.object({
  item_type: z.enum(["product", "service", "package"]),
  item_id: z.number(),
  name: z.string(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
  pet_id: z.number().optional(),
  employee_id: z.number().nullable().optional(),
  client_package_id_to_pay: z.number().nullable().optional(),
  unit: z.string().optional(),
});

export const SaleCreateSchema = z.object({
  client_id: z.number().nullable().optional(),
  pet_id: z.number().nullable().optional(),
  appointment_id: z.number().nullable().optional(),
  total_amount: z.number().min(0),
  payment_method: z.enum(["pix", "credit_card", "debit_card", "money", "other", "package"]),
  status: z.enum(["completed", "canceled"]).default("completed"),
  items: z.array(SaleItemSchema).min(1, "Adicione pelo menos um item"),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;
export type SaleCreate = z.infer<typeof SaleCreateSchema>;

export interface SaleResponse extends SaleCreate {
  id: number;
  tenant_id: number;
  created_at: string;
  items: (SaleItem & { id: number; sale_id: number })[];
  client?: { id: number; name: string };
  pet?: { id: number; name: string };
  appointment_id?: number | null;
  appointment?: {
    id: number;
    client: { id: number; name: string };
    items: { services: { id: number; price_cents: number }[] }[];
  } | null;
}
