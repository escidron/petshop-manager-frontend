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

export const exportEmployees = async (): Promise<Blob> => {
  const response = await apiClient.get<Blob>("/api/v1/employees/export", {
    responseType: "blob",
  });
  return response.data;
};

export type PublicAppointmentService = {
  id: number;
  name: string;
  duration_minutes?: number | null;
};

export type PublicAppointmentPet = {
  id: number;
  name: string;
  species: string;
  breed?: string | null;
};

export type PublicAppointmentItem = {
  id: number;
  pet: PublicAppointmentPet;
  services: PublicAppointmentService[];
};

export type PublicAppointment = {
  id: number;
  scheduled_at: string;
  status: string;
  notes?: string | null;
  client_name: string;
  client_phone?: string | null;
  items: PublicAppointmentItem[];
};

export type PublicFreelancerSchedule = {
  employee_name: string;
  employee_role: string;
  petshop_name: string;
  appointments: PublicAppointment[];
};

export const getPublicSchedule = async (token: string): Promise<PublicFreelancerSchedule> => {
  const response = await apiClient.get<PublicFreelancerSchedule>(`/api/v1/public/employees/schedule/${token}`);
  return response.data;
};

export const regenerateEmployeeToken = async (id: number): Promise<Employee> => {
  const response = await apiClient.post<Employee>(`/api/v1/employees/${id}/regenerate-token`);
  return response.data;
};


