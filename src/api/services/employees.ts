import apiClient from "../apiClient";
import type { Employee, EmployeeFormData } from "../../features/employees/types";

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<Employee[]>("/api/v1/employees/");
  return response.data;
};

export const createEmployee = async (data: EmployeeFormData): Promise<Employee> => {
  const response = await apiClient.post<Employee>("/api/v1/employees/", data);
  return response.data;
};

export const updateEmployee = async (id: number, data: Partial<EmployeeFormData>): Promise<Employee> => {
  const response = await apiClient.patch<Employee>(`/api/v1/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/employees/${id}`);
};
