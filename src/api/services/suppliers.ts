import type { Supplier, SupplierFormData } from "../../features/suppliers/types";
import apiClient from "../apiClient";

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await apiClient.get<Supplier[]>("/api/v1/suppliers/");
  return response.data;
};

export const getSupplier = async (id: number | string): Promise<Supplier> => {
  const response = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (data: SupplierFormData): Promise<Supplier> => {
  const response = await apiClient.post<Supplier>("/api/v1/suppliers/", data);
  return response.data;
};

export const updateSupplier = async (id: number | string, data: Partial<SupplierFormData>): Promise<Supplier> => {
  const response = await apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id: number | string): Promise<void> => {
  await apiClient.delete(`/api/v1/suppliers/${id}`);
};
