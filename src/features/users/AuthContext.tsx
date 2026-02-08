import { createContext, useState, type ReactNode, useEffect } from "react";
import type { AuthUser } from "../../api/services/users";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";

type AuthContextType = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  checking: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true); // 🔹 novo estado
  const navigate = useNavigate();
  console.log("User:", user);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const response = await apiClient.get("/api/v1/auth/me");
        console.log("User authenticated:", response.data.user);
        setUser(response.data.user);
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
          // navigate("/login", { replace: true });
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
    <AuthContext.Provider value={{ user, setUser, logout, checking }}>
      {children}
    </AuthContext.Provider>
  );
};
