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

export type UpdateAppointmentPayload = Partial<AppointmentFormData> & {
  update_all_future?: boolean;
  remove_recurrence?: boolean;
  recurrence?: {
    frequency: "weekly" | "biweekly" | "monthly";
    occurrences: number;
  } | null;
};

export const updateAppointment = async (
  appointmentId: number,
  payload: UpdateAppointmentPayload
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
    `/api/v1/appointments/day/${date}`
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
  action: AppointmentAction,
  cancelAllFuture: boolean = false
) => {
  const response = await apiClient.post<Appointment>(
    `/api/v1/appointments/${appointmentId}/actions`,
    {
      action,
      cancel_all_future: cancelAllFuture
    },
  );

  return response.data;
};

export const assignAppointmentEmployees = async (
  appointmentId: number,
  assignments: {
    appointment_item_id: number;
    service_id: number;
    employee_id?: number | null;
    employee_ids?: number[];
  }[]
) => {
  const response = await apiClient.patch<Appointment>(
    `/api/v1/appointments/${appointmentId}/assign-employees`,
    { assignments }
  );
  return response.data;
};

export interface PaginatedAppointmentsResponse {
  items: Appointment[];
  total: number;
}

export const getOpenInvoices = async (params?: { limit?: number, offset?: number, search?: string }): Promise<{ items: Appointment[], total: number }> => {
  const response = await apiClient.get<{ items: Appointment[], total: number }>("/api/v1/appointments/open-invoices", {
    params: {
      limit: params?.limit,
      offset: params?.offset,
      search: params?.search || undefined,
    }
  });
  return response.data;
};

export const listAppointmentsByClient = async (
  clientId: number
): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(
    `/api/v1/appointments/client/${clientId}`
  );
  return response.data;
};

export const getHighlightedDays = async (
  startDate?: string,
  endDate?: string,
): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/api/v1/appointments/highlighted-days", {
    params: {
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    },
  });
  return response.data;
};

export const addAppointmentService = async (
  appointmentId: number,
  data: {
    pet_id: number;
    service_id: number;
    employee_id?: number;
    employee_ids?: number[];
  },
): Promise<Appointment> => {
  const response = await apiClient.post<Appointment>(
    `/api/v1/appointments/${appointmentId}/services`,
    data,
  );
  return response.data;
};

export const removeUnpaidAppointmentService = async (
  appointmentId: number,
  serviceId: number,
  petId?: number,
): Promise<Appointment> => {
  const response = await apiClient.delete<Appointment>(
    `/api/v1/appointments/${appointmentId}/services/${serviceId}`,
    {
      params: {
        ...(petId && { pet_id: petId }),
      },
    }
  );
  return response.data;
};

export const cancelCompletedAppointment = async (
  appointmentId: number,
  reason?: string,
): Promise<Appointment> => {
  const response = await apiClient.post<Appointment>(
    `/api/v1/appointments/${appointmentId}/cancel-completed`,
    { reason }
  );
  return response.data;
};
