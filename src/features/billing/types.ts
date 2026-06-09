export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "incomplete"
  | "pending"
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
  pagarme_subscription_id: string | null;
  plan: Plan;
}

/** Returned by POST /checkout for paid plans — card */
export interface CheckoutCardResponse {
  pagarme_subscription_id: string;
  status: string;
}

/** Returned by POST /checkout for paid plans — pix */
export interface CheckoutPixResponse {
  pagarme_subscription_id: string;
  status: string;
  pix_qr_code: string;
  pix_qr_code_url: string;
  expires_at: string;
}

/** Returned by POST /checkout for FREE_TRIAL */
export interface FreeTrialResponse {
  status: "trialing";
  trial_ends_at: string;
}

export type CheckoutResponse = CheckoutCardResponse | CheckoutPixResponse | FreeTrialResponse;

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface SubscriptionCharge {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  pix_qr_code: string | null;
  pix_qr_code_url: string | null;
  expires_at: string | null;
  created_at: string;
}

