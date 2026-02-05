import type { User, UserForm } from "../../features/users/UserSignupForm";
import apiClient from "../apiClient";

export const createUser = async (
  payload: UserForm
) => {
  const response = await apiClient.post<User>(
    "/api/v1/users/",
    { ...payload, is_active: true },
  );
  return response.data;
};