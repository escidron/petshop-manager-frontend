import api from "../apiClient";
import type { Appointment } from "../../features/appointments/types";
import type { ClientPackage } from "../../features/client_packages/types";
import type { WaitingListEntry } from "../../features/appointments/waiting-list/types";
import type { Package } from "../../features/packages/types";
import type { Comanda } from "../../features/sales/schemas";

export type DashboardStartupResponse = {
  appointments_today: Appointment[];
  highlighted_days: string[];
  open_invoices: {
    items: Appointment[];
    total: number;
  };
  unpaid_packages: {
    items: ClientPackage[];
    total: number;
  };
  packages_catalog: Package[];
  waiting_list_pending: WaitingListEntry[];
  open_comandas?: {
    items: Comanda[];
    total: number;
  };
  daily_revenue_cents?: number;
};

export async function getDashboardStartup(
  targetDate: string,
  startDate: string,
  endDate: string
): Promise<DashboardStartupResponse> {
  const params = new URLSearchParams({
    target_date: targetDate,
    start_date: startDate,
    end_date: endDate,
  });

  const response = await api.get<DashboardStartupResponse>(
    `/api/v1/dashboard/startup?${params.toString()}`
  );
  return response.data;
}

