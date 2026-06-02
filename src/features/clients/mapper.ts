import { isoToBrDate } from "../../utils/formatDates";
import type { ClientFormData, Client } from "./types";

export function clientToFormData(
  client?: Client
): ClientFormData | undefined {
  if (!client) return undefined;

  return {
    name: client.name,
    is_active: client.is_active ?? true,

    email: client.email ?? undefined,

    document_type: client.document_type ?? undefined,
    document: client.document ?? undefined,
    birth_date: client.birth_date ? isoToBrDate(client.birth_date) : undefined,

    phone: client.phone ,

    phone_secondary_name: client.phone_secondary_name ?? undefined,
    phone_secondary: client.phone_secondary ?? undefined,

    phone_tertiary_name: client.phone_tertiary_name ?? undefined,
    phone_tertiary: client.phone_tertiary ?? undefined,

    cep: client.cep ?? undefined,
    street: client.street ?? undefined,
    number: client.number ?? undefined,
    complement: client.complement ?? undefined,
    neighborhood: client.neighborhood ?? undefined,
    city: client.city ?? undefined,
    state: client.state ?? undefined,

    instagram: client.instagram ?? undefined,
    facebook: client.facebook ?? undefined,
  };
}
