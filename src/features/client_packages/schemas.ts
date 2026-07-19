import { z } from "zod";

export const clientPackageSellSchema = z.object({
  pet_ids: z.array(z.number()).min(1, "Selecione pelo menos um pet"),
  package_id: z.number().min(1, "Selecione um pacote"),
});

export type ClientPackageSellFormData = z.infer<typeof clientPackageSellSchema>;
