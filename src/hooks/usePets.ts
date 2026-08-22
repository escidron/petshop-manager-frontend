import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPets } from "../api/services/pets";
import type { Pet } from "../features/pets/types";

export const PETS_QUERY_KEY = ["pets"] as const;

export function usePets() {
  const queryClient = useQueryClient();

  const { data: pets = [], isLoading: loading } = useQuery<Pet[]>({
    queryKey: PETS_QUERY_KEY,
    queryFn: fetchPets,
    staleTime: 30_000, // 30s — evita refetch desnecessário ao trocar de aba
  });

  // Compatibilidade com chamadas existentes de getPets()
  const getPets = () => queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });

  return { pets, loading, getPets };
}
