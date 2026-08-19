import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waitingListService } from "../api/services/waiting_list";
import type { WaitingListStatus, WaitingListEntryUpdate } from "../features/appointments/waiting-list/types";
import { useToast } from "./useToast";

export function useWaitingListMutations() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const createMutation = useMutation({
    mutationFn: waitingListService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      success("Adicionado à lista de espera com sucesso!");
    },
    onError: () => {
      error("Erro ao adicionar à lista de espera.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WaitingListEntryUpdate }) => 
      waitingListService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: waitingListService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      success("Entrada removida com sucesso!");
    },
  });

  return {
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
  };
}

export function useWaitingList(
  status?: WaitingListStatus,
  options?: { enabled?: boolean }
) {
  const mutations = useWaitingListMutations();

  const query = useQuery({
    queryKey: ["waiting-list", status],
    queryFn: () => waitingListService.list(status),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });

  return {
    ...query,
    ...mutations,
  };
}

