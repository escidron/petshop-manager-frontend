import type { Appointment, AppointmentAction, AppointmentFormData, AppointmentStatus } from "../../features/appointments/types";
import apiClient from "../apiClient";

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Finalizado",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};


export const createAppointment = async (
  payload: AppointmentFormData
) => {
  const response = await apiClient.post(
    "/api/v1/appointments/",
    payload,
  );

  return response.data;
};

export const updateAppointment = async (
  appointmentId: number,
  payload: AppointmentFormData
) => {
  const response = await apiClient.patch<Appointment>(
    `/api/v1/appointments/${appointmentId}`,
    payload,
  );
  return response.data;
};

export const getAppointmentsByDay = async (
  date: string
): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(
    `/api/v1/appointments/day/${date}`,
    {
      params: { date },
    }
  );

  return response.data;
};
export const getAppointmentsByTenant = async (
  startDate?: string,
  endDate?: string,
): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>("/api/v1/appointments/", {
    params: {
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    },
  });
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
  );

  return response.data;
};