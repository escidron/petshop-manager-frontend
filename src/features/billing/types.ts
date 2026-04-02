export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "incomplete"
  | "past_due"
  | "canceled";

export interface Plan {
  id: number;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_cycle: string;
  trial_days: number;
  is_active: boolean;
}

export interface SubscriptionResponse {
  id: number;
  tenant_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  started_at: string;
  trial_ends_at: string | null;
  current_period_end: string;
  canceled_at: string | null;
  payment_method: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
}

/** Returned by POST /checkout for paid plans */
export interface CheckoutResponse {
  client_secret: string;
  stripe_subscription_id: string;
}

/** Returned by POST /checkout for FREE_TRIAL */
export interface FreeTrialResponse {
  status: "trialing";
  trial_ends_at: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface SetupIntentResponse {
  client_secret: string;
}
