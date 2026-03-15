export type Product = {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price_cents: number;
  cost_cents?: number;
  quantity: number;
  min_stock: number;
  is_active: boolean;
};

export type { ProductFormData } from "./schemas";
