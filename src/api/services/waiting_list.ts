import apiClient from "../apiClient";
import type { 
  WaitingListEntry, 
  WaitingListEntryCreate, 
  WaitingListEntryUpdate,
  WaitingListStatus
} from "../../features/appointments/waiting-list/types";

export const waitingListService = {
  list: async (status?: WaitingListStatus): Promise<WaitingListEntry[]> => {
    const response = await apiClient.get("/api/v1/waiting-list/", {
      params: { status }
    });
    return response.data;
  },

  create: async (data: WaitingListEntryCreate): Promise<WaitingListEntry> => {
    const response = await apiClient.post("/api/v1/waiting-list/", data);
    return response.data;
  },

  update: async (id: number, data: WaitingListEntryUpdate): Promise<WaitingListEntry> => {
    const response = await apiClient.patch(`/api/v1/waiting-list/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/waiting-list/${id}`);
  },
};
