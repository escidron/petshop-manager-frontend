import { useState, useCallback } from "react";
import { getSuppliers as fetchSuppliers } from "../api/services/suppliers";
import type { Supplier } from "../features/suppliers/types";
import { useToast } from "./useToast";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const getSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { suppliers, loading, getSuppliers };
}
