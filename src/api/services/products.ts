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

export const fetchProducts = async (excludeInternal: boolean = false) => {
  const query = excludeInternal ? "?exclude_internal=true" : "";
  const response = await apiClient.get<any[]>(
    `/api/v1/products/${query}`,
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

export const exportProducts = async (): Promise<Blob> => {
  const response = await apiClient.get("/api/v1/products/export", {
    responseType: "blob",
  });
  return response.data;
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

import type { ImportJobStatus } from "./clients";

export const startProductsImport = async (file: File): Promise<{ job_id: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/api/v1/products/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getProductImportStatus = async (jobId: string): Promise<ImportJobStatus> => {
  const response = await apiClient.get<ImportJobStatus>(`/api/v1/products/import/status/${jobId}`);
  return response.data;
};


export const downloadImportTemplate = async () => {
  const response = await apiClient.get("/api/v1/products/import/template", {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "template_produtos.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const inspectProductMigrationFile = async (file1: File): Promise<{ file1_headers: string[] }> => {
  const formData = new FormData();
  formData.append("file1", file1);
  const response = await apiClient.post<{ file1_headers: string[] }>(
    "/api/v1/products/migration/inspect",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const downloadConvertedProductMigrationExcel = async (
  file1: File,
  config: { column_mapping?: Record<string, string>; default_values?: Record<string, string> }
) => {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("config", JSON.stringify(config));

  const response = await apiClient.post(
    "/api/v1/products/migration/convert",
    formData,
    {
      responseType: "blob",
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "produtos_migrados.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const startProductMigrationImport = async (
  file1: File,
  config: { column_mapping?: Record<string, string>; default_values?: Record<string, string> }
): Promise<{ job_id: string; total_items: number }> => {
  const formData = new FormData();
  formData.append("file1", file1);
  formData.append("config", JSON.stringify(config));

  const response = await apiClient.post<{ job_id: string; total_items: number }>(
    "/api/v1/products/migration/import",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

