import type { Service } from "../tenant_services/types";

export type ClientPackageCredit = {
  id: number;
  service_id: number | null;
  service_name: string;
  total_qty: number;
  used_qty: number;
  remaining_qty: number;
  service?: Service | null;
};

export type ClientPackage = {
  id: number;
  tenant_id: number;
  client_id: number;
  pet_id: number;
  package_id: number | null;
  package_name: string;
  is_active: boolean;
  is_paid: boolean;
  created_at: string;
  expires_at: string | null;
  client: { id: number; name: string };
  pet: { id: number; name: string };
  credits: ClientPackageCredit[];
  usages: ClientPackageUsage[];
};

export type ClientPackageSellData = {
  pet_id: number;
  package_id: number;
};

export type ClientPackageUsage = {
  id: number;
  client_package_id: number;
  credit_id: number;
  change_qty: number;
  notes: string | null;
  created_at: string;
  service_name: string;
};
