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
  type: {
    id: number;
    code: string;
    name: string;
  };
};

export type TenantFormData = z.infer<typeof tenantSchema>;