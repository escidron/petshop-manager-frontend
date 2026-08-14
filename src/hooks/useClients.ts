import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClients } from "../api/services/clients";
import type { Client } from "../features/clients/types";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: loading } = useQuery<Client[]>({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: fetchClients,
    staleTime: 30_000, // 30s — evita refetch desnecessário ao trocar de aba
  });

  // Compatibilidade com chamadas existentes de getClients()
  const getClients = () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });

  return { clients, loading, getClients };
}
