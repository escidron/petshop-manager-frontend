import { z } from "zod";

export const clientPackageSellSchema = z.object({
  pet_id: z.number().min(1, "Selecione um pet"),
  package_id: z.number().min(1, "Selecione um pacote"),
});

export type ClientPackageSellFormData = z.infer<typeof clientPackageSellSchema>;
