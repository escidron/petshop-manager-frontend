export type Supplier = {
  id: number;
  tenant_id: number;
  name: string;
  cnpj?: string | null;
};

export type SupplierFormData = {
  name: string;
  cnpj?: string | null;
};
