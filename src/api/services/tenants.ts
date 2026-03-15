import type { OnboardingStep } from "../../features/onboarding/types";
import type { TenantFormData } from "../../features/tenants/types";
import apiClient from "../apiClient";

export const createTenant = async (
    payload: TenantFormData,
    user_id:number,
    planCode: "MONTHLY" | "FREE_TRIAL" 
) => {
    const response = await apiClient.post<TenantFormData>(
        "/api/v1/tenants/",
        { ...payload, is_active: true, plan_code: planCode },
        { params: { user_id: user_id } }

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

export const updateSubscription = async (tenantId: number, paymentMethod: "card" | "pix") => {
    const response = await apiClient.patch(
        `/api/v1/tenants/${tenantId}/subscription`,
        { payment_method: paymentMethod },
    );
    return response.data;
};