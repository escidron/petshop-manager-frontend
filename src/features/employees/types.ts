export type EmployeeRole = "groomer" | "bather" | "vet" | "salesperson" | "receptionist" | "driver" | "other";

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
