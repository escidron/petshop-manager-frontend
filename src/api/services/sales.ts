import apiClient from "../apiClient";
import type { SaleCreate, SaleResponse } from "../../features/sales/schemas";

export const createSale = async (data: SaleCreate): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>("/sales/", data);
  return response.data;
};

export const listSales = async (): Promise<SaleResponse[]> => {
  const response = await apiClient.get<SaleResponse[]>("/sales/");
  return response.data;
};

export const cancelSale = async (saleId: number): Promise<SaleResponse> => {
  const response = await apiClient.post<SaleResponse>(`/sales/${saleId}/cancel`);
  return response.data;
};
