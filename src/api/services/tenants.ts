import type { OnboardingStep } from "../../features/onboarding/types";
import type { Tenant, TenantFormData, WorkingHours } from "../../features/tenants/types";
import apiClient from "../apiClient";

export const createTenant = async (
    payload: TenantFormData,
    user_id: number,
    planCode: "MONTHLY" | "FREE_TRIAL"
) => {
    const data = {
        ...payload,
        email: payload.email || null,
        document: payload.document || null,
        cep: payload.cep || null,
        street: payload.street || null,
        number: payload.number || null,
        complement: payload.complement || null,
        neighborhood: payload.neighborhood || null,
        city: payload.city || null,
        state: payload.state || null,
        is_active: true,
        plan_code: planCode,
    };
    const response = await apiClient.post<TenantFormData>(
        "/api/v1/tenants/",
        data,
        { params: { user_id: user_id } }
    );
    return response.data;
};

export const createMyNewTenant = async (
    payload: TenantFormData,
    planCode: "MONTHLY" | "FREE_TRIAL" = "FREE_TRIAL"
): Promise<Tenant> => {
    const data = {
        ...payload,
        email: payload.email || null,
        document: payload.document || null,
        cep: payload.cep || null,
        street: payload.street || null,
        number: payload.number || null,
        complement: payload.complement || null,
        neighborhood: payload.neighborhood || null,
        city: payload.city || null,
        state: payload.state || null,
        is_active: true,
        plan_code: planCode,
    };
    const response = await apiClient.post<Tenant>(
        "/api/v1/tenants/me/new",
        data
    );
    return response.data;
};

export const updateTenant = async (tenantId: number, payload: Partial<TenantFormData>) => {
    const data = {
        ...payload,
        email: payload.email === "" ? null : payload.email,
        document: payload.document === "" ? null : payload.document,
    };
    const response = await apiClient.patch(
        `/api/v1/tenants/${tenantId}`,
        data,
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

export const updateTenantPreferences = async (tenantId: number, preferences: Record<string, any>): Promise<Tenant> => {
    const response = await apiClient.patch<Tenant>(`/api/v1/tenants/${tenantId}`, {
        preferences,
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