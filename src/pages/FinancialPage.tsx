import { Box, Typography } from "@mui/material";
import { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../api/services/appointments";
import { listSales } from "../api/services/sales";
import FinancialSummaryCards from "../features/financial/FinancialSummaryCards";
import FinancialTable from "../features/financial/FinancialTable";
import type { FinancialSummary } from "../features/financial/types";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { SaleResponse } from "../features/sales/schemas";
import type { Appointment } from "../features/appointments/types";

dayjs.extend(isBetween);

export default function FinancialPage() {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf("day"));

  const { data: allAppointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["appointments", "financial", startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")],
    queryFn: () => getAppointmentsByTenant(
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
    ),
  });

  const { data: allSales = [], isLoading: isLoadingSales } = useQuery<SaleResponse[]>({
    queryKey: ["sales", startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")],
    queryFn: () => listSales(
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
    ),
  });

  const isLoading = isLoadingAppointments || isLoadingSales;

  const filteredTransactions = useMemo(() => {
    const saleRows = allSales
      .filter((s) => s.status === "completed")
      .map((s) => {
        const isPackageSale = s.items?.some((i) => i.item_type === "package");
        return {
          id: `sale-${s.id}`,
          date: s.created_at,
          client: s.client?.name || "Consumidor",
          type: s.appointment_id
            ? ("Agendamento" as const)
            : isPackageSale
              ? ("Venda Pacote" as const)
              : ("Venda PDV" as const),
          payment_method: s.payment_method,
          amount_cents: Math.round(s.total_amount * 100),
          original: s,
        };
      });

    return saleRows.sort((a, b) =>
      dayjs(b.date).diff(dayjs(a.date)),
    );
  }, [allSales]);

  const summary = useMemo<FinancialSummary>(() => {
    const totalRevenueCents = filteredTransactions.reduce(
      (acc, t) => acc + t.amount_cents,
      0,
    );

    const canceledAppointmentsCount = allAppointments.filter((a) => a.status === "canceled").length;
    const canceledSalesCount = allSales.filter((s) => s.status === "canceled").length;

    return {
      totalRevenueCents,
      completedCount: filteredTransactions.length,
      canceledCount: canceledAppointmentsCount + canceledSalesCount,
      averageTicketCents:
        filteredTransactions.length > 0
          ? totalRevenueCents / filteredTransactions.length
          : 0,
    };
  }, [filteredTransactions, allAppointments, allSales]);

  return (
    <Box sx={{ maxWidth: "1400px", mx: "auto", width: "100%", px: { xs: 2, md: 4 }, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <Typography variant="body1">Data Inicial</Typography>
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                dayOfWeekFormatter={(day: Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: { size: "small" },
                }}
              />
            </Box>
            <Box>
              <Typography variant="body1">Data Final</Typography>
              <DatePicker
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                dayOfWeekFormatter={(day: Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: { size: "small" },
                }}
              />
            </Box>
          </Box>
        </LocalizationProvider>
      </Box>

      <FinancialSummaryCards summary={summary} isLoading={isLoading} />

      <FinancialTable transactions={filteredTransactions} isLoading={isLoading} />
    </Box>
  );
}
