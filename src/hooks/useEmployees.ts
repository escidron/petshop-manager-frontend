import { useQuery } from "@tanstack/react-query";
import { getEmployees as fetchEmployees } from "../api/services/employees";
import type { Employee } from "../features/employees/types";

export function useEmployees() {
  const { data: employees = [], isLoading: loading, refetch } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 120,   // 2 horas
  });

  return { employees, loading, getEmployees: refetch };
}
