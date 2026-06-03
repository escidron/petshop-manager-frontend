import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waitingListService } from "../api/services/waiting_list";
import type { WaitingListStatus, WaitingListEntryUpdate } from "../features/appointments/waiting-list/types";
import { useToast } from "./useToast";

export function useWaitingList(status?: WaitingListStatus) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const query = useQuery({
    queryKey: ["waiting-list", status],
    queryFn: () => waitingListService.list(status),
  });

  const createMutation = useMutation({
    mutationFn: waitingListService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: waitingListService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
      success("Entrada removida com sucesso!");
    },
  });

  return {
    ...query,
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
  };
}
