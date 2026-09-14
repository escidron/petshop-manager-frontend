import apiClient from "../apiClient";

export type BillType = "payable" | "receivable";
export type BillStatus = "pending" | "paid" | "overdue" | "canceled";

export interface FinancialBill {
  id: number;
  tenant_id: number;
  bill_type: BillType;
  description: string;
  category_id?: number | null;
  category_name?: string | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  client_id?: number | null;
  client_name?: string | null;
  sale_id?: number | null;
  amount: number;
  paid_amount: number;
  discount_amount: number;
  fine_or_interest_amount: number;
  issue_date: string;
  due_date: string;
  payment_date?: string | null;
  status: BillStatus;
  payment_method?: string | null;
  document_number?: string | null;
  barcode?: string | null;
  installment_number: number;
  total_installments: number;
  parent_bill_id?: number | null;
  destination_account_id?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialBillCreate {
  bill_type: BillType;
  description: string;
  amount: number;
  due_date: string;
  issue_date?: string;
  category_id?: number | null;
  supplier_id?: number | null;
  client_id?: number | null;
  payment_method?: string | null;
  document_number?: string | null;
  barcode?: string | null;
  notes?: string | null;
  total_installments?: number;
  installment_interval_days?: number;
}

export interface FinancialBillUpdate {
  description?: string;
  amount?: number;
  due_date?: string;
  issue_date?: string;
  category_id?: number | null;
  supplier_id?: number | null;
  client_id?: number | null;
  payment_method?: string | null;
  document_number?: string | null;
  barcode?: string | null;
  notes?: string | null;
}

export interface FinancialBillSettle {
  payment_date: string;
  paid_amount: number;
  discount_amount?: number;
  fine_or_interest_amount?: number;
  payment_method?: string | null;
  destination_account_id?: number | null;
  notes?: string | null;
}

export interface FinancialBillsSummary {
  total_payable: number;
  payable_paid: number;
  payable_pending: number;
  payable_overdue: number;
  payable_overdue_count: number;
  total_receivable: number;
  receivable_paid: number;
  receivable_pending: number;
  receivable_overdue: number;
  receivable_overdue_count: number;
  net_balance_expected: number;
  net_balance_realized: number;
}

export interface FinancialBillListResponse {
  items: FinancialBill[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BillFilters {
  bill_type?: BillType | "all";
  status?: BillStatus | "all";
  start_date?: string;
  end_date?: string;
  category_id?: number;
  supplier_id?: number;
  client_id?: number;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export const getFinancialBills = async (
  filters: BillFilters = {}
): Promise<FinancialBillListResponse> => {
  const params: Record<string, any> = {};
  if (filters.bill_type && filters.bill_type !== "all") params.bill_type = filters.bill_type;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.supplier_id) params.supplier_id = filters.supplier_id;
  if (filters.client_id) params.client_id = filters.client_id;
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_dir) params.sort_dir = filters.sort_dir;

  const response = await apiClient.get<FinancialBillListResponse>(
    "/api/v1/financial/bills",
    { params }
  );
  return response.data;
};

export const getFinancialBillsSummary = async (
  filters: Partial<BillFilters> = {}
): Promise<FinancialBillsSummary> => {
  const params: Record<string, any> = {};
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.category_id) params.category_id = filters.category_id;

  const response = await apiClient.get<FinancialBillsSummary>(
    "/api/v1/financial/bills/summary",
    { params }
  );
  return response.data;
};

export const createFinancialBill = async (
  data: FinancialBillCreate
): Promise<FinancialBill[]> => {
  const response = await apiClient.post<FinancialBill[]>(
    "/api/v1/financial/bills",
    data
  );
  return response.data;
};

export const getFinancialBill = async (id: number): Promise<FinancialBill> => {
  const response = await apiClient.get<FinancialBill>(
    `/api/v1/financial/bills/${id}`
  );
  return response.data;
};

export const updateFinancialBill = async (
  id: number,
  data: FinancialBillUpdate
): Promise<FinancialBill> => {
  const response = await apiClient.put<FinancialBill>(
    `/api/v1/financial/bills/${id}`,
    data
  );
  return response.data;
};

export const settleFinancialBill = async (
  id: number,
  data: FinancialBillSettle
): Promise<FinancialBill> => {
  const response = await apiClient.post<FinancialBill>(
    `/api/v1/financial/bills/${id}/settle`,
    data
  );
  return response.data;
};

export const cancelFinancialBill = async (id: number): Promise<FinancialBill> => {
  const response = await apiClient.post<FinancialBill>(
    `/api/v1/financial/bills/${id}/cancel`
  );
  return response.data;
};

export const deleteFinancialBill = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/financial/bills/${id}`);
};

export const exportFinancialBillsExcel = async (
  filters: BillFilters = {}
): Promise<Blob> => {
  const params: Record<string, any> = {};
  if (filters.bill_type && filters.bill_type !== "all") params.bill_type = filters.bill_type;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  if (filters.category_id) params.category_id = filters.category_id;

  const response = await apiClient.get<Blob>("/api/v1/financial/bills/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};
