import apiClient from "../apiClient";

const TENANT_PARAMS = { tenant_id: 1 };

export type Service = {
    id: number;
    name: string;
}

export const fetchServices = async () => {
  const response = await apiClient.get<Service[]>(
    "/api/v1/services/",
    { params: TENANT_PARAMS }
  );
  return response.data;
};