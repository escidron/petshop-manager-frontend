import { createContext, useState, type ReactNode, useEffect } from "react";
import type { AuthUser } from "../../api/services/users";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { Tenant } from "../tenants/types";

type AuthContextType = {
  user: AuthUser | null;
  tenant: Tenant | null;
  setUser: (user: AuthUser | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  logout: () => void;
  checking: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [checking, setChecking] = useState(true); // 🔹 novo estado
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get("/api/v1/auth/me");
        setUser(response.data.user);
        setTenant(response.data.tenant);
      } catch (err) {
        const axiosErr = err as AxiosError & { isAuthError?: boolean };
        console.log(
          "Authentication failed:",
          axiosErr.response?.status,
          "isAuthError:",
          axiosErr.isAuthError,
        );

        if (axiosErr.isAuthError || axiosErr.response?.status === 401) {
          setUser(null);
        }
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const logout = async () => {
    setUser(null);
    await apiClient.post("/api/v1/auth/logout");
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, checking, tenant, setTenant }}
    >
      {children}
    </AuthContext.Provider>
  );
};
