import type { User, UserFormData as UserForm } from "../../features/users/types";
import type { TenantOption } from "../../features/tenants/types";
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
  email_verified: boolean;
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

export type LoginResponse =
  | { needs_tenant_selection: false; user: AuthUser }
  | { needs_tenant_selection: true; selection_token: string; tenants: TenantOption[] };

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<
    { user: AuthUser } | { needs_tenant_selection: true; selection_token: string; tenants: TenantOption[] }
  >("/api/v1/auth/login", payload);

  const data = response.data;
  if ("needs_tenant_selection" in data && data.needs_tenant_selection) {
    return data as { needs_tenant_selection: true; selection_token: string; tenants: TenantOption[] };
  }
  return { needs_tenant_selection: false, user: (data as { user: AuthUser }).user };
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

export const changePassword = async (payload: {
  current_password: string;
  new_password: string;
}): Promise<void> => {
  await apiClient.patch("/api/v1/users/me/password", payload);
};

export const forgotPassword = async (email: string) => {
  await apiClient.post("/api/v1/auth/forgot-password", { email });
};

export const verifyOtp = async (email: string, otp_code: string) => {
  await apiClient.post("/api/v1/auth/verify-otp", { email, otp_code });
};

export const resetPassword = async (payload: {
  email: string;
  otp_code: string;
  new_password: string;
}) => {
  await apiClient.post("/api/v1/auth/reset-password", payload);
};

export const verifyEmail = async (otp_code: string): Promise<void> => {
  await apiClient.post("/api/v1/auth/verify-email", { otp_code });
};

export const resendVerificationEmail = async (): Promise<void> => {
  await apiClient.post("/api/v1/auth/resend-verification");
};

export const updateProfile = async (payload: {
  name?: string;
  email?: string;
  phone?: string;
}): Promise<AuthUser> => {
  const response = await apiClient.patch<AuthUser>("/api/v1/users/me", payload);
  return response.data;
};

export const exportUsers = async (): Promise<Blob> => {
  const response = await apiClient.get<Blob>("/api/v1/users/export", {
    responseType: "blob",
  });
  return response.data;
};
