import type { OnboardingStep } from "../../features/onboarding/types";
import type { Tenant, TenantFormData, WorkingHours } from "../../features/tenants/types";
import apiClient from "../apiClient";

export const createTenant = async (
    payload: TenantFormData,
    user_id: number,
    planCode: "MONTHLY" | "FREE_TRIAL"
) => {
    const response = await apiClient.post<TenantFormData>(
        "/api/v1/tenants/",
        { ...payload, is_active: true, plan_code: planCode },
        { params: { user_id: user_id } }
    );
    return response.data;
};

export const createMyNewTenant = async (
    payload: TenantFormData,
    planCode: "MONTHLY" | "FREE_TRIAL"
): Promise<Tenant> => {
    const response = await apiClient.post<Tenant>(
        "/api/v1/tenants/me/new",
        { ...payload, is_active: true, plan_code: planCode }
    );
    return response.data;
};

export const updateTenant = async (tenantId: number, payload: Partial<TenantFormData>) => {
    const response = await apiClient.patch(
        `/api/v1/tenants/${tenantId}`,
        payload,
    );
    return response.data;
};

export const updateTenantOnboardingStep = async ( step: OnboardingStep) => {
    const response = await apiClient.patch<string>(
        `/api/v1/onboarding/step`,
        { step },
    );
    return response.data;
};

export const updateWorkingHours = async (tenantId: number, workingHours: WorkingHours) => {
    const response = await apiClient.patch(`/api/v1/tenants/${tenantId}`, {
        working_hours: workingHours,
    });
    return response.data;
};

export const updateSubscription = async (tenantId: number, paymentMethod: "card" | "pix") => {
    const response = await apiClient.patch(
        `/api/v1/tenants/${tenantId}/subscription`,
        { payment_method: paymentMethod },
    );
    return response.data;
};

export const deleteAccount = async (password: string): Promise<void> => {
    await apiClient.delete("/api/v1/tenants/me", { data: { password } });
};