export type EmployeeRole = "groomer" | "vet" | "salesperson" | "other";

export type Employee = {
  id: number;
  tenant_id: number;
  name: string;
  role: EmployeeRole;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at: string;
};

export type EmployeeFormData = {
  name: string;
  role: EmployeeRole;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
};
