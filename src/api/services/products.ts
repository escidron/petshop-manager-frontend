import type { ProductFormData } from "../../features/products/ProductForm";
import type { Product } from "../../pages/ProductsPage";
import apiClient from "../apiClient";

const TENANT_PARAMS = { tenant_id: 1 };

export const fetchProducts = async () => {
  const response = await apiClient.get<Product[]>(
    "/api/v1/products/",
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const createProduct = async (
  payload: ProductFormData
) => {
  const response = await apiClient.post<Product>(
    "/api/v1/products/",
    { ...payload, is_active: true },
    { params: TENANT_PARAMS }
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
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const deleteProduct = async (productId: number) => {
  await apiClient.delete(`/api/v1/products/${productId}`, {
    params: { tenant_id: 1 },
  });
};