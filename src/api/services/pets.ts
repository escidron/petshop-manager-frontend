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

export interface ClientPetReportItem {
  pet_id: number;
  pet_name: string;
  species: string;
  species_label: string;
  breed?: string | null;
  gender?: string | null;
  gender_label: string;
  size?: string | null;
  coat_type?: string | null;
  coat_type_label?: string | null;
  coat_color?: string | null;
  is_neutered?: boolean | null;
  age?: number | null;
  age_unit?: string | null;
  age_unit_label?: string | null;
  birth_date?: string | null;
  is_active: boolean;
  is_deceased: boolean;
  notes?: string | null;
  client_id: number;
  client_name: string;
  client_phone?: string | null;
  client_phone_secondary?: string | null;
  last_service_date?: string | null;
  last_service_name?: string | null;
}

export interface ClientPetReportResponse {
  items: ClientPetReportItem[];
  total: number;
  total_active_pets: number;
  total_unique_clients: number;
}

export const fetchClientsPetsReport = async (params?: {
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ClientPetReportResponse> => {
  const queryParams: Record<string, any> = {};
  if (params?.is_active !== undefined) queryParams.is_active = params.is_active;
  if (params?.search) queryParams.search = params.search;
  if (params?.limit !== undefined) queryParams.limit = params.limit;
  if (params?.offset !== undefined) queryParams.offset = params.offset;

  const response = await apiClient.get<ClientPetReportResponse>(
    "/api/v1/pets/reports/clients-pets",
    { params: queryParams }
  );
  return response.data;
};

export const exportClientsPetsReport = async (params?: {
  is_active?: boolean;
  search?: string;
}): Promise<void> => {
  const queryParams: Record<string, any> = {};
  if (params?.is_active !== undefined) queryParams.is_active = params.is_active;
  if (params?.search) queryParams.search = params.search;

  const response = await apiClient.get("/api/v1/pets/reports/clients-pets/export", {
    params: queryParams,
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "relatorio_clientes_pets.xlsx");
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
