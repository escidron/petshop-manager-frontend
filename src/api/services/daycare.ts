import apiClient from "../apiClient";
import type {
  DaycareModality,
  DaycareModalityCreatePayload,
  DaycareModalityUpdatePayload,
  DaycareStay,
  DaycareStayAction,
  DaycareStayCreatePayload,
  DaycareStayUpdatePayload,
  DaycareTask,
  DaycareTaskCreatePayload,
  DaycareTaskUpdatePayload,
  PetHealthRecord,
  PetHealthRecordCreatePayload,
  DaycareReportData,
  DaycarePackage,
  DaycarePackageCreatePayload,
  DaycarePackageUpdatePayload,
} from "../../features/daycare/types";

export const listDaycareModalities = async (
  onlyActive = false
): Promise<DaycareModality[]> => {
  const response = await apiClient.get<DaycareModality[]>(
    "/api/v1/daycare/modalities",
    {
      params: { only_active: onlyActive },
    }
  );
  return response.data;
};

export const createDaycareModality = async (
  payload: DaycareModalityCreatePayload
): Promise<DaycareModality> => {
  const response = await apiClient.post<DaycareModality>(
    "/api/v1/daycare/modalities",
    payload
  );
  return response.data;
};

export const updateDaycareModality = async (
  modalityId: number,
  payload: DaycareModalityUpdatePayload
): Promise<DaycareModality> => {
  const response = await apiClient.put<DaycareModality>(
    `/api/v1/daycare/modalities/${modalityId}`,
    payload
  );
  return response.data;
};

export const deleteDaycareModality = async (
  modalityId: number
): Promise<void> => {
  await apiClient.delete(`/api/v1/daycare/modalities/${modalityId}`);
};

export const createDaycareStay = async (
  payload: DaycareStayCreatePayload
): Promise<DaycareStay> => {
  const response = await apiClient.post<DaycareStay>("/api/v1/daycare/", payload);
  return response.data;
};

export const listDaycareStaysByDay = async (
  day: string
): Promise<DaycareStay[]> => {
  const response = await apiClient.get<DaycareStay[]>(`/api/v1/daycare/day/${day}`);
  return response.data;
};

export const listDaycareHighlightedDays = async (
  startDate?: string,
  endDate?: string
): Promise<string[]> => {
  const response = await apiClient.get<string[]>("/api/v1/daycare/highlighted-days", {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const updateDaycareStay = async (
  stayId: number,
  payload: DaycareStayUpdatePayload
): Promise<DaycareStay> => {
  const response = await apiClient.put<DaycareStay>(
    `/api/v1/daycare/${stayId}`,
    payload
  );
  return response.data;
};

export const deleteDaycareStay = async (stayId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/daycare/${stayId}`);
};

export const applyDaycareStayAction = async (
  stayId: number,
  action: DaycareStayAction,
  notes?: string
): Promise<DaycareStay> => {
  const response = await apiClient.post<DaycareStay>(
    `/api/v1/daycare/${stayId}/action`,
    { action, notes }
  );
  return response.data;
};

export const addDaycareTask = async (
  stayId: number,
  payload: DaycareTaskCreatePayload
): Promise<DaycareTask> => {
  const response = await apiClient.post<DaycareTask>(
    `/api/v1/daycare/${stayId}/tasks`,
    payload
  );
  return response.data;
};

export const updateDaycareTask = async (
  taskId: number,
  payload: DaycareTaskUpdatePayload
): Promise<DaycareTask> => {
  const response = await apiClient.patch<DaycareTask>(
    `/api/v1/daycare/tasks/${taskId}`,
    payload
  );
  return response.data;
};

export const deleteDaycareTask = async (taskId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/daycare/tasks/${taskId}`);
};

export const createPetHealthRecord = async (
  payload: PetHealthRecordCreatePayload
): Promise<PetHealthRecord> => {
  const response = await apiClient.post<PetHealthRecord>(
    "/api/v1/daycare/health-records",
    payload
  );
  return response.data;
};

export const listPetHealthRecords = async (
  petId: number
): Promise<PetHealthRecord[]> => {
  const response = await apiClient.get<PetHealthRecord[]>(
    `/api/v1/daycare/health-records/pet/${petId}`
  );
  return response.data;
};

export const deletePetHealthRecord = async (
  recordId: number
): Promise<void> => {
  await apiClient.delete(`/api/v1/daycare/health-records/${recordId}`);
};

export const updateDaycareStayReport = async (
  stayId: number,
  reportData: DaycareReportData
): Promise<DaycareStay> => {
  const response = await apiClient.patch<DaycareStay>(
    `/api/v1/daycare/${stayId}/report`,
    { report_data: reportData }
  );
  return response.data;
};

export const listDaycarePackages = async (
  onlyActive = false
): Promise<DaycarePackage[]> => {
  const response = await apiClient.get<DaycarePackage[]>(
    "/api/v1/daycare/packages",
    {
      params: { only_active: onlyActive },
    }
  );
  return response.data;
};

export const createDaycarePackage = async (
  payload: DaycarePackageCreatePayload
): Promise<DaycarePackage> => {
  const response = await apiClient.post<DaycarePackage>(
    "/api/v1/daycare/packages",
    payload
  );
  return response.data;
};

export const updateDaycarePackage = async (
  packageId: number,
  payload: DaycarePackageUpdatePayload
): Promise<DaycarePackage> => {
  const response = await apiClient.put<DaycarePackage>(
    `/api/v1/daycare/packages/${packageId}`,
    payload
  );
  return response.data;
};

export const deleteDaycarePackage = async (
  packageId: number
): Promise<void> => {
  await apiClient.delete(`/api/v1/daycare/packages/${packageId}`);
};

