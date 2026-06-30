import type { Pet, PetPhoto } from "../../features/pets/types";
import apiClient from "../apiClient";

interface SavePetPayload extends Partial<Pet> {
  client_id: number;
  is_active: boolean;
}

export const fetchPets = async () => {
  const response = await apiClient.get<Pet[]>(
    "/api/v1/pets/",
  );
  return response.data;
};

export const fetchPetsByClient = async (clientId: number) => {
  const response = await apiClient.get<Pet[]>(
    `/api/v1/pets/client/${clientId}`,
  );
  return response.data;
};

export const createPet = async (payload: SavePetPayload) => {
  const response = await apiClient.post<Pet>(
    "/api/v1/pets/",
    { ...payload, is_active: true },
  );
  return response.data;
};

export const updatePet = async (petId: number, payload: Partial<Pet>
) => {
  const response = await apiClient.patch<Pet>(
    `/api/v1/pets/${petId}`,
    { ...payload },
  );
  return response.data;
};

export const deletePet = async (petId: number) => {
  await apiClient.delete(`/api/v1/pets/${petId}`, {
  });
};

export const uploadPetPhoto = async (
  petId: number,
  file: File,
  isProfile: boolean = false,
  category: string = "general"
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_profile", String(isProfile));
  formData.append("category", category);

  const response = await apiClient.post<PetPhoto>(
    `/api/v1/pets/${petId}/photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    }
  );
  return response.data;
};

export const deletePetPhoto = async (petId: number, photoId: number) => {
  await apiClient.delete(`/api/v1/pets/${petId}/photos/${photoId}`);
};

export const setProfilePhoto = async (petId: number, photoId: number) => {
  const response = await apiClient.patch<PetPhoto>(
    `/api/v1/pets/${petId}/photos/${photoId}/set-profile`
  );
  return response.data;
};
