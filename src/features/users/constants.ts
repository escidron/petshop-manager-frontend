import type { UserFormData } from "./types";

export const DEFAULT_USER_FORM: Partial<UserFormData> = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};
