import { useQuery } from "@tanstack/react-query";
import { fetchServices } from "../api/services/tenant_services";
import type { Service } from "../features/tenant_services/types";

export function useServices(options?: { enabled?: boolean }) {
  const { data: services = [], isLoading: loading, refetch } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 120,   // 2 horas
    enabled: options?.enabled ?? true,
  });

  return { services, loading, getServices: refetch };
}
