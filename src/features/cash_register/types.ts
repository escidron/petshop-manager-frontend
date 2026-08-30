export interface CashRegisterResponse {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CashMovementResponse {
  id: number;
  session_id: number;
  user_id: number | null;
  user_name: string | null;
  type: "opening" | "sale" | "sale_cancel" | "supply" | "bleed" | "closing";
  amount: number;
  balance_after: number;
  sale_id: number | null;
  destination_or_origin: string | null;
  description: string | null;
  created_at: string;
}

export interface CashSessionBrief {
  id: number;
  status: "open" | "closed";
  opened_at: string;
  opened_by_user_id: number | null;
  opened_by_name: string | null;
  initial_amount: number;
  closed_at: string | null;
  closed_by_user_id: number | null;
  closed_by_name: string | null;
  expected_closing_amount: number | null;
  actual_closing_amount: number | null;
  difference_amount: number | null;
  closing_notes: string | null;
}

export interface PaymentMethodSummary {
  method: string;
  label: string;
  total_amount: number;
  count: number;
}

export interface CashSessionDetailResponse {
  session: CashSessionBrief;
  cash_register: CashRegisterResponse;
  current_balance: number;
  total_sales_amount: number;
  payment_methods: PaymentMethodSummary[];
  total_supplies: number;
  total_bleeds: number;
  movements: CashMovementResponse[];
}

export interface CurrentCashStatusResponse {
  is_open: boolean;
  current_session: CashSessionDetailResponse | null;
  last_closed_session: CashSessionDetailResponse | null;
  suggested_opening_amount: number;
}

export interface CashOpenRequest {
  initial_amount: number;
  notes?: string | null;
  cash_register_id?: number | null;
}

export interface CashSupplyRequest {
  amount: number;
  origin?: string | null;
  description: string;
}

export interface CashBleedRequest {
  amount: number;
  destination?: string | null;
  description: string;
}

export interface CashCloseRequest {
  actual_closing_amount: number;
  closing_notes?: string | null;
}
