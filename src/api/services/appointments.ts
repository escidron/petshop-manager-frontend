import type { Client } from "../../pages/ClientsPage";
import type { Pet } from "../../pages/PetsPage";
import apiClient from "../apiClient";

export type Service = {
  name: string;
  description?: string | null;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
};

export const AppointmentStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELED: "canceled",
  NO_SHOW: "no_show",
} as const;

export type AppointmentAction =
  | "confirm"
  | "start"
  | "complete"
  | "cancel"
  | "no_show";

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export type Appointment = {
  id: number;
  scheduled_at: string;
  notes?: string | null;

  client: Client;
  pet: Pet;
  services: Service[];
  status: AppointmentStatus;
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Finalizado",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

export type createAppointment = {
  scheduled_at: string;
  client_id: number;
  pet_id: number;
  service_ids: number[];
  notes?: string | null;
}


export const createAppointment = async (
  payload: createAppointment
) => {
  const response = await apiClient.post(
    "/api/v1/appointments",
    payload,
    { params: { tenant_id: 1 } }
  );

  return response.data;
};

export const getAppointmentsByDay = async (date: string) => {
  const response = await apiClient.get<Appointment[]>(
    `/api/v1/appointments/day/${date}`,
    {
      params: {
        tenant_id: 1,
        date, // format: YYYY-MM-DD
      },
    }
  );

  return response.data;
};

export const applyAppointmentAction = async (
  appointmentId: number,
  action: AppointmentAction
) => {
  const response = await apiClient.post<Appointment>(
    `/api/v1/appointments/${appointmentId}/actions`,
    {
      action,
    },
    {
      params: {
        tenant_id: 1,
      },
    }
  );

  return response.data;
};