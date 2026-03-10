export interface PackageItemBase {
  service_id?: number | null;
  product_id?: number | null;
  quantity: number;
}

export interface PackageItem extends PackageItemBase {
  id: number;
  package_id: number;
}

export interface Package {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  price_cents: number;
  is_active: boolean;
  items: PackageItem[];
}

export interface PackageFormData {
  name: string;
  description?: string;
  price_cents: number;
  is_active: boolean;
  items: PackageItemBase[];
}
