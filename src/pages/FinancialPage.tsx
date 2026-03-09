import { Box, Typography } from "@mui/material";
import { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../api/services/appointments";
import FinancialSummaryCards from "../features/financial/FinancialSummaryCards";
import FinancialTable from "../features/financial/FinancialTable";
import { getAppointmentTotal } from "../utils/getAppointmentTotalPrice";
import type { FinancialSummary } from "../features/financial/types";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.extend(isBetween);

export default function FinancialPage() {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("month"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf("day"));

  const { data: allAppointments = [] } = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: getAppointmentsByTenant,
  });

  const filteredAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => {
        const date = dayjs(a.scheduled_at);
        const isCompleted = a.status === "completed";
        const isInRange =
          (!startDate ||
            date.isAfter(startDate, "day") ||
            date.isSame(startDate, "day")) &&
          (!endDate ||
            date.isBefore(endDate, "day") ||
            date.isSame(endDate, "day"));

        return isCompleted && isInRange;
      })
      .sort((a, b) => dayjs(b.scheduled_at).diff(dayjs(a.scheduled_at)));
  }, [allAppointments, startDate, endDate]);

  const summary = useMemo<FinancialSummary>(() => {
    const totalRevenueCents = filteredAppointments.reduce(
      (acc, a) => acc + getAppointmentTotal(a),
      0,
    );

    // For canceled count, we might want to see how many were canceled in THIS range
    const canceledInRange = allAppointments.filter((a) => {
      const date = dayjs(a.scheduled_at);
      const isInRange =
        (!startDate ||
          date.isAfter(startDate, "day") ||
          date.isSame(startDate, "day")) &&
        (!endDate ||
          date.isBefore(endDate, "day") ||
          date.isSame(endDate, "day"));
      return a.status === "canceled" && isInRange;
    }).length;

    return {
      totalRevenueCents,
      completedCount: filteredAppointments.length,
      canceledCount: canceledInRange,
      averageTicketCents:
        filteredAppointments.length > 0
          ? totalRevenueCents / filteredAppointments.length
          : 0,
    };
  }, [filteredAppointments, allAppointments, startDate, endDate]);

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
              <Typography variant="body1">
                Data Inicial
              </Typography>
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: "small" } }}
              />
            </Box>
            <Box>
              <Typography variant="body1">
                Data Final
              </Typography>
              <DatePicker
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: "small" } }}
              />
            </Box>
          </Box>
        </LocalizationProvider>
      </Box>

      <FinancialSummaryCards summary={summary} />

      <FinancialTable appointments={filteredAppointments} />
    </Box>
  );
}
