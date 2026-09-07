import apiClient from "../apiClient";

export interface OperationalDayMeta {
  day: number;
  day_of_week: string; // "SÁB", "DOM", "SEG", etc.
  date_str: string; // "01/jul"
  is_weekend: boolean;
  is_closed: boolean;
  has_activity: boolean;
}

export interface OperationalServiceRow {
  code: string; // "BP", "BM", "MP", etc.
  name: string; // "Banho P", "Máq. P", etc.
  group_key: string; // "bath", "machine", "scissor", "cat", "other"
  group_name: string; // "Banhos", "Tosa Máquina", "Tosa Tesoura", "Gatos", "Outros"
  daily_counts: Record<number, number>;
  total_count: number;
  order_index: number;
}

export interface OperationalGroupSubtotal {
  group_key: string;
  group_name: string;
  daily_counts: Record<number, number>;
  total_count: number;
}

export interface OperationalSummaryKPIs {
  total_services: number;
  working_days: number;
  avg_services_per_working_day: number;
  peak_day: number;
  peak_day_count: number;
  peak_day_label: string;
  top_service_name: string;
  top_service_count: number;
  top_service_pct: number;
  total_revenue: number;
  avg_revenue_per_working_day: number;
  ticket_medio_operational: number;
}

export interface OperationalAnnualComparison {
  current_year: number;
  previous_year: number;
  monthly_volume_current: Record<number, number>;
  monthly_volume_previous: Record<number, number>;
}

export interface OperationalStratifiedItem {
  code: string;
  name: string;
  group_key: string;
  count: number;
  percentage: number;
}

export interface OperationalResultResponse {
  year: number;
  month: number;
  days_in_month: number;
  days_metadata: OperationalDayMeta[];
  rows: OperationalServiceRow[];
  group_subtotals: OperationalGroupSubtotal[];
  daily_totals: Record<number, number>;
  summary: OperationalSummaryKPIs;
  annual_comparison: OperationalAnnualComparison;
  stratified_services: OperationalStratifiedItem[];
}

export const getOperationalResult = async (
  year: number,
  month: number
): Promise<OperationalResultResponse> => {
  const { data } = await apiClient.get<OperationalResultResponse>(
    "/api/v1/financial/operational-result",
    { params: { year, month } }
  );
  return data;
};

export const exportOperationalResultExcel = async (
  year: number,
  month: number
): Promise<Blob> => {
  const response = await apiClient.get(
    "/api/v1/financial/operational-result/export",
    {
      params: { year, month },
      responseType: "blob",
    }
  );
  return response.data;
};

