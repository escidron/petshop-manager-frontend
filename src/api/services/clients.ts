
import type { Client, ClientFormData } from "../../features/clients/types";
import apiClient from "../apiClient";


export const fetchClients = async () => {
  const response = await apiClient.get<Client[]>("/api/v1/clients/");
  return response.data;
};

export const fetchClientById = async (clientId: number) => {
  const response = await apiClient.get<Client>(
    `/api/v1/clients/${clientId}`,
  );
  return response.data;
};

export const createClient = async (
  payload: ClientFormData
) => {
  const response = await apiClient.post<Client>(
    "/api/v1/clients/",
    { ...payload, is_active: true },
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
  );
  return response.data;
};

export const deleteClient = async (clientId: number) => {
  await apiClient.delete(`/api/v1/clients/${clientId}`);
};
