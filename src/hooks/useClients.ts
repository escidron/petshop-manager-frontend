import { useCallback, useEffect, useState } from "react"
import { fetchClients } from "../api/services/clients"
import type { Client } from "../pages/ClientsPage"

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      setClients(await fetchClients())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  return { clients, loading, getClients: loadClients }
}
