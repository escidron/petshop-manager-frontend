import type {
  Appointment,
  AppointmentAction,
  AppointmentFormData,
  AppointmentStatus,
  ClientRecurrenceSeries,
} from "../../features/appointments/types";
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

export const buildClientRecurrenceSeries = (
  appointments: Appointment[],
  options?: {
    prioritizeRecurrenceId?: string | null;
    prioritizePetIds?: number[];
    fallbackAppointment?: Appointment | null;
  }
): ClientRecurrenceSeries[] => {
  const mergedMap = new Map<number, Appointment>();
  for (const appt of appointments) {
    if (appt && appt.id) {
      mergedMap.set(appt.id, appt);
    }
  }
  if (options?.fallbackAppointment?.id && !mergedMap.has(options.fallbackAppointment.id)) {
    mergedMap.set(options.fallbackAppointment.id, options.fallbackAppointment);
  }

  const byRecId = new Map<string, Appointment[]>();
  for (const appt of mergedMap.values()) {
    if (!appt.recurrence_id || appt.status === "canceled") continue;
    const list = byRecId.get(appt.recurrence_id) || [];
    list.push(appt);
    byRecId.set(appt.recurrence_id, list);
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const result: ClientRecurrenceSeries[] = [];

  for (const [recId, list] of byRecId.entries()) {
    list.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const lastAppt = list[list.length - 1];

    const freqRaw = lastAppt.recurrence_frequency || lastAppt.recurrence?.frequency || "weekly";
    const frequency: "weekly" | "biweekly" | "monthly" =
      freqRaw === "monthly" ? "monthly" : freqRaw === "biweekly" ? "biweekly" : "weekly";

    const upcoming = list.filter(
      (a) =>
        (a.status === "pending" || a.status === "confirmed" || a.status === "in_progress") &&
        new Date(a.scheduled_at) >= startOfToday
    );

    if (upcoming.length > 0) {
      const nextAppt = upcoming[0];
      const activeItems = (nextAppt.items || []).filter((it) => !it.pet?.is_deceased);

      const petIds = Array.from(
        new Set(
          activeItems
            .map((it) => it.pet?.id)
            .filter((id): id is number => typeof id === "number")
        )
      );
      const petNames = Array.from(
        new Set(
          activeItems
            .map((it) => it.pet?.name)
            .filter((name): name is string => Boolean(name))
        )
      );

      if (petIds.length > 0) {
        result.push({
          recurrence_id: recId,
          frequency,
          representative_appointment: nextAppt,
          next_appointment: nextAppt,
          last_appointment: lastAppt,
          pet_ids: petIds,
          pet_names: petNames,
        });
      }
    }
  }

  const priorityRecId = options?.prioritizeRecurrenceId;
  const priorityPets = new Set(options?.prioritizePetIds || []);

  result.sort((a, b) => {
    if (priorityRecId) {
      if (a.recurrence_id === priorityRecId && b.recurrence_id !== priorityRecId) return -1;
      if (b.recurrence_id === priorityRecId && a.recurrence_id !== priorityRecId) return 1;
    }
    if (priorityPets.size > 0) {
      const aHasPet = a.pet_ids.some((id) => priorityPets.has(id));
      const bHasPet = b.pet_ids.some((id) => priorityPets.has(id));
      if (aHasPet && !bHasPet) return -1;
      if (bHasPet && !aHasPet) return 1;
    }
    // Active / last_session before ended, or ended first? Let's show active/last_session ordered by next date, then ended
    const aTime = new Date((a.next_appointment || a.last_appointment).scheduled_at).getTime();
    const bTime = new Date((b.next_appointment || b.last_appointment).scheduled_at).getTime();
    return aTime - bTime;
  });

  return result;
};

