// mappers.ts
import type { Appointment, AppointmentFormData } from "./types";

export function formDataToAppointmentPayload(
  data: AppointmentFormData
) {
  return {
    client_id: data.client_id,
    scheduled_at: data.scheduled_at,
    notes: data.notes,
    items: data.items,
  };
}

export function appointmentToFormData(
  appointment?: Appointment
): AppointmentFormData | undefined {
  if (!appointment) return undefined;

  let recurrence = undefined;
  if (appointment.recurrence) {
    recurrence = {
      frequency: appointment.recurrence.frequency,
      occurrences: appointment.recurrence.occurrences,
    };
  } else if (appointment.recurrence_id) {
    recurrence = {
      frequency: (appointment.recurrence_frequency as "weekly" | "biweekly" | "monthly") || "weekly",
      occurrences: 4,
    };
  }

  return {
    client_id: appointment.client.id,
    scheduled_at: appointment.scheduled_at,
    notes: appointment.notes ?? undefined,

    items: appointment.items.map((item) => ({
      pet_id: item.pet.id,
      service_ids: item.services.map((service) => service.id),
      recurrence: recurrence ? { ...recurrence } : undefined,
    })),
    recurrence,
  };
}
