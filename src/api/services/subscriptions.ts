import apiClient from "../apiClient";
import type {
  CheckoutResponse,
  FreeTrialResponse,
  PaymentMethod,
  SubscriptionResponse,
} from "../../features/billing/types";
import type { BillingAddress } from "../../features/billing/CheckoutForm";

export const createCheckout = async (
  planCode: string,
  paymentMethod: "credit_card" | "pix" = "credit_card",
  cardToken?: string,
  document?: string,
  billingAddress?: BillingAddress,
  startAt?: string,
) => {
  const response = await apiClient.post<CheckoutResponse | FreeTrialResponse>(
    "/api/v1/subscriptions/checkout",
    {
      plan_code: planCode,
      payment_method: paymentMethod,
      ...(cardToken ? { card_token: cardToken } : {}),
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
