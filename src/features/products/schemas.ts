import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0, "O preço deve ser maior ou igual a zero"),
  cost: z.coerce.number().min(0, "O custo deve ser maior ou igual a zero").optional(),
  quantity: z.coerce.number().int().min(0, "A quantidade deve ser maior ou igual a zero").default(0),
  min_stock: z.coerce.number().int().min(0, "O estoque mínimo deve ser maior ou igual a zero").default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;
