import { createContext, useState, type ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "../../api/services/users";
import apiClient, { refreshSession } from "../../api/apiClient";
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
  checkAuth: () => Promise<void>;
  isSubscriptionActive: boolean;
  subscriptionStatus: string | null;
  isSubscriptionInGracePeriod: boolean;
  gracePeriodDaysLeft: number;
  isTrialing: boolean;
  trialDaysLeft: number | null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🧹 Limpa o cache do React Query apenas quando há uma TROCA real de tenant,
  // ou seja, quando passamos de um tenant válido para outro.
  // Isso evita cancelar as chamadas de inicialização (causando loading infinito).
  useEffect(() => {
    const prevTenant = sessionStorage.getItem("active_tenant_id");
    const currentTenant = tenant?.id?.toString();

    if (currentTenant && prevTenant && currentTenant !== prevTenant) {
      queryClient.resetQueries();
    }
    
    if (currentTenant) {
      sessionStorage.setItem("active_tenant_id", currentTenant);
    }
  }, [tenant?.id, queryClient]);

  const subscriptionStatus = tenant?.subscription?.status ?? null;

  const subscriptionInfo = (() => {
    if (tenant?.feature_flags?.free_access) {
      return {
        isActive: true,
        inGracePeriod: false,
        gracePeriodDaysLeft: 0,
        isTrial: false,
        trialDaysLeft: null,
      };
    }

    const sub = tenant?.subscription;
    if (!sub) {
      return {
        isActive: false,
        inGracePeriod: false,
        gracePeriodDaysLeft: 0,
        isTrial: false,
        trialDaysLeft: null,
      };
    }

    const now = new Date();
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    
    // Check if the plan is FREE_TRIAL (both code === 'FREE_TRIAL' or status === 'trialing')
    const isTrial = sub.plan?.code === "FREE_TRIAL" || sub.status === "trialing";
    
    if (isTrial) {
      if (!trialEnd) {
        return {
          isActive: false,
          inGracePeriod: false,
          gracePeriodDaysLeft: 0,
          isTrial: true,
          trialDaysLeft: 0,
        };
      }
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isActive = diffDays > 0;
      return {
        isActive,
        inGracePeriod: false,
        gracePeriodDaysLeft: 0,
        isTrial: true,
        trialDaysLeft: isActive ? diffDays : 0,
      };
    }

    // Standard subscription active check
    if (sub.status === "active") {
      if (periodEnd) {
        if (now <= periodEnd) {
          return {
            isActive: true,
            inGracePeriod: false,
            gracePeriodDaysLeft: 0,
            isTrial: false,
            trialDaysLeft: null,
          };
        } else {
          // If payment method is pix, we grant a 3-day grace period
          if (sub.payment_method === "pix") {
            const graceEnd = new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
            const diffTime = graceEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isActive = diffDays > 0;
            return {
              isActive,
              inGracePeriod: isActive,
              gracePeriodDaysLeft: isActive ? diffDays : 0,
              isTrial: false,
              trialDaysLeft: null,
            };
          } else {
            return {
              isActive: false,
              inGracePeriod: false,
              gracePeriodDaysLeft: 0,
              isTrial: false,
              trialDaysLeft: null,
            };
          }
        }
      }
      return {
        isActive: true,
        inGracePeriod: false,
        gracePeriodDaysLeft: 0,
        isTrial: false,
        trialDaysLeft: null,
      };
    }

    // Past due with grace period
    if (sub.status === "past_due") {
      if (periodEnd) {
        const graceEnd = new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
        const diffTime = graceEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isActive = diffDays > 0;
        return {
          isActive,
          inGracePeriod: isActive,
          gracePeriodDaysLeft: isActive ? diffDays : 0,
          isTrial: false,
          trialDaysLeft: null,
        };
      }
      return {
        isActive: false,
        inGracePeriod: false,
        gracePeriodDaysLeft: 0,
        isTrial: false,
        trialDaysLeft: null,
      };
    }

    return {
      isActive: false,
      inGracePeriod: false,
      gracePeriodDaysLeft: 0,
      isTrial: false,
      trialDaysLeft: null,
    };
  })();

  const isSubscriptionActive = subscriptionInfo.isActive;
  const isSubscriptionInGracePeriod = subscriptionInfo.inGracePeriod;
  const gracePeriodDaysLeft = subscriptionInfo.gracePeriodDaysLeft;
  const isTrialing = subscriptionInfo.isTrial;
  const trialDaysLeft = subscriptionInfo.trialDaysLeft;

  const checkAuth = async () => {
    setChecking(true);
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

      if (axiosErr.isAuthError || axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
        setUser(null);
        setTenant(null);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Keep-alive: renovação periódica silenciosa e ao focar na aba após inatividade
  useEffect(() => {
    if (!user) return;

    let lastRefresh = Date.now();

    // 1. Silent refresh a cada 30 minutos enquanto a aba estiver aberta
    const interval = setInterval(async () => {
      const ok = await refreshSession();
      if (ok) {
        lastRefresh = Date.now();
      }
    }, 30 * 60 * 1000);

    // 2. Ao voltar para a aba após deixá-la inativa por mais de 15 minutos
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastRefresh = Date.now() - lastRefresh;
        if (timeSinceLastRefresh > 15 * 60 * 1000) {
          const ok = await refreshSession();
          if (ok) {
            lastRefresh = Date.now();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const logout = async () => {
    setUser(null);
    setTenant(null);
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        checking,
        tenant,
        setTenant,
        checkAuth,
        isSubscriptionActive,
        subscriptionStatus,
        isSubscriptionInGracePeriod,
        gracePeriodDaysLeft,
        isTrialing,
        trialDaysLeft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
