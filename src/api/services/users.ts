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

export type TenantUserCreate = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type TenantUserResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export const listTenantUsers = async (): Promise<TenantUserResponse[]> => {
  const response = await apiClient.get<TenantUserResponse[]>("/api/v1/tenants/users");
  return response.data;
};

export const createTenantUser = async (
  payload: TenantUserCreate,
): Promise<TenantUserResponse> => {
  const response = await apiClient.post<TenantUserResponse>(
    "/api/v1/tenants/users",
    payload,
  );
  return response.data;
};

export const removeTenantUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/api/v1/tenants/users/${userId}`);
};