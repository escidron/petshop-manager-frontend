import type {
  FinancialBill,
  BillType,
  BillStatus,
  BillFilters,
  FinancialBillsSummary,
  FinancialBillCreate,
  FinancialBillUpdate,
  FinancialBillSettle,
} from "../../../api/services/financialBills";

export type {
  FinancialBill,
  BillType,
  BillStatus,
  BillFilters,
  FinancialBillsSummary,
  FinancialBillCreate,
  FinancialBillUpdate,
  FinancialBillSettle,
};

export interface BillFormValues {
  bill_type: BillType;
  description: string;
  amount: number;
  due_date: string;
  issue_date: string;
  category_id?: number | "";
  supplier_id?: number | "";
  client_id?: number | "";
  payment_method: string;
  document_number: string;
  barcode: string;
  notes: string;
  repeat: boolean;
  total_installments: number;
}
