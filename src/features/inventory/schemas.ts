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

const stockQuantityChangeSchema = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "string") {
    const normalized = val.trim().replace(",", ".");
    const num = Number(normalized);
    return isNaN(num) ? val : num;
  }
  return val;
}, z.number({ message: "A quantidade deve ser um número válido" }).gt(0, "A quantidade deve ser maior que zero"));

export const InventoryAdjustmentSchema = z.object({
  product_id: z.number(),
  log_type: z.enum(["in", "out", "adjustment"]),
  quantity_changed: stockQuantityChangeSchema,
  description: z.string().optional(),
});

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
