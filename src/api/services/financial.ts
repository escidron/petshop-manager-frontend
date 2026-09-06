import apiClient from "../apiClient";

export type DREGroupType =
  | "gross_revenue"
  | "cmv"
  | "fixed_expense"
  | "variable_expense"
  | "financial_result"
  | "result";

export interface DREAccount {
  id: number;
  tenant_id: number;
  name: string;
  code?: string | null;
  group_type: DREGroupType;
  is_system: boolean;
  system_source?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface DREAccountCreate {
  name: string;
  code?: string;
  group_type: DREGroupType;
  order_index?: number;
  is_active?: boolean;
}

export interface DREAccountUpdate {
  name?: string;
  code?: string;
  group_type?: DREGroupType;
  order_index?: number;
  is_active?: boolean;
}

export interface DREEntryUpsert {
  account_id: number;
  competence_year: number;
  competence_month: number;
  amount: number;
  notes?: string;
}

export interface DREEntryReplicate {
  account_id: number;
  competence_year: number;
  start_month: number;
  end_month: number;
  amount: number;
  notes?: string;
}

export interface DREEntryResponse {
  id: number;
  tenant_id: number;
  account_id: number;
  competence_year: number;
  competence_month: number;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface DRERowData {
  id: string;
  account_id?: number | null;
  name: string;
  code?: string | null;
  group_type: DREGroupType;
  is_system: boolean;
  system_source?: string | null;
  is_header: boolean;
  is_subtotal: boolean;
  is_result: boolean;
  is_percentage_row: boolean;
  is_editable: boolean;
  display_order: number;
  monthly_amounts: Record<number, number>;
  monthly_percentages: Record<number, number>;
  total_amount: number;
  total_percentage: number;
  monthly_average: number;
}

export interface DREGroupData {
  group_type: DREGroupType;
  title: string;
  subtotal_name: string;
  rows: DRERowData[];
  subtotal_row: DRERowData;
}

export interface DRESummary {
  gross_revenue_total: number;
  cmv_total: number;
  gross_margin_total: number;
  gross_margin_pct: number;
  fixed_expenses_total: number;
  variable_expenses_total: number;
  ebitda_total: number;
  ebitda_pct: number;
  financial_result_total: number;
  net_profit_total: number;
  net_margin_pct: number;
}

export interface DREReportResponse {
  year: number;
  months: number[];
  groups: DREGroupData[];
  all_rows: DRERowData[];
  summary: DRESummary;
}

export const getDREReport = async (year: number = new Date().getFullYear()): Promise<DREReportResponse> => {
  const response = await apiClient.get<DREReportResponse>("/api/v1/financial/dre", {
    params: { year },
  });
  return response.data;
};

export const upsertDREEntry = async (payload: DREEntryUpsert): Promise<DREEntryResponse> => {
  const response = await apiClient.post<DREEntryResponse>("/api/v1/financial/dre/entries", payload);
  return response.data;
};

export const batchUpsertDREEntries = async (entries: DREEntryUpsert[]): Promise<DREEntryResponse[]> => {
  const response = await apiClient.post<DREEntryResponse[]>("/api/v1/financial/dre/entries/batch", { entries });
  return response.data;
};

export const replicateDREEntry = async (payload: DREEntryReplicate): Promise<DREEntryResponse[]> => {
  const response = await apiClient.post<DREEntryResponse[]>("/api/v1/financial/dre/entries/replicate", payload);
  return response.data;
};

export const listDREAccounts = async (): Promise<DREAccount[]> => {
  const response = await apiClient.get<DREAccount[]>("/api/v1/financial/dre/accounts");
  return response.data;
};

export const createDREAccount = async (payload: DREAccountCreate): Promise<DREAccount> => {
  const response = await apiClient.post<DREAccount>("/api/v1/financial/dre/accounts", payload);
  return response.data;
};

export const updateDREAccount = async (
  accountId: number,
  payload: DREAccountUpdate
): Promise<DREAccount> => {
  const response = await apiClient.put<DREAccount>(`/api/v1/financial/dre/accounts/${accountId}`, payload);
  return response.data;
};

export const deleteDREAccount = async (accountId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/financial/dre/accounts/${accountId}`);
};

export const exportDREExcel = async (year: number = new Date().getFullYear()): Promise<Blob> => {
  const response = await apiClient.get("/api/v1/financial/dre/export", {
    params: { year },
    responseType: "blob",
  });
  return response.data;
};
