import { z } from "zod";

export const packageItemSchema = z.object({
  type: z.enum(["service", "product"]).default("service"),
  service_id: z.number().nullable().optional(),
  product_id: z.number().nullable().optional(),
  quantity: z.coerce.number().int().min(1, "A quantidade deve ser pelo menos 1"),
}).superRefine((data, ctx) => {
  if (data.type === "service" && !data.service_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione um serviço",
      path: ["service_id"],
    });
  } else if (data.type === "product" && !data.product_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione um produto",
      path: ["product_id"],
    });
  }
});

export const packageSchema = z.object({
  name: z.string().min(1, "O nome do pacote é obrigatório"),
  description: z.string().optional(),
  price_cents: z.coerce.number().min(0, "O preço deve ser maior ou igual a zero"),
  is_active: z.boolean().default(true),
  items: z.array(packageItemSchema).min(1, "O pacote deve ter pelo menos um item"),
});

export type PackageFormData = z.infer<typeof packageSchema>;
