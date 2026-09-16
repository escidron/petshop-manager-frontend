export type EmployeeRole = "groomer" | "bather" | "vet" | "salesperson" | "receptionist" | "driver" | "other";

export type Employee = {
  id: number;
  tenant_id: number;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string | null;
  schedule_token?: string | null;
  admission_date?: string | null;
  resignation_date?: string | null;
  is_active: boolean;
  created_at: string;
};

export type EmployeeFormData = {
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string | null;
  admission_date?: string | null;
  resignation_date?: string | null;
  is_active: boolean;
};
