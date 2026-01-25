import { useCallback, useEffect, useState } from "react";
import { fetchPetsByClient } from "../api/services/pets";
import { fetchClientById } from "../api/services/clients";
import type { Client, Pet } from "../pages/ClientsPage";

export function useClient(initialClientId?: number) {
  const [clientId, setClientId] = useState<number | undefined>(
    initialClientId
  );
  const [client, setClient] = useState<Client | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
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
    if (!clientId) return;

    const data = await fetchPetsByClient(clientId);
    setPets(data);
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    Promise.all([fetchClient(), fetchPets()]);
  }, [clientId, fetchClient, fetchPets]);

  return {
    client,
    pets,
    loading,
    setClientId,   // 🔑 isso é o gatilho
    refetchPets: fetchPets,
  };
}
