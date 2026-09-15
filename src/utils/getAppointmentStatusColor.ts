import { Hourglass,CalendarCheck, Play, Ban,  X, Check      } from 'lucide-react';
import { amber, orange } from '@mui/material/colors';
import type { AppointmentStatus, AppointmentStatusUI } from '../features/appointments/types';

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "canceled",
  "no_show",
] as const;



export const APPOINTMENT_STATUS_UI = {
  pending: {
    label: "Pendente",
    palette: "warning",
    icon: Hourglass,
    color: amber[600],
    bg: amber[300],
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
    color: "#ff751f",
    bg: orange[300],
  },
  completed: {
    label: "Finalizado",
    palette: "success",
    icon: Check ,
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

export function getAppointmentStatusUI(
  status: AppointmentStatus,
): AppointmentStatusUI {
  return APPOINTMENT_STATUS_UI[status];
}
