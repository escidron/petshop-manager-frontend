import apiClient from "../apiClient";
import type {
  CommissionRule,
  CommissionRuleFormData,
  CommissionEntry,
} from "../../features/commissions/types";

// Rules
export const getCommissionRules = async (): Promise<CommissionRule[]> => {
  const response = await apiClient.get<CommissionRule[]>("/api/v1/commissions/rules/");
  return response.data;
};

export const createCommissionRule = async (data: CommissionRuleFormData): Promise<CommissionRule> => {
  const response = await apiClient.post<CommissionRule>("/api/v1/commissions/rules/", data);
  return response.data;
};

export const updateCommissionRule = async (
  id: number,
  data: Partial<CommissionRuleFormData>,
): Promise<CommissionRule> => {
  const response = await apiClient.patch<CommissionRule>(`/api/v1/commissions/rules/${id}`, data);
  return response.data;
};

export const deleteCommissionRule = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/commissions/rules/${id}`);
};

// Entries
export const getCommissionEntries = async (params?: {
  employee_id?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
}): Promise<CommissionEntry[]> => {
  const response = await apiClient.get<CommissionEntry[]>("/api/v1/commissions/entries/", {
    params,
  });
  return response.data;
};

export const payCommissionEntries = async (data: {
  employee_id: number;
  entry_ids: number[];
  notes?: string;
}): Promise<CommissionEntry[]> => {
  const response = await apiClient.post<CommissionEntry[]>("/api/v1/commissions/pay/", data);
  return response.data;
};
