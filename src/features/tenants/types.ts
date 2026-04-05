import { z } from "zod";
import type { tenantSchema } from "./schemas";
import type { OnboardingStep } from "../onboarding/types";

export type Subscription = {
  id: number;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string;
  payment_method?: string | null;
  plan: {
    id: number;
    code: string;
    name: string;
    trial_days: number;
  };
};

export type Tenant = {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  document?: string | null;
  created_at: string;
  onboarding_step: OnboardingStep;
  type: {
    id: number;
    code: string;
    name: string;
  };
  subscription?: Subscription;
};

export type TenantFormData = z.infer<typeof tenantSchema>;