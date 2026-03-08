export type Product = {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantity: number;
  min_stock: number;
  is_active: boolean;
};

export type { ProductFormData } from "./schemas";
