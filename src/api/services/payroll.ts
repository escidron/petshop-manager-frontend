import apiClient from "../apiClient";

export interface CustomBenefitItem {
  name: string;
  amount: number;
}

export interface PayrollProfileUpdate {
  base_salary?: number;
  thirteenth_salary?: number;
  vacation_provision?: number;
  fgts_amount?: number;
  inss_amount?: number;
  transport_voucher?: number;
  food_voucher?: number;
  meal_voucher?: number;
  health_insurance?: number;
  other_benefits?: number;
  other_benefits_description?: string;
  custom_benefits?: CustomBenefitItem[];
  notes?: string;
  is_active?: boolean;
}

export interface PayrollProfileResponse {
  id?: number;
  employee_id: number;
  employee_name: string;
  employee_role: string;
  employee_is_active: boolean;
  base_salary: number;
  thirteenth_salary: number;
  vacation_provision: number;
  fgts_amount: number;
  inss_amount: number;
  transport_voucher: number;
  food_voucher: number;
  meal_voucher: number;
  health_insurance: number;
  other_benefits: number;
  other_benefits_description?: string | null;
  custom_benefits?: CustomBenefitItem[];
  notes?: string | null;
  is_active: boolean;

  // Totais computados pelo backend
  total_salaries_and_provisions: number;
  total_inss: number;
  total_fgts: number;
  total_benefits: number;
  total_monthly_cost: number;
  overhead_percentage: number;
}

export interface PayrollSummaryResponse {
  total_base_salary: number;
  total_thirteenth: number;
  total_vacation: number;
  total_salaries_and_provisions: number;
  total_inss: number;
  total_fgts: number;
  total_charges?: number;
  total_transport_voucher: number;
  total_food_voucher: number;
  total_meal_voucher: number;
  total_health_insurance: number;
  total_other_benefits: number;
  total_benefits: number;
  total_monthly_cost: number;
  total_annual_cost: number;
  active_employees_count: number;
}

export interface PayrollSyncToDRERequest {
  year: number;
  months?: number[];
  account_mapping?: {
    salaries?: number;
    charges?: number;
    inss?: number;
    fgts?: number;
    benefits?: number;
  };
}

export interface PayrollSyncResponse {
  success: boolean;
  message: string;
  year: number;
  months_updated: number[];
  entries_created_or_updated: number;
  accounts_used: Record<
    string,
    {
      account_id: number;
      name: string;
      amount: number;
    }
  >;
}

// ── Funções de Cálculo Auxiliar Automático (Regras de Planilha do Usuário) ─────

/**
 * 13º Salário mensal provisionado: Salário Base / 12
 */
export const calculateThirteenth = (salary: number): number => {
  if (!salary || salary <= 0) return 0;
  return Number((salary / 12).toFixed(2));
};

/**
 * Férias + Terço Constitucional mensal provisionado:
 * Regra da planilha: (Salário * 1.30) / 12 ou (Salário * 1.3333) / 12
 */
export const calculateVacation = (salary: number, factor: number = 1.30): number => {
  if (!salary || salary <= 0) return 0;
  return Number(((salary * factor) / 12).toFixed(2));
};

/**
 * FGTS mensal provisionado: 8% do Salário Base
 */
export const calculateFGTS = (salary: number, rate: number = 0.08): number => {
  if (!salary || salary <= 0) return 0;
  return Number((salary * rate).toFixed(2));
};

/**
 * Tabela Oficial INSS Progressiva (Vigência 2026):
 * - Até R$ 1.621,00: 7,5%
 * - R$ 1.621,01 a R$ 2.902,84: 9% (dedução R$ 24,32)
 * - R$ 2.902,85 a R$ 4.354,27: 12% (dedução R$ 111,40)
 * - R$ 4.354,28 a R$ 8.475,55: 14% (dedução R$ 198,49)
 * - Acima de R$ 8.475,55: Teto máximo de R$ 988,09
 */
export const calculateINSSProgressive = (salary: number): number => {
  if (!salary || salary <= 0) return 0;
  const s = Number(salary);
  if (s <= 1621.0) {
    return Number((s * 0.075).toFixed(2));
  } else if (s <= 2902.84) {
    return Number((s * 0.09 - 24.32).toFixed(2));
  } else if (s <= 4354.27) {
    return Number((s * 0.12 - 111.40).toFixed(2));
  } else if (s <= 8475.55) {
    return Number((s * 0.14 - 198.49).toFixed(2));
  } else {
    return 988.09;
  }
};

/**
 * Alíquota direta de 12% (como no exemplo da planilha do proprietário para R$ 3.000 -> R$ 360)
 */
export const calculateINSSFlat12 = (salary: number): number => {
  if (!salary || salary <= 0) return 0;
  return Number((salary * 0.12).toFixed(2));
};

// ── Chamadas de API ─────────────────────────────────────────────────────────

export const getPayrollProfiles = async (): Promise<PayrollProfileResponse[]> => {
  const response = await apiClient.get<PayrollProfileResponse[]>("/api/v1/financial/payroll/profiles");
  return response.data;
};

export const updatePayrollProfile = async (
  employeeId: number,
  data: PayrollProfileUpdate
): Promise<PayrollProfileResponse> => {
  const response = await apiClient.put<PayrollProfileResponse>(
    `/api/v1/financial/payroll/profiles/${employeeId}`,
    data
  );
  return response.data;
};

export const getPayrollSummary = async (): Promise<PayrollSummaryResponse> => {
  const response = await apiClient.get<PayrollSummaryResponse>("/api/v1/financial/payroll/summary");
  return response.data;
};

export const syncPayrollToDRE = async (
  payload: PayrollSyncToDRERequest
): Promise<PayrollSyncResponse> => {
  const response = await apiClient.post<PayrollSyncResponse>(
    "/api/v1/financial/payroll/sync-to-dre",
    payload
  );
  return response.data;
};
