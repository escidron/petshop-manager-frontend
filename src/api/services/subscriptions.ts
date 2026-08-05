import apiClient from "../apiClient";
import type {
  CheckoutResponse,
  FreeTrialResponse,
  PaymentMethod,
  SubscriptionResponse,
  SubscriptionCharge,
} from "../../features/billing/types";
import type { BillingAddress } from "../../features/billing/CheckoutForm";

export const createCheckout = async (
  planCode: string,
  paymentMethod: "credit_card" | "pix" = "credit_card",
  cardToken?: string,
  document?: string,
  billingAddress?: BillingAddress,
  startAt?: string,
  cardId?: string,
) => {
  const response = await apiClient.post<CheckoutResponse | FreeTrialResponse>(
    "/api/v1/subscriptions/checkout",
    {
      plan_code: planCode,
      payment_method: paymentMethod,
      ...(cardToken ? { card_token: cardToken } : {}),
      ...(cardId ? { card_id: cardId } : {}),
      ...(document ? { document } : {}),
      ...(billingAddress ? { billing_address: billingAddress } : {}),
      ...(startAt ? { start_at: startAt } : {}),
    }
  );
  return response.data;
};

export const getMySubscription = async () => {
  const response = await apiClient.get<SubscriptionResponse>(
    "/api/v1/subscriptions/mine"
  );
  return response.data;
};

export const cancelSubscription = async () => {
  const response = await apiClient.post<SubscriptionResponse>(
    "/api/v1/subscriptions/cancel"
  );
  return response.data;
};

export const refundAndCancelSubscription = async () => {
  const response = await apiClient.post<SubscriptionResponse>(
    "/api/v1/subscriptions/refund-and-cancel"
  );
  return response.data;
};

export const addPaymentMethod = async (
  cardToken: string,
  billingAddress?: BillingAddress,
  document?: string,
) => {
  const response = await apiClient.post<PaymentMethod>(
    "/api/v1/subscriptions/payment-methods",
    {
      card_token: cardToken,
      ...(billingAddress ? { billing_address: billingAddress } : {}),
      ...(document ? { document } : {}),
    }
  );
  return response.data;
};

export const listPaymentMethods = async () => {
  const response = await apiClient.get<PaymentMethod[]>(
    "/api/v1/subscriptions/payment-methods"
  );
  return response.data;
};

export const removePaymentMethod = async (pmId: string) => {
  await apiClient.delete(`/api/v1/subscriptions/payment-methods/${pmId}`);
};

export const setDefaultPaymentMethod = async (pmId: string) => {
  await apiClient.post(`/api/v1/subscriptions/payment-methods/${pmId}/default`);
};

export const changeSubscriptionToPix = async () => {
  await apiClient.post(`/api/v1/subscriptions/change-to-pix`);
};

export const listCharges = async () => {
  const response = await apiClient.get<SubscriptionCharge[]>(
    "/api/v1/subscriptions/charges"
  );
  return response.data;
};

export const updateChargeCard = async (
  chargeId: string,
  cardToken: string,
  billingAddress?: BillingAddress,
  document?: string
) => {
  const response = await apiClient.patch<{ status: string }>(
    `/api/v1/subscriptions/charges/${chargeId}/card`,
    {
      card_token: cardToken,
      ...(billingAddress ? { billing_address: billingAddress } : {}),
      ...(document ? { document } : {}),
    }
  );
  return response.data;
};

export const retryCharge = async (chargeId: string) => {
  const response = await apiClient.post<{ status: string }>(
    `/api/v1/subscriptions/charges/${chargeId}/retry`
  );
  return response.data;
};

export const captureCharge = async (chargeId: string) => {
  const response = await apiClient.post<{ status: string }>(
    `/api/v1/subscriptions/charges/${chargeId}/capture`
  );
  return response.data;
};

export const cancelCharge = async (chargeId: string) => {
  const response = await apiClient.post<{ status: string }>(
    `/api/v1/subscriptions/charges/${chargeId}/cancel`
  );
  return response.data;
};

