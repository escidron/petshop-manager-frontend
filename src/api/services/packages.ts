import apiClient from "../apiClient";
import type { Package, PackageFormData } from "../../features/packages/types";

export const createPackage = async (payload: PackageFormData): Promise<Package> => {
  const response = await apiClient.post<Package>("/api/v1/packages/", payload);
  return response.data;
};

export const listPackages = async (): Promise<Package[]> => {
  const response = await apiClient.get<Package[]>("/api/v1/packages/");
  return response.data;
};

export const getPackage = async (packageId: number): Promise<Package> => {
  const response = await apiClient.get<Package>(`/api/v1/packages/${packageId}`);
  return response.data;
};

export const updatePackage = async (
  packageId: number,
  payload: Partial<PackageFormData>
): Promise<Package> => {
  const response = await apiClient.patch<Package>(`/api/v1/packages/${packageId}`, payload);
  return response.data;
};

export const deletePackage = async (packageId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/packages/${packageId}`);
};

export const exportPackages = async (): Promise<Blob> => {
  const response = await apiClient.get<Blob>("/api/v1/packages/export", {
    responseType: "blob",
  });
  return response.data;
};
