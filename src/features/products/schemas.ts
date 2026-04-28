import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price_cents: z.coerce.number().min(1, "O preço de venda é obrigatório"),
  cost_cents: z.coerce.number().min(0, "O custo deve ser maior ou igual a zero").optional(),
  quantity: z.coerce.number().int().min(0, "A quantidade deve ser maior ou igual a zero").default(0),
  min_stock: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(1, "O estoque mínimo deve ser maior que zero").optional()
  ).refine((val) => val !== undefined, "O estoque mínimo é obrigatório"),
  
  barcode: z.string().optional(),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  cfop: z.string().optional(),
  csosn: z.string().optional(),
  cst_pis: z.string().optional(),
  cst_cofins: z.string().optional(),
  supplier_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;
