export type ClientPackageCredit = {
  id: number;
  service_id: number | null;
  service_name: string;
  total_qty: number;
  used_qty: number;
  remaining_qty: number;
};

export type ClientPackage = {
  id: number;
  tenant_id: number;
  client_id: number;
  pet_id: number;
  package_id: number | null;
  package_name: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  credits: ClientPackageCredit[];
};

export type ClientPackageSellData = {
  pet_id: number;
  package_id: number;
};
