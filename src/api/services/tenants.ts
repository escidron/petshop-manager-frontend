import type { TenantForm } from "../../features/tenants/TenantForm";
import apiClient from "../apiClient";

export const createTenant = async (
    payload: TenantForm,
    user_id:number
) => {
    const response = await apiClient.post<TenantForm>(
        "/api/v1/tenants/",
        { ...payload, is_active: true },
        { params: { user_id: user_id } }

    );
    return response.data;
};