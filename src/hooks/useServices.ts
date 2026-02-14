import { useCallback, useEffect, useState } from "react"
import { fetchServices } from "../api/services/tenant_services"
import type { Service } from "../features/tenant_services/types"

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const loadServices = useCallback(async () => {
    setLoading(true)
    try {
      setServices(await fetchServices())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  return { services, loading, getServices: loadServices }
}
