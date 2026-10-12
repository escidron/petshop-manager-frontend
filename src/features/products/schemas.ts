import { z } from "zod";

const stockQuantitySchema = (label: string) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === "string") {
      const normalized = val.trim().replace(",", ".");
      const num = Number(normalized);
      return isNaN(num) ? val : num;
    }
    return val;
  }, z.number({ message: `${label} deve ser um número válido` }).min(0, `${label} não pode ser negativo`));

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
  quantity: stockQuantitySchema("A quantidade"),
  min_stock: stockQuantitySchema("O estoque mínimo"),
  
  barcode: z.string().max(100, "O código de barras deve ter no máximo 100 caracteres").optional().or(z.literal("")),
  ncm: z.string().max(8, "O NCM deve ter no máximo 8 caracteres").optional().or(z.literal("")),
  cest: z.string().max(20, "O CEST deve ter no máximo 20 caracteres").optional(),
  cfop: z.string().max(20, "O CFOP deve ter no máximo 20 caracteres").optional(),
  csosn: z.string().max(20, "O CSOSN deve ter no máximo 20 caracteres").optional(),
  cst_pis: z.string().max(20, "O CST PIS deve ter no máximo 20 caracteres").optional(),
  cst_cofins: z.string().max(20, "O CST COFINS deve ter no máximo 20 caracteres").optional(),
  supplier_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
  is_internal_use: z.boolean().default(false),
  unit: z.string().max(10).optional().default("UN"),
});

export type ProductFormData = z.infer<typeof productSchema>;
