export type Supplier = {
  id: number;
  tenant_id: number;
  name: string;
  cnpj?: string | null;
  phone_1?: string | null;
  phone_2?: string | null;
  email?: string | null;
};

export type SupplierFormData = {
  name: string;
  cnpj?: string | null;
  phone_1?: string | null;
  phone_2?: string | null;
  email?: string | null;
};
