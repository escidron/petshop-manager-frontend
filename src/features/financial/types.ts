export type FinancialPeriod = 'day' | 'week' | 'month' | 'custom';

export type FinancialSummary = {
  totalRevenueCents: number;
  completedCount: number;
  canceledCount: number;
  averageTicketCents: number;
};
