import type { Product, ProductFormData } from "../../features/products/types";
import apiClient from "../apiClient";


const mapProductFromApi = (p: any): Product => ({
  ...p,
  price_cents: p.price_cents ?? p.price ?? 0,
  cost_cents: p.cost_cents ?? p.cost ?? 0,
});

const mapProductToApi = (p: any) => {
  const { price_cents, cost_cents, ...rest } = p;
  const mapped: any = { ...rest };
  if (price_cents !== undefined) mapped.price = price_cents;
  if (cost_cents !== undefined) mapped.cost = cost_cents;
  return mapped;
};

export const fetchProducts = async () => {
  const response = await apiClient.get<any[]>(
    "/api/v1/products/",
  );
  return response.data.map(mapProductFromApi);
};

export const createProduct = async (
  payload: ProductFormData
) => {
  const response = await apiClient.post<any>(
    "/api/v1/products/",
    { ...mapProductToApi(payload), is_active: true },
  );
  return mapProductFromApi(response.data);
};

export const updateProduct= async (
  productId: number,
  payload: Partial<Product>
) => {
  const response = await apiClient.patch<any>(
    `/api/v1/products/${productId}`,
    mapProductToApi(payload),
  );
  return mapProductFromApi(response.data);
};

export const deleteProduct = async (productId: number) => {
  await apiClient.delete(`/api/v1/products/${productId}`);
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<any[]>("/api/v1/products/inventory/low-stock");
  return response.data.map(mapProductFromApi);
};

export const adjustStock = async (
  productId: number,
  quantityChange: number,
  notes?: string
): Promise<Product> => {
  const response = await apiClient.post<any>(`/api/v1/products/${productId}/adjust-stock`, {
    quantity_change: quantityChange,
    notes,
  });
  return mapProductFromApi(response.data);
};

export const fetchGlobalInventoryLogs = async () => {
  const response = await apiClient.get(
    "/api/v1/products/inventory/logs",
  );
  return response.data;
};
