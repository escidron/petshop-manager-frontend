import apiClient from "../apiClient";
import type {
  CheckoutResponse,
  FreeTrialResponse,
  PaymentMethod,
  SetupIntentResponse,
  SubscriptionResponse,
} from "../../features/billing/types";

export const createCheckout = async (planCode: string) => {
  const response = await apiClient.post<CheckoutResponse | FreeTrialResponse>(
    "/api/v1/subscriptions/checkout",
    { plan_code: planCode }
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

export const listPaymentMethods = async () => {
  const response = await apiClient.get<PaymentMethod[]>(
    "/api/v1/subscriptions/payment-methods"
  );
  return response.data;
};

export const createSetupIntent = async () => {
  const response = await apiClient.post<SetupIntentResponse>(
    "/api/v1/subscriptions/payment-methods/setup"
  );
  return response.data;
};
