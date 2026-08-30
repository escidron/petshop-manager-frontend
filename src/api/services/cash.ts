import apiClient from "../apiClient";
import type {
  CurrentCashStatusResponse,
  CashSessionDetailResponse,
  CashOpenRequest,
  CashSupplyRequest,
  CashBleedRequest,
  CashCloseRequest,
  CashRegisterResponse,
} from "../../features/cash_register/types";

export const getCurrentCashStatus = async (
  cashRegisterId?: number | null
): Promise<CurrentCashStatusResponse> => {
  const response = await apiClient.get<CurrentCashStatusResponse>("/api/v1/cash/current", {
    params: cashRegisterId ? { cash_register_id: cashRegisterId } : undefined,
  });
  return response.data;
};

export const openCashSession = async (data: CashOpenRequest): Promise<CashSessionDetailResponse> => {
  const response = await apiClient.post<CashSessionDetailResponse>("/api/v1/cash/open", data);
  return response.data;
};

export const addCashSupply = async (data: CashSupplyRequest): Promise<CashSessionDetailResponse> => {
  const response = await apiClient.post<CashSessionDetailResponse>("/api/v1/cash/supply", data);
  return response.data;
};

export const addCashBleed = async (data: CashBleedRequest): Promise<CashSessionDetailResponse> => {
  const response = await apiClient.post<CashSessionDetailResponse>("/api/v1/cash/bleed", data);
  return response.data;
};

export const closeCashSession = async (data: CashCloseRequest): Promise<CashSessionDetailResponse> => {
  const response = await apiClient.post<CashSessionDetailResponse>("/api/v1/cash/close", data);
  return response.data;
};

export const listCashSessions = async (
  startDate?: string,
  endDate?: string,
  cashRegisterId?: number | null,
  skip: number = 0,
  limit: number = 50
): Promise<CashSessionDetailResponse[]> => {
  const response = await apiClient.get<CashSessionDetailResponse[]>("/api/v1/cash/sessions", {
    params: {
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(cashRegisterId && { cash_register_id: cashRegisterId }),
      skip,
      limit,
    },
  });
  return response.data;
};

export const getCashSession = async (sessionId: number): Promise<CashSessionDetailResponse> => {
  const response = await apiClient.get<CashSessionDetailResponse>(`/api/v1/cash/sessions/${sessionId}`);
  return response.data;
};

export const listCashRegisters = async (includeInactive: boolean = false): Promise<CashRegisterResponse[]> => {
  const response = await apiClient.get<CashRegisterResponse[]>("/api/v1/cash/registers", {
    params: { include_inactive: includeInactive },
  });
  return response.data;
};

export const createCashRegister = async (data: { name: string }): Promise<CashRegisterResponse> => {
  const response = await apiClient.post<CashRegisterResponse>("/api/v1/cash/registers", data);
  return response.data;
};

export const updateCashRegister = async (
  registerId: number,
  data: { name?: string; is_active?: boolean }
): Promise<CashRegisterResponse> => {
  const response = await apiClient.put<CashRegisterResponse>(`/api/v1/cash/registers/${registerId}`, data);
  return response.data;
};

export const listCashDestinationAccounts = async (
  includeInactive: boolean = false
): Promise<import("../../features/cash_register/types").CashDestinationAccountResponse[]> => {
  const response = await apiClient.get<import("../../features/cash_register/types").CashDestinationAccountResponse[]>(
    "/api/v1/cash/destination-accounts",
    { params: { include_inactive: includeInactive } }
  );
  return response.data;
};

export const createCashDestinationAccount = async (
  data: import("../../features/cash_register/types").CashDestinationAccountCreateRequest
): Promise<import("../../features/cash_register/types").CashDestinationAccountResponse> => {
  const response = await apiClient.post<import("../../features/cash_register/types").CashDestinationAccountResponse>(
    "/api/v1/cash/destination-accounts",
    data
  );
  return response.data;
};

export const updateCashDestinationAccount = async (
  accountId: number,
  data: import("../../features/cash_register/types").CashDestinationAccountUpdateRequest
): Promise<import("../../features/cash_register/types").CashDestinationAccountResponse> => {
  const response = await apiClient.put<import("../../features/cash_register/types").CashDestinationAccountResponse>(
    `/api/v1/cash/destination-accounts/${accountId}`,
    data
  );
  return response.data;
};

export const deleteCashDestinationAccount = async (accountId: number): Promise<{ detail: string }> => {
  const response = await apiClient.delete<{ detail: string }>(`/api/v1/cash/destination-accounts/${accountId}`);
  return response.data;
};
