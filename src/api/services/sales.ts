import apiClient from "../apiClient";
import type { SaleCreate, SaleResponse, POSStartupResponse, POSClientDetailsResponse } from "../../features/sales/schemas";

export const createSale = async (data: SaleCreate): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>("/api/v1/sales/", data);
  return response.data;
};

export const listSales = async (startDate?: string, endDate?: string, clientId?: number): Promise<SaleResponse[]> => {
  const response = await apiClient.get<SaleResponse[]>("/api/v1/sales/", {
    params: {
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(clientId && { client_id: clientId }),
    },
  });
  return response.data;
};

export const getSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await apiClient.get<SaleResponse>(`/api/v1/sales/${saleId}`);
  return response.data;
};

export const cancelSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>(
    `/api/v1/sales/${saleId}/cancel`,
  );
  return response.data;
};

export const fetchPOSStartup = async (): Promise<POSStartupResponse> => {
  const response = await apiClient.get<POSStartupResponse>("/api/v1/sales/pos-startup");
  const data = response.data;
  return {
    ...data,
    products: (data.products || []).map((p: any) => ({
      ...p,
      price_cents: p.price_cents ?? (typeof p.price === "number" ? p.price : 0),
      cost_cents: p.cost_cents ?? (typeof p.cost === "number" ? p.cost : 0),
    })),
  };
};

export const fetchPOSClientDetails = async (clientId: number): Promise<POSClientDetailsResponse> => {
  const response = await apiClient.get<POSClientDetailsResponse>(`/api/v1/sales/pos-client/${clientId}`);
  return response.data;
};
