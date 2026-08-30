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

export const getCurrentCashStatus = async (): Promise<CurrentCashStatusResponse> => {
  const response = await apiClient.get<CurrentCashStatusResponse>("/api/v1/cash/current");
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
  skip: number = 0,
  limit: number = 50
): Promise<CashSessionDetailResponse[]> => {
  const response = await apiClient.get<CashSessionDetailResponse[]>("/api/v1/cash/sessions", {
    params: {
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
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

export const listCashRegisters = async (): Promise<CashRegisterResponse[]> => {
  const response = await apiClient.get<CashRegisterResponse[]>("/api/v1/cash/registers");
  return response.data;
};
