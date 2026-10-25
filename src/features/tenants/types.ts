import { z } from "zod";
import type { tenantSchema } from "./schemas";
import type { OnboardingStep } from "../onboarding/types";

export type Subscription = {
  id: number;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string;
  canceled_at?: string | null;
  payment_method?: string | null;
  pagarme_subscription_id?: string | null;
  eligible_for_refund?: boolean;
  whatsapp_package_id?: string | null;
  whatsapp_next_package_id?: string | null;
  whatsapp_package_status?: "inactive" | "pending_payment" | "active" | "canceled";
  whatsapp_messages_limit?: number;
  whatsapp_messages_used?: number;
  whatsapp_period_end?: string | null;
  pagarme_whatsapp_subscription_id?: string | null;
  billing_day?: number;
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

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  "0": { is_open: false, open: "08:00", close: "12:00" }, // Dom
  "1": { is_open: true,  open: "08:00", close: "18:00" }, // Seg
  "2": { is_open: true,  open: "08:00", close: "18:00" }, // Ter
  "3": { is_open: true,  open: "08:00", close: "18:00" }, // Qua
  "4": { is_open: true,  open: "08:00", close: "18:00" }, // Qui
  "5": { is_open: true,  open: "08:00", close: "18:00" }, // Sex
  "6": { is_open: true,  open: "08:00", close: "18:00" }, // Sáb
};

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
  max_simultaneous_appointments?: number | null;
  allow_discount?: boolean;
  max_discount_percentage?: number | null;
  feature_flags?: Record<string, any> | null;
  preferences?: Record<string, any> | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

export type TenantOption = {
  id: number;
  name: string;
};

export type TenantFormData = z.infer<typeof tenantSchema>;