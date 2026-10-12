import { useCallback } from "react";
import { useAuth } from "./useAuth";

export type SystemModuleId =
  | "dashboard"
  | "clients"
  | "pets"
  | "services"
  | "products"
  | "packages"
  | "suppliers"
  | "employees"
  | "pos"
  | "inventory"
  | "commissions"
  | "reports"
  | "dre"
  | "operational-result"
  | "financial-bills"
  | "settings";

export const DEFAULT_EMPLOYEE_PERMISSIONS: SystemModuleId[] = [
  "dashboard",
  "clients",
  "pets",
  "services",
  "products",
  "packages",
  "pos",
  "inventory",
];

export const SYSTEM_MODULES: {
  id: SystemModuleId;
  label: string;
  section: "INÍCIO" | "CADASTROS" | "OPERACIONAL" | "GERENCIAL" | "SISTEMA";
  path: string;
}[] = [
  { id: "dashboard", label: "Início", section: "INÍCIO", path: "/dashboard" },
  { id: "clients", label: "Clientes", section: "CADASTROS", path: "/registration/clients" },
  { id: "pets", label: "Pets", section: "CADASTROS", path: "/registration/pets" },
  { id: "services", label: "Serviços", section: "CADASTROS", path: "/registration/services" },
  { id: "products", label: "Produtos", section: "CADASTROS", path: "/registration/products" },
  { id: "packages", label: "Pacotes", section: "CADASTROS", path: "/registration/packages" },
  { id: "suppliers", label: "Fornecedores", section: "CADASTROS", path: "/registration/suppliers" },
  { id: "employees", label: "Funcionários", section: "CADASTROS", path: "/registration/employees" },
  { id: "pos", label: "Caixa", section: "OPERACIONAL", path: "/pos" },
  { id: "inventory", label: "Estoque", section: "OPERACIONAL", path: "/inventory" },
  { id: "commissions", label: "Comissão", section: "OPERACIONAL", path: "/commissions/rules" },
  { id: "reports", label: "Relatórios", section: "OPERACIONAL", path: "/reports" },
  { id: "dre", label: "DRE", section: "GERENCIAL", path: "/managerial/dre" },
  { id: "operational-result", label: "Resultado Operacional", section: "GERENCIAL", path: "/managerial/operational-result" },
  { id: "financial-bills", label: "Contas a Pagar e Receber", section: "GERENCIAL", path: "/managerial/bills" },
  { id: "settings", label: "Configurações", section: "SISTEMA", path: "/settings" },
];

export const usePermission = () => {
  const { user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin";

  const hasPermission = useCallback(
    (moduleId?: string): boolean => {
      if (!moduleId) return true;
      if (isOwner) return true;
      if (!user) return false;
      if (Array.isArray(user.permissions)) {
        return user.permissions.includes(moduleId);
      }
      // Default fallback for legacy employee records
      return (DEFAULT_EMPLOYEE_PERMISSIONS as string[]).includes(moduleId);
    },
    [isOwner, user]
  );

  return {
    isOwner,
    hasPermission,
    canAccessBilling: isOwner,
    canManageUsers: isOwner,
  };
};

