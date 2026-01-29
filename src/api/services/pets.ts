import type { Pet } from "../../pages/PetsPage";
import apiClient from "../apiClient";

interface SavePetPayload extends Partial<Pet> {
  client_id: number;
  is_active?: boolean;
}
export type UpdatePetPayload = {
  name?: string;
  species?: "dog" | "cat" | "other";
  gender?: "male" | "female";
  breed?: string;
  age?: number;
  ageUnit?: "year" | "month" | "day";
};

const TENANT_PARAMS = { tenant_id: 1 };

export const fetchPets = async () => {
  const response = await apiClient.get<Pet[]>(
    "/api/v1/pets/",
    { params: TENANT_PARAMS }
  );
  return response.data;
};

export const fetchPetsByClient = async (clientId: number) => {
  const response = await apiClient.get<Pet[]>(
    `/api/v1/pets/client/${clientId}`,
    { params: { tenant_id: 1 } }
  );
  return response.data;
};

export const createPet = async (payload: SavePetPayload) => {
  const response = await apiClient.post<Pet>(
    "/api/v1/pets/",
    { ...payload, is_active: true },
    { params: { tenant_id: 1 } }
  );
  return response.data;
};

export const updatePet = async (petId: number, payload: UpdatePetPayload) => {
  const response = await apiClient.patch<Pet>(
    `/api/v1/pets/${petId}`,
    { ...payload },
    { params: { tenant_id: 1 } }
  );
  return response.data;
};

export const deletePet = async (petId: number) => {
  await apiClient.delete(`/api/v1/pets/${petId}`, {
    params: { tenant_id: 1 },
  });
};