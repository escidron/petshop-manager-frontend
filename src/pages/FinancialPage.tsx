import { Box, Typography } from "@mui/material";
import { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../api/services/appointments";
import { listSales } from "../api/services/sales";
import FinancialSummaryCards from "../features/financial/FinancialSummaryCards";
import FinancialTable from "../features/financial/FinancialTable";
import { getAppointmentTotal } from "../utils/getAppointmentTotalPrice";
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
    const appointmentRows = allAppointments
      .filter((a) => a.status === "completed" && !a.is_paid)
      .map((a) => ({
        id: `apt-${a.id}`,
        date: a.scheduled_at,
        client: a.client.name,
        type: a.is_fully_package_covered
          ? ("Pago via Pacote" as const)
          : ("Agendamento" as const),
        amount_cents: getAppointmentTotal(a),
        payment_method: a.is_fully_package_covered ? "Pacote" : "Pendente",
        original: a,
      }));

    const saleRows = allSales
      .filter((s) => s.status === "completed")
      .map((s) => ({
        id: `sale-${s.id}`,
        date: s.created_at,
        client: s.client?.name || "Consumidor",
        type: s.appointment_id
          ? ("Agendamento" as const)
          : ("Venda PDV" as const),
        payment_method: s.payment_method,
        amount_cents: Math.round(s.total_amount * 100),
        original: s,
      }));

    return [...appointmentRows, ...saleRows].sort((a, b) =>
      dayjs(b.date).diff(dayjs(a.date)),
    );
  }, [allAppointments, allSales]);

  const summary = useMemo<FinancialSummary>(() => {
    // "Pago via Pacote" não entra na receita — a receita já foi capturada na venda do pacote
    const revenueTransactions = filteredTransactions.filter(
      (t) => t.type !== "Pago via Pacote",
    );
    const totalRevenueCents = revenueTransactions.reduce(
      (acc, t) => acc + t.amount_cents,
      0,
    );

    return {
      totalRevenueCents,
      completedCount: revenueTransactions.length,
      canceledCount: 0,
      averageTicketCents:
        revenueTransactions.length > 0
          ? totalRevenueCents / revenueTransactions.length
          : 0,
    };
  }, [filteredTransactions]);

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", py: 4 }}>
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
                slotProps={{ textField: { size: "small" } }}
              />
            </Box>
            <Box>
              <Typography variant="body1">Data Final</Typography>
              <DatePicker
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: "small" } }}
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
