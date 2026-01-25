import type { ClientFormData } from "../../features/clients/ClientForm";
import type { Client } from "../../pages/ClientsPage";
import apiClient from "../apiClient";

const TENANT_PARAMS = { tenant_id: 1 };

export const fetchClients = async () => {
  const response = await apiClient.get<Client[]>(
    "/api/v1/clients/",
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const fetchClientById = async (clientId: number) => {
  const response = await apiClient.get<Client>(
    `/api/v1/clients/${clientId}`,
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const createClient = async (
  payload: ClientFormData
) => {
  const response = await apiClient.post<Client>(
    "/api/v1/clients/",
    { ...payload, is_active: true },
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const updateClient = async (
  clientId: string,
  payload: Partial<Client>
) => {
  const response = await apiClient.patch<Client>(
    `/api/v1/clients/${clientId}`,
    payload,
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const deleteClient = async (clientId: number) => {
  await apiClient.delete(`/api/v1/clients/${clientId}`, {
    params: { tenant_id: 1 },
  });
};
