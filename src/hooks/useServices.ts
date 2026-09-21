import { useQuery } from "@tanstack/react-query";
import { fetchServices } from "../api/services/tenant_services";
import type { Service } from "../features/tenant_services/types";

export function useServices() {
  const { data: services = [], isLoading: loading, refetch } = useQuery<Service[]>({
    queryKey: ["tenantServices"],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return { services, loading, getServices: refetch };
}
