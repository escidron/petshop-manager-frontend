import apiClient from "../apiClient";
import type { SaleCreate, SaleResponse } from "../../features/sales/schemas";

export const createSale = async (data: SaleCreate): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>("/api/v1/sales/", data);
  return response.data;
};

export const listSales = async (): Promise<SaleResponse[]> => {
  const response = await apiClient.get<SaleResponse[]>("/api/v1/sales/");
  return response.data;
};

export const cancelSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>(
    `/api/v1/sales/${saleId}/cancel`,
  );
  return response.data;
};
