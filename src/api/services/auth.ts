import type { AuthResponse, SignupPayload } from "../../features/auth/types";
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