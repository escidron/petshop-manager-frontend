import type { Product, ProductFormData } from "../../features/products/types";
import apiClient from "../apiClient";


export const fetchProducts = async () => {
  const response = await apiClient.get<Product[]>(
    "/api/v1/products/",
  );
  return response.data;
};

export const createProduct = async (
  payload: ProductFormData
) => {
  const response = await apiClient.post<Product>(
    "/api/v1/products/",
    { ...payload, is_active: true },
  );
  return response.data;
};

export const updateProduct= async (
  productId: number,
  payload: Partial<Product>
) => {
  const response = await apiClient.patch<Product>(
    `/api/v1/products/${productId}`,
    payload,
  );
  return response.data;
};

export const deleteProduct = async (productId: number) => {
  await apiClient.delete(`/api/v1/products/${productId}`);
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>("/api/v1/products/inventory/low-stock");
  return response.data;
};

export const adjustStock = async (
  productId: number,
  quantityChange: number,
  notes?: string
): Promise<Product> => {
  const response = await apiClient.post<Product>(`/api/v1/products/${productId}/adjust-stock`, {
    quantity_change: quantityChange,
    notes,
  });
  return response.data;
};
