import { z } from "zod";

export const InventoryLogSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  log_type: z.enum(["in", "out", "sale", "adjustment"]),
  quantity_changed: z.number(),
  description: z.string().nullable(),
  created_at: z.string(),
  product_name: z.string().optional(),
});

export type InventoryLog = z.infer<typeof InventoryLogSchema>;

export const InventoryAdjustmentSchema = z.object({
  product_id: z.number(),
  log_type: z.enum(["in", "out", "adjustment"]),
  quantity_changed: z.number().min(1, "A quantidade deve ser maior que zero"),
  description: z.string().optional(),
});

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
