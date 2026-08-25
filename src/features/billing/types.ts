export interface BillingAddress {
  zip_code: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  country: string;
}

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
  eligible_for_refund?: boolean;

  // WhatsApp Add-on Package Tracking
  whatsapp_package_id?: string | null;
  whatsapp_package_status?: "inactive" | "pending_payment" | "active" | "canceled";
  whatsapp_messages_limit?: number;
  whatsapp_messages_used?: number;
  whatsapp_period_end?: string | null;
  pagarme_whatsapp_subscription_id?: string | null;
  billing_day?: number;
}

export interface ProrationPreviewResponse {
  package_code: string;
  package_name: string;
  monthly_price_cents: number;
  prorated_price_cents: number;
  prorated_messages?: number;
  total_messages?: number;
  billing_day: number;
  days_remaining: number;
  total_days_in_cycle: number;
  next_billing_date: string;
  is_prorated: boolean;
}

export interface HirePackagePayload {
  package_code: string;
  payment_method: "credit_card" | "pix";
  card_token?: string;
  card_id?: string;
  document?: string;
  billing_address?: {
    country: string;
    state: string;
    city: string;
    zip_code: string;
    line_1: string;
    line_2?: string;
  };
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
  card_brand?: string;
  card_last_four?: string;
  pix_qr_code: string | null;
  pix_qr_code_url: string | null;
  expires_at: string | null;
  created_at: string;
}

