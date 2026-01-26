import apiClient from "../apiClient";

type CreateAppointmentPayload = {
  client_id: number;
  pet_id: number;
  scheduled_at: string;
  service_ids: number[];
  notes?: string;
};

export const createAppointment = async (
  payload: CreateAppointmentPayload
) => {
  const response = await apiClient.post(
    "/api/v1/appointments",
    payload,
    { params: { tenant_id: 1 } }
  );

  return response.data;
};
