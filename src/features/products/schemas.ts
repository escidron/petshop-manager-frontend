import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "O nome é obrigatório")
    .max(80, "O nome deve ter no máximo 80 caracteres"),
  sku: z.string().max(50, "O SKU deve ter no máximo 50 caracteres").optional(),
  description: z.string().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
  category: z.string().max(100).optional(),
  price_cents: z.coerce.number().min(1, "O preço de venda é obrigatório"),
  cost_cents: z.coerce.number().min(0, "O custo deve ser maior ou igual a zero").optional(),
  quantity: z.coerce.number().int().min(0, "A quantidade deve ser maior ou igual a zero").default(0),
  min_stock: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(0, "O estoque mínimo deve ser maior ou igual a zero").optional().default(0)
  ),
  
  barcode: z.string().max(100, "O código de barras deve ter no máximo 100 caracteres").optional(),
  ncm: z.string().max(20, "O NCM deve ter no máximo 20 caracteres").optional(),
  cest: z.string().max(20, "O CEST deve ter no máximo 20 caracteres").optional(),
  cfop: z.string().max(20, "O CFOP deve ter no máximo 20 caracteres").optional(),
  csosn: z.string().max(20, "O CSOSN deve ter no máximo 20 caracteres").optional(),
  cst_pis: z.string().max(20, "O CST PIS deve ter no máximo 20 caracteres").optional(),
  cst_cofins: z.string().max(20, "O CST COFINS deve ter no máximo 20 caracteres").optional(),
  supplier_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
  unit: z.string().max(10).optional().default("UN"),
});

export type ProductFormData = z.infer<typeof productSchema>;
