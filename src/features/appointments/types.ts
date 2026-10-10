// types.ts

import type { z } from "zod";
import { appointmentSchema } from "./schemas";
import type { Pet } from "../pets/types";
import type { LucideIcon } from "lucide-react";
import type dayjs from "dayjs";
import type { Client } from "../clients/types";

/* ======================================================
 * STATUS (espelha backend enum)
 * ====================================================== */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "canceled"
  | "no_show";

export type AppointmentAction =
  | "confirm"
  | "start"
  | "complete"
  | "cancel"
  | "no_show";

export type ServiceBase = {
  id: number;
  name: string;
  price_cents: number;
  duration_minutes?: number;
  is_package_covered?: boolean;
  billing_status?: string;
  is_removed?: boolean;
  removed_at?: string | null;
  removal_reason?: string | null;
  employee_id?: number | null;
  employee_ids?: number[];
  species?: string | null;
  size?: string | null;
  coat_type?: string | null;
};

export type StatusPalette = "success" | "error" | "warning" | "info";

export interface AppointmentStatusUI {
  label: string;
  palette: StatusPalette;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
}

export type TimelineBlock =
  | {
    type: "free"
    start: dayjs.Dayjs
    end: dayjs.Dayjs
  }
  | {
    type: "appointment"
    data: Appointment
    start: dayjs.Dayjs
    end: dayjs.Dayjs
  }

export type AppointmentFlowState =
  | { open: false }
  | {
    open: true;
    mode: "create" | "edit";
    step: "appointment" | "client" | "pet";
    selectedClient?: Client;
    selectedPet?: Pet;
    appointment?: Appointment;
    initialDate?: string;
    prefill?: Partial<AppointmentFormData>;
    waitingListEntryId?: number;
  };

export type AppointmentItem = {
  id: number;
  pet: Pet;
  services: ServiceBase[];
};

export type Appointment = {
  id: number;
  scheduled_at: string; // backend datetime vira string ISO
  notes?: string | null;
  status: AppointmentStatus;

  client: Client;
  items: AppointmentItem[];
  is_paid: boolean;
  is_fully_package_covered: boolean;
  warnings?: string[];
  recurrence_id?: string | null;
  recurrence_frequency?: string | null;
  recurrence?: {
    frequency: "weekly" | "biweekly" | "monthly";
    occurrences: number;
  } | null;

  created_at: string;
};

export type AppointmentFormData =
  z.infer<typeof appointmentSchema>;
