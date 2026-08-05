
import type { Service, ServiceFormData } from "../../features/tenant_services/types";
import apiClient from "../apiClient";


export const fetchServices = async () => {
  const response = await apiClient.get<Service[]>(
    "/api/v1/services/",
  );
  return response.data;
};

// Created as requested to support the missing getTenantServices import
export const getTenantServices = fetchServices;

export const fetchServiceById = async (serviceId: number) => {
  const response = await apiClient.get<ServiceFormData>(
    `/api/v1/services/${serviceId}`,
  );
  return response.data;
};

export const createService = async ( payload: ServiceFormData) => {
  const response = await apiClient.post<Service>(
    "/api/v1/services/",
    { ...payload, is_active: true },
  );
  return response.data;
};

export const updateService = async (serviceId: number, payload: Partial<Service>) => {
  const response = await apiClient.patch<Service>(
    `/api/v1/services/${serviceId}`,
    payload,
  );
  return response.data;
};

export const deleteService = async (serviceId: number) => {
  await apiClient.delete(`/api/v1/services/${serviceId}`);
};

export const exportServices = async (): Promise<Blob> => {
  const response = await apiClient.get("/api/v1/services/export", {
    responseType: "blob",
  });
  return response.data;
};

// Wizard / Migration Routes
import type { ImportJobStatus } from "./clients";

export const startServicesImport = async (file: File): Promise<{ job_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/api/v1/services/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getServiceImportStatus = async (jobId: string): Promise<ImportJobStatus> => {
  const response = await apiClient.get<ImportJobStatus>(`/api/v1/services/import/status/${jobId}`);
  return response.data;
};


export const downloadImportTemplate = async () => {
  const response = await apiClient.get("/api/v1/services/import/template", {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "template_servicos.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const inspectServiceMigrationFile = async (file1: File): Promise<{ file1_headers: string[] }> => {
  const formData = new FormData();
  formData.append("file1", file1);
  const response = await apiClient.post<{ file1_headers: string[] }>(
    "/api/v1/services/migration/inspect",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const downloadConvertedServiceMigrationExcel = async (
  file1: File,
  config: { column_mapping?: Record<string, string>; default_values?: Record<string, string> }
) => {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("config", JSON.stringify(config));

  const response = await apiClient.post(
    "/api/v1/services/migration/convert",
    formData,
    {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "servicos_migrados.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const startServiceMigrationImport = async (
  file1: File,
  config: { column_mapping?: Record<string, string>; default_values?: Record<string, string> }
): Promise<{ job_id: string; total_items: number }> => {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("config", JSON.stringify(config));

  const response = await apiClient.post<{ job_id: string; total_items: number }>(
    "/api/v1/services/migration/import",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};
