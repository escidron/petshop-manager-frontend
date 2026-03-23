import apiClient from "../apiClient";
import type {
  ClientPackage,
  ClientPackageSellData,
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

export const deactivateClientPackage = async (
  clientPackageId: number,
): Promise<void> => {
  await apiClient.delete(`/api/v1/client-packages/${clientPackageId}`);
};
