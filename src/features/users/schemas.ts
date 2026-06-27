import { z } from "zod";

export const userSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome pode ter no máximo 100 caracteres"),

    email: z
      .email("E-mail inválido"),

    password: z
      .string()
      .min(1, "Senha é obrigatória")
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(40, "Senha pode ter no máximo 40 caracteres"),

    confirmPassword: z
      .string()
      .min(1, "Confirmação de senha é obrigatória"),

    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "Você deve aceitar os termos de uso e política de privacidade"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });