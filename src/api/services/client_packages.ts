import apiClient from "../apiClient";
import type {
  ClientPackage,
  ClientPackageSellData,
  ClientPackageUsage,
} from "../../features/client_packages/types";

export const sellPackageToPet = async (
  payload: ClientPackageSellData,
): Promise<ClientPackage> => {
  const response = await apiClient.post<ClientPackage>(
    "/api/v1/client-packages/",
    payload,
  );
  return response.data;
};

export const listClientPackagesByPet = async (
  petId: number,
): Promise<ClientPackage[]> => {
  const response = await apiClient.get<ClientPackage[]>(
    `/api/v1/client-packages/pet/${petId}`,
  );
  return response.data;
};

export const listClientPackagesByClient = async (
  clientId: number,
): Promise<ClientPackage[]> => {
  const response = await apiClient.get<ClientPackage[]>(
    `/api/v1/client-packages/client/${clientId}`,
  );
  return response.data;
};

export const listUnpaidPackages = async (): Promise<ClientPackage[]> => {
  const response = await apiClient.get<ClientPackage[]>("/api/v1/client-packages/unpaid");
  return response.data;
};

export const deactivateClientPackage = async (
  clientPackageId: number,
): Promise<void> => {
  await apiClient.delete(`/api/v1/client-packages/${clientPackageId}`);
};

export const consumeClientPackageCredit = async (
  creditId: number,
  notes?: string
): Promise<void> => {
  await apiClient.post(`/api/v1/client-packages/credits/${creditId}/consume`, { notes });
};

export const revertClientPackageCredit = async (
  creditId: number,
): Promise<void> => {
  await apiClient.post(`/api/v1/client-packages/credits/${creditId}/revert`);
};

export const getClientPackageUsages = async (
  clientPackageId: number,
): Promise<ClientPackageUsage[]> => {
  const response = await apiClient.get<ClientPackageUsage[]>(
    `/api/v1/client-packages/${clientPackageId}/usages`,
  );
  return response.data;
};

export const transferClientPackage = async (
  clientPackageId: number,
  newPetId: number,
): Promise<ClientPackage> => {
  const response = await apiClient.patch<ClientPackage>(
    `/api/v1/client-packages/${clientPackageId}/transfer/${newPetId}`,
  );
  return response.data;
};

