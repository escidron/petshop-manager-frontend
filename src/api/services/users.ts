import type { User, UserForm } from "../../features/users/UserSignupForm";
import apiClient from "../apiClient";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  role: string;
  tenant_id: string;
  name: string;
  email: string;
};

export const createUser = async (
  payload: UserForm
) => {
  const response = await apiClient.post<User>(
    "/api/v1/users/",
    { ...payload, is_active: true },
  );
  return response.data;
};

export const login = async (
  payload: LoginPayload
) => {
  const response = await apiClient.post<{
    user: AuthUser;
  }>(
    "/api/v1/auth/login",
    payload
  );

  return response.data.user;
};

export const logout = async () => {
  await apiClient.post("/api/v1/auth/logout");
};