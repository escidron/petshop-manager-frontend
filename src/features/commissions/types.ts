export type AppliesTo = "service" | "product" | "both";
export type CommissionType = "percentage" | "fixed";
export type CommissionStatus = "pending" | "paid";

export type CommissionRule = {
  id: number;
  tenant_id: number;
  name: string;
  employee_id?: number | null;
  service_ids: number[];
  applies_to: AppliesTo;
  commission_type: CommissionType;
  value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
};

export type CommissionRuleFormData = {
  name: string;
  employee_id?: number | null;
  service_ids: number[];
  applies_to: AppliesTo;
  commission_type: CommissionType;
  value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
};

export type CommissionEntry = {
  id: number;
  tenant_id: number;
  sale_id?: number | null;
  sale_item_id?: number | null;
  appointment_item_id?: number | null;
  employee_id: number;
  rule_id?: number | null;
  commission_type: string;
  rate: number;
  base_amount: number;
  commission_amount: number;
  status: CommissionStatus;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
};
