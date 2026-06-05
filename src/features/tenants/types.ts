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

export type DaySchedule = {
  is_open: boolean;
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
};

export type WorkingHours = Record<string, DaySchedule>; // "0"=Dom … "6"=Sáb (dayjs convention)

export type Tenant = {
  id: number;
  name: string;
  email?: string | null;
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
  working_hours?: WorkingHours | null;
};

export type TenantOption = {
  id: number;
  name: string;
};

export type TenantFormData = z.infer<typeof tenantSchema>;