import { z } from "zod";
import type { tenantSchema } from "./schemas";
import type { OnboardingStep } from "../onboarding/types";

export type Tenant = {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  onboarding_step: OnboardingStep;
};

export type TenantFormData = z.infer<typeof tenantSchema>;