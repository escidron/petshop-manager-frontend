import type { LucideIcon } from "lucide-react";
import { Hourglass,CalendarCheck, Play, CircleCheck, Ban,  X      } from 'lucide-react';

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "canceled",
  "no_show",
] as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUSES)[number];

export type StatusPalette = "success" | "error" | "warning" | "info";

export interface AppointmentStatusUI {
  label: string;
  palette: StatusPalette;
  icon: LucideIcon;
}

export const APPOINTMENT_STATUS_UI = {
  pending: {
    label: "Pendente",
    palette: "warning",
    icon: Hourglass,
  },
  confirmed: {
    label: "Confirmado",
    palette: "info",
    icon: CalendarCheck,
  },
  in_progress: {
    label: "Em andamento",
    palette: "warning",
    icon: Play,
  },
  completed: {
    label: "Finalizado",
    palette: "success",
    icon: CircleCheck ,
  },
  canceled: {
    label: "Cancelado",
    palette: "error",
    icon: X,
  },
  no_show: {
    label: "Não compareceu",
    palette: "error",
    icon: Ban,
  },
} satisfies Record<AppointmentStatus, AppointmentStatusUI>;

/**
 * Helper público
 */
export function getAppointmentStatusUI(
  status: AppointmentStatus,
): AppointmentStatusUI {
  return APPOINTMENT_STATUS_UI[status];
}
