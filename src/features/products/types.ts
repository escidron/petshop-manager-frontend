export type ProductPhoto = {
  id: number;
  product_id: number;
  photo_url: string;
  is_primary: boolean;
  created_at: string;
};

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
  is_internal_use: boolean;
  photos?: ProductPhoto[];
};

export type { ProductFormData } from "./schemas";
