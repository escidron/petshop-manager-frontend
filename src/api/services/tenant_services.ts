
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