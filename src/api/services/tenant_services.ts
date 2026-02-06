import type { ServiceFormData } from "../../features/tenant_services/ServiceForm";
import type { Service } from "../../pages/ServicesPage";
import apiClient from "../apiClient";

const TENANT_PARAMS = { tenant_id: 1 };

export const fetchServices = async () => {
  const response = await apiClient.get<Service[]>(
    "/api/v1/services/",
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const fetchServiceById = async (serviceId: number) => {
  const response = await apiClient.get<ServiceFormData>(
    `/api/v1/services/${serviceId}`,
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const createService = async (payload: Omit<Service, "id">) => {
  const response = await apiClient.post<Service>(
    "/api/v1/services/",
    { ...payload, is_active: true },
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const updateService = async (serviceId: number, payload: Partial<Service>) => {
  const response = await apiClient.patch<Service>(
    `/api/v1/services/${serviceId}`,
    payload,
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const deleteService = async (serviceId: number) => {
  await apiClient.delete(`/api/v1/services/${serviceId}`, { params: TENANT_PARAMS });
};