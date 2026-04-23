import { useState, useCallback } from "react";
import { getEmployees as fetchEmployees } from "../api/services/employees";
import type { Employee } from "../features/employees/types";
import { useToast } from "./useToast";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const getEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch {
      toast.error("Erro ao carregar funcionários.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { employees, loading, getEmployees };
}
