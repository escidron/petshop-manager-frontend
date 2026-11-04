import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";

export type DaycareModalityBillingType = "hourly" | "half_day" | "daily";

export type DaycareStayType = "daily" | "half_day" | "hourly" | "multi_day";

export type DaycareStayStatus =
  | "pending"
  | "checked_in"
  | "checked_out"
  | "absent"
  | "canceled";

export type DaycareStayAction =
  | "check_in"
  | "check_out"
  | "mark_absent"
  | "cancel"
  | "reopen";

export type DaycareTaskType = "feeding" | "medication";

export interface DaycareModality {
  id: number;
  name: string;
  billing_type: DaycareModalityBillingType;
  description?: string | null;
  max_hours?: number | null;
  species?: string[] | null;
  sizes?: string[] | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface DaycareModalityCreatePayload {
  name: string;
  billing_type: DaycareModalityBillingType;
  description?: string | null;
  max_hours?: number | null;
  species?: string[] | null;
  sizes?: string[] | null;
  price_cents: number;
  is_active?: boolean;
}

export interface DaycareModalityUpdatePayload {
  name?: string;
  billing_type?: DaycareModalityBillingType;
  description?: string | null;
  max_hours?: number | null;
  species?: string[] | null;
  sizes?: string[] | null;
  price_cents?: number;
  is_active?: boolean;
}

export interface DaycareModalityFormData {
  name: string;
  price_cents: number;
  is_active: boolean;
  species?: string[];
  sizes?: string[];
  billing_type: DaycareModalityBillingType;
  max_hours?: number | null;
  description?: string;
}

export interface DaycareTask {
  id: number;
  stay_id: number;
  task_type: DaycareTaskType;
  scheduled_time: string;
  title: string;
  notes?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

export interface DaycareTaskCreatePayload {
  task_type: DaycareTaskType;
  scheduled_time: string;
  title: string;
  notes?: string | null;
}

export interface DaycareTaskUpdatePayload {
  task_type?: DaycareTaskType;
  scheduled_time?: string;
  title?: string;
  notes?: string | null;
  is_completed?: boolean;
}

export interface DaycareServiceSummary {
  id: number;
  name: string;
  price_cents: number;
  duration_minutes?: number | null;
}

export interface DaycareStay {
  id: number;
  client_id: number;
  pet_id: number;
  modality_id?: number | null;
  service_id?: number | null;
  stay_type: DaycareStayType;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  scheduled_start_at: string;
  scheduled_end_at: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  status: DaycareStayStatus;
  food_info?: string | null;
  belongings?: string | null;
  notes?: string | null;
  client_package_credit_id?: number | null;
  covered_quantity: number;
  is_package_covered: boolean;
  recurrence_id?: string | null;
  recurrence_rule?: Record<string, any> | null;
  report_data?: DaycareReportData | null;
  client: Client;
  pet: Pet;
  modality?: DaycareModality | null;
  service?: DaycareServiceSummary | null;
  tasks: DaycareTask[];
  created_at: string;
}

export type DaycareRecurrenceFrequency =
  | "weekdays"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly";

export interface DaycareRecurrenceInput {
  frequency?: DaycareRecurrenceFrequency | "custom";
  occurrences?: number;
  weekdays?: number[];
  weeks_count?: number;
  is_continuous?: boolean;
}

export interface DaycareStayCreatePayload {
  client_id: number;
  pet_id: number;
  modality_id?: number | null;
  service_id?: number | null;
  stay_type: DaycareStayType;
  quantity: number;
  unit_price_cents?: number;
  scheduled_start_at: string;
  scheduled_end_at: string;
  food_info?: string | null;
  belongings?: string | null;
  notes?: string | null;
  tasks?: DaycareTaskCreatePayload[];
  recurrence?: DaycareRecurrenceInput;
}

export interface DaycareStayUpdatePayload {
  modality_id?: number | null;
  service_id?: number | null;
  stay_type?: DaycareStayType;
  quantity?: number;
  unit_price_cents?: number;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  food_info?: string | null;
  belongings?: string | null;
  notes?: string | null;
  tasks?: DaycareTaskCreatePayload[];
}

export interface PetHealthRecord {
  id: number;
  pet_id: number;
  category: "vaccine" | "antiparasitic" | "dewormer" | "exam";
  name: string;
  applied_at: string;
  expires_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface PetHealthRecordCreatePayload {
  pet_id: number;
  category: "vaccine" | "antiparasitic" | "dewormer" | "exam";
  name: string;
  applied_at: string;
  expires_at?: string | null;
  notes?: string | null;
}

export type DaycareFeedingStatus = "ate_all" | "ate_half" | "ate_little" | "did_not_eat";
export type DaycareMedicationStatus = "took_all" | "with_food" | "refused" | "not_needed";
export type DaycarePeeStatus = "normal" | "little" | "none";
export type DaycarePoopStatus = "normal" | "loose" | "none";

export interface DaycareReportData {
  feeding_status?: DaycareFeedingStatus | null;
  feeding_obs?: string | null;
  medication_status?: DaycareMedicationStatus | null;
  medication_obs?: string | null;
  pee_status?: DaycarePeeStatus | null;
  poop_status?: DaycarePoopStatus | null;
  mood_tags?: string[] | null;
  best_friend?: string | null;
  caretaker_notes?: string | null;
  updated_at?: string | null;
}

export interface DaycarePackage {
  id: number;
  name: string;
  price_cents: number;
  is_monthly: boolean;
  frequency?: number | null;
  days_quantity?: number | null;
  validity_days?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DaycarePackageCreatePayload {
  name: string;
  price_cents: number;
  is_monthly: boolean;
  frequency?: number | null;
  days_quantity?: number | null;
  validity_days?: number | null;
  is_active?: boolean;
}

export interface DaycarePackageUpdatePayload {
  name?: string;
  price_cents?: number;
  is_monthly?: boolean;
  frequency?: number | null;
  days_quantity?: number | null;
  validity_days?: number | null;
  is_active?: boolean;
}

export interface DaycarePackageFormData {
  name: string;
  price_cents: number;
  is_monthly: boolean;
  frequency?: number | null;
  days_quantity?: number | null;
  validity_days?: number | null;
  is_active: boolean;
}

