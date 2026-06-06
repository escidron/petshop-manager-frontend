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
  unit?: string;
  
  barcode?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  csosn?: string;
  cst_pis?: string;
  cst_cofins?: string;
  supplier_id?: number | null;
  
  is_active: boolean;
};

export type { ProductFormData } from "./schemas";
