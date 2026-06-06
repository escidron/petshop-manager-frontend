import type { AuthResponse, SignupPayload } from "../../features/auth/types";
import type { AuthUser } from "./users";
import apiClient from "../apiClient";

export const signup = async (
  user: SignupPayload["user"],
  tenant: Omit<SignupPayload["tenant"], "plan_code">,
  planCode: "MONTHLY" | "FREE_TRIAL"
) => {
  const response = await apiClient.post<AuthResponse>(
    "/api/v1/auth/signup",
    {
      user,
      tenant: {
        ...tenant,
        plan_code: planCode,
      },
    }
  );

  return response.data;
};

export const selectTenant = async (
  selection_token: string,
  tenant_id: number
): Promise<AuthUser> => {
  const response = await apiClient.post<{ user: AuthUser }>(
    "/api/v1/auth/select-tenant",
    { selection_token, tenant_id }
  );
  return response.data.user;
};

export const switchTenant = async (tenant_id: number): Promise<AuthUser> => {
  const response = await apiClient.post<{ user: AuthUser }>(
    "/api/v1/auth/switch-tenant",
    { tenant_id }
  );
  return response.data.user;
};