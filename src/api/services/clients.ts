
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

export const startClientsImport = async (file: File): Promise<{ job_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/api/v1/clients/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export type ImportJobStatus = {
  status: "pending" | "running" | "done" | "error";
  progress: number;
  imported: number;   // rows processed so far during run
  created: number;    // new records (final)
  updated: number;    // updated records (final)
  total: number;
  errors: string[];
};

export const getImportJobStatus = async (jobId: string): Promise<ImportJobStatus> => {
  const response = await apiClient.get<ImportJobStatus>(`/api/v1/clients/import/status/${jobId}`);
  return response.data;
};

export const downloadImportTemplate = async () => {
  const response = await apiClient.get("/api/v1/clients/import/template", {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "template_clientes_pets.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

