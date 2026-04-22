import type { Service } from "../tenant_services/types";
import type { Product } from "../products/types";

export interface PackageItemBase {
  type: "service" | "product";
  service_id?: number | null;
  product_id?: number | null;
  quantity: number;
}


export interface PackageItem extends PackageItemBase {
  id: number;
  package_id: number;
  service?: Service;
  product?: Product;
}

export interface Package {
  id: number;
  tenant_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  validity_days: number | null;
  is_active: boolean;
  items: PackageItem[];
}

export type { PackageFormData } from "./schemas";
