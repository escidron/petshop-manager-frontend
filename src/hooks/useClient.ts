import { useCallback, useEffect, useState } from "react";
import { fetchPetsByClient } from "../api/services/pets";
import { fetchClientById } from "../api/services/clients";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";


export function useClient(initialClientId?: number) {
  const [clientId, setClientId] = useState<number | undefined>(
    initialClientId
  );
  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadedClientId, setLoadedClientId] = useState<number | undefined>(initialClientId);
  const [loading, setLoading] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      const data = await fetchClientById(clientId);
      setClient(data);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchPets = useCallback(async () => {
    if (!clientId) {
      setPets([]);
      setLoadedClientId(undefined);
      return
    };

    const data = await fetchPetsByClient(clientId);
    setPets(data);
    setLoadedClientId(clientId);
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    Promise.all([fetchClient(), fetchPets()]);
  }, [clientId, fetchClient, fetchPets]);

  return {
    client,
    pets,
    loading,
    loadedClientId,
    setPets,
    setClientId,   // 🔑 isso é o gatilho
    refetchPets: fetchPets,
    refetchClient: fetchClient,
  };
}
