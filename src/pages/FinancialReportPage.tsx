import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  CheckCircle2,
  Download,
  DollarSign,
  ShoppingCart,
  XCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import { listSales } from "../api/services/sales";
import { getAppointmentsByTenant } from "../api/services/appointments";
import { getAppointmentTotal } from "../utils/getAppointmentTotalPrice";
import theme from "../theme";
import type { SaleResponse, SalePaymentResponse } from "../features/sales/schemas";
import type { Appointment } from "../features/appointments/types";
import SaleReceiptModal from "../features/sales/SaleReceiptModal";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Crédito",
  debit_card: "Débito",
  money: "Dinheiro",
  other: "Outro",
  package: "Pacote",
  Pacote: "Pacote",
  multiple: "Múltiplo",
  Múltiplo: "Múltiplo",
  pending: "Pendente (A Receber)",
  Pendente: "Pendente (A Receber)",
};

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

type TxType = "Agendamento" | "Venda PDV" | "Pago via Pacote";
type TxStatus = "completed" | "canceled" | "pending";

type Transaction = {
  id: string;
  date: string;
  client: string;
  type: TxType;
  payment_method: string;
  amount_cents: number;
  status: TxStatus;
  payments?: SalePaymentResponse[];
  rawSale?: SaleResponse;
};

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ReportCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.5, sm: 2 },
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: 0.75,
      border: "1.5px solid",
      borderColor: "divider",
      borderTop: `4px solid ${color}`,
      borderRadius: 2.5,
      bgcolor: "#FFFFFF",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          fontSize: { xs: "0.68rem", sm: "0.75rem" },
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
    </Box>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 800,
        color: "#111827",
        fontSize: { xs: "1.1rem", sm: "1.3rem" },
        lineHeight: 1.2,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

const paymentColors: Record<string, string> = {
  pix: theme.palette.success.main,
  credit_card: theme.palette.primary.main,
  debit_card: theme.palette.info.main,
  money: theme.palette.warning.main,
  other: theme.palette.text.disabled,
};

export default function FinancialReportPage({
  startDate: propStartDate,
  endDate: propEndDate,
  setStartDate: propSetStartDate,
  setEndDate: propSetEndDate,
  hideFilters = false,
}: {
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
  setStartDate?: (d: Dayjs | null) => void;
  setEndDate?: (d: Dayjs | null) => void;
  hideFilters?: boolean;
} = {}) {
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));

  const [localStartDate, setLocalStartDate] = useState<Dayjs | null>(dayjs().startOf("month"));
  const [localEndDate, setLocalEndDate] = useState<Dayjs | null>(dayjs().endOf("day"));
  const [filterPayment, setFilterPayment] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<SaleResponse | null>(null);

  const startDate = propStartDate !== undefined ? propStartDate : localStartDate;
  const endDate = propEndDate !== undefined ? propEndDate : localEndDate;
  const setStartDate = propSetStartDate || setLocalStartDate;
  const setEndDate = propSetEndDate || setLocalEndDate;

  const { data: allSales = [], isLoading: loadingSales } = useQuery<SaleResponse[]>({
    queryKey: ["sales", startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")],
    queryFn: () =>
      listSales(startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")),
    staleTime: 1000 * 60 * 2,
  });

  const { data: allAppointments = [], isLoading: loadingApts } = useQuery<Appointment[]>({
    queryKey: [
      "appointments",
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
    ],
    queryFn: () =>
      getAppointmentsByTenant(
        startDate?.format("YYYY-MM-DD"),
        endDate?.format("YYYY-MM-DD"),
      ),
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = loadingSales || loadingApts;

  const allTransactions = useMemo<Transaction[]>(() => {
    const saleRows: Transaction[] = allSales.map((s) => ({
      id: `sale-${s.id}`,
      date: s.created_at,
      client: s.client?.name ?? "Consumidor",
      type: s.appointment_id ? "Agendamento" : "Venda PDV",
      payment_method: s.payment_method,
      amount_cents: Math.round(s.total_amount * 100),
      status: s.status as TxStatus,
      payments: s.payments,
      rawSale: s,
    }));

    const aptRows: Transaction[] = allAppointments
      .filter((a) => a.status === "completed" && !a.is_paid)
      .map((a) => ({
        id: `apt-${a.id}`,
        date: a.scheduled_at,
        client: a.client.name,
        type: (a.is_fully_package_covered ? "Pago via Pacote" : "Agendamento") as TxType,
        payment_method: a.is_fully_package_covered ? "Pacote" : "Pendente",
        amount_cents: getAppointmentTotal(a),
        status: "pending" as TxStatus,
      }));

    return [...saleRows, ...aptRows].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  }, [allSales, allAppointments]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filterPayment) {
        if (t.payment_method === filterPayment) {
          // match direct
        } else if (t.payments && t.payments.length > 0) {
          const hasMatch = t.payments.some((p) => p.payment_method === filterPayment);
          if (!hasMatch) return false;
        } else {
          return false;
        }
      }
      if (filterType && t.type !== filterType) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [allTransactions, filterPayment, filterType, filterStatus]);

  const summary = useMemo(() => {
    const completed = filtered.filter((t) => t.status === "completed");
    const revenue = completed.filter((t) => t.type !== "Pago via Pacote");
    const canceled = filtered.filter((t) => t.status === "canceled");
    const pending = filtered.filter((t) => t.status === "pending");

    const totalRevenue = revenue.reduce((acc, t) => acc + t.amount_cents, 0);
    const totalPending = pending.reduce((acc, t) => acc + t.amount_cents, 0);
    const totalCanceled = canceled.reduce((acc, t) => acc + t.amount_cents, 0);

    const isPendingOnly = filterStatus === "pending";
    const isCanceledOnly = filterStatus === "canceled";

    const displayTotal = isPendingOnly ? totalPending : isCanceledOnly ? totalCanceled : totalRevenue;
    const displayCount = isPendingOnly ? pending.length : isCanceledOnly ? canceled.length : revenue.length;
    const displayAvg = displayCount > 0 ? displayTotal / displayCount : 0;

    const byMethod: Record<string, number> = {};
    const methodTarget = isPendingOnly ? pending : revenue;
    for (const t of methodTarget) {
      if (t.payments && t.payments.length > 0) {
        for (const p of t.payments) {
          byMethod[p.payment_method] = (byMethod[p.payment_method] ?? 0) + Math.round(p.amount * 100);
        }
      } else {
        byMethod[t.payment_method] = (byMethod[t.payment_method] ?? 0) + t.amount_cents;
      }
    }

    return {
      totalRevenue: displayTotal,
      avgTicket: displayAvg,
      completedCount: displayCount,
      canceledCount: isPendingOnly ? 0 : isCanceledOnly ? canceled.length : canceled.length,
      byMethod,
      isPendingOnly,
      isCanceledOnly,
    };
  }, [filtered, filterStatus]);

  const exportCSV = () => {
    const headers = ["Data", "Cliente", "Tipo", "Método", "Valor (R$)", "Status"];
    const rows = filtered.map((t) => [
      dayjs(t.date).format("DD/MM/YYYY HH:mm"),
      t.client,
      t.type,
      t.payments && t.payments.length > 1
        ? t.payments.map((p) => `${PAYMENT_LABELS[p.payment_method] ?? p.payment_method}: R$ ${p.amount.toFixed(2)}`).join(" + ")
        : (PAYMENT_LABELS[t.payment_method] ?? t.payment_method),
      (t.amount_cents / 100).toFixed(2),
      t.status === "completed" ? "Concluído" : t.status === "canceled" ? "Cancelado" : "Pendente",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_financeiro_${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: hideFilters ? 0 : { xs: 1.5, sm: 2.5, md: 3 },
        maxWidth: "1400px",
      }}
    >
      {!hideFilters && (
        <Typography variant="h5" fontWeight={700} mb={3}>
          Relatório Financeiro
        </Typography>
      )}

      {/* Indicadores em Grid 2x2 (mobile) e 4 colunas (desktop) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
        }}
      >
        <ReportCard
          icon={<DollarSign size={20} />}
          label={summary.isPendingOnly ? "TOTAL PENDENTE" : summary.isCanceledOnly ? "TOTAL CANCELADO" : "FATURAMENTO"}
          value={fmtBRL(summary.totalRevenue)}
          color={summary.isPendingOnly ? theme.palette.warning.main : summary.isCanceledOnly ? theme.palette.error.main : theme.palette.success.main}
        />
        <ReportCard
          icon={<ShoppingCart size={20} />}
          label="TRANSAÇÕES"
          value={summary.completedCount}
          color={theme.palette.primary.main}
        />
        <ReportCard
          icon={<CheckCircle2 size={20} />}
          label="TICKET MÉDIO"
          value={fmtBRL(summary.avgTicket)}
          color={theme.palette.info.main}
        />
        <ReportCard
          icon={<XCircle size={20} />}
          label="CANCELAMENTOS"
          value={summary.canceledCount}
          color={theme.palette.error.main}
        />
      </Box>

      {Object.keys(summary.byMethod).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            color="text.disabled"
            fontWeight={700}
            sx={{ mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 }}
          >
            MÉTODOS DE PAGAMENTO
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 1.5,
            }}
          >
            {Object.entries(summary.byMethod)
              .sort(([, a], [, b]) => b - a)
              .map(([method, cents]) => {
                const pct =
                  summary.totalRevenue > 0
                    ? ((cents / summary.totalRevenue) * 100).toFixed(1)
                    : "0.0";
                const color = paymentColors[method] ?? theme.palette.grey[400];
                return (
                  <Paper
                    key={method}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1.5px solid",
                      borderColor: "divider",
                      borderLeft: `4px solid ${color}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      bgcolor: "#FFFFFF",
                      position: "relative",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <CreditCard size={18} color={color} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700} noWrap>
                          {PAYMENT_LABELS[method] ?? method}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        sx={{
                          color: "primary.main",
                          bgcolor: "rgba(49, 52, 133, 0.08)",
                          px: 0.75,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.68rem",
                        }}
                      >
                        {pct}%
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={800} color="#111827">
                      {fmtBRL(cents)}
                    </Typography>
                  </Paper>
                );
              })}
          </Box>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2.5,
          borderRadius: 2.5,
          border: "1.5px solid",
          borderColor: "divider",
          bgcolor: "#FFFFFF",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            {!hideFilters && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500}>De:</Typography>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    format="DD/MM/YYYY"
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
                              bgcolor: "#313485 !important",
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
                      textField: { size: "small", placeholder: "DD/MM/AAAA", sx: { flex: 1 } },
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500}>Até:</Typography>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    format="DD/MM/YYYY"
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
                              bgcolor: "#313485 !important",
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
                      textField: { size: "small", placeholder: "DD/MM/AAAA", sx: { flex: 1 } },
                    }}
                  />
                </Box>
              </>
            )}

            {/* Filtros: Método, Tipo e Status */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "160px 180px 160px" },
                gap: 1.25,
                width: { xs: "100%", sm: "auto" },
                flex: { sm: "0 0 auto" },
              }}
            >
              <Select
                size="small"
                displayEmpty
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                sx={{ width: "100%", bgcolor: "#FAFAFA" }}
              >
                <MenuItem value=""><em>Método (Todos)</em></MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="credit_card">Crédito</MenuItem>
                <MenuItem value="debit_card">Débito</MenuItem>
                <MenuItem value="money">Dinheiro</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ width: "100%", bgcolor: "#FAFAFA" }}
              >
                <MenuItem value=""><em>Tipo (Todos)</em></MenuItem>
                <MenuItem value="Venda PDV">Venda PDV</MenuItem>
                <MenuItem value="Agendamento">Agendamento</MenuItem>
                <MenuItem value="Pago via Pacote">Pago via Pacote</MenuItem>
              </Select>
              <Select
                size="small"
                displayEmpty
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{
                  width: "100%",
                  bgcolor: "#FAFAFA",
                  gridColumn: { xs: "span 2", sm: "auto" },
                }}
              >
                <MenuItem value=""><em>Status (Todos)</em></MenuItem>
                <MenuItem value="completed">Concluído</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="canceled">Cancelado</MenuItem>
              </Select>
            </Box>

            <Box sx={{ ml: { xs: 0, sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="outlined"
                startIcon={<Download size={16} />}
                onClick={exportCSV}
                disabled={isLoading || filtered.length === 0}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minHeight: 38,
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Exportar CSV
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
      </Paper>

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
              <Typography color="text.secondary">
                Nenhuma transação encontrada para os filtros selecionados.
              </Typography>
            </Paper>
          ) : (
            filtered.map((t) => (
              <Paper
                key={t.id}
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  border: "1.5px solid",
                  borderColor: "divider",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                {/* Linha 1: Cliente e Valor */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      color="#111827"
                      sx={{
                        fontSize: "0.98rem",
                        lineHeight: 1.3,
                        textTransform: "capitalize",
                      }}
                      noWrap
                    >
                      {t.client || "Cliente não informado"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(t.date).format("DD/MM/YYYY HH:mm")}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: "1.1rem", whiteSpace: "nowrap" }}
                  >
                    {fmtBRL(t.amount_cents)}
                  </Typography>
                </Box>

                {/* Linha 2: Tags e Status em Linha Única sem quebra */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 1,
                    borderTop: "1px dashed #E2E8F0",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", minWidth: 0 }}>
                    <Chip
                      label={t.type}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        bgcolor: t.type === "Venda PDV" ? "#EFF6FF" : t.type === "Pago via Pacote" ? "#F5F3FF" : "#F1F5F9",
                        color: t.type === "Venda PDV" ? "#1D4ED8" : t.type === "Pago via Pacote" ? "#7C3AED" : "#475569",
                      }}
                    />
                    {t.payments && t.payments.length > 1 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Chip
                          label="Múltiplo"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            bgcolor: "#F3E8FF",
                            color: "#7E22CE",
                            width: "fit-content",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", lineHeight: 1.2 }}>
                          {t.payments.map((p) => `${PAYMENT_LABELS[p.payment_method] ?? p.payment_method}: R$ ${p.amount.toFixed(2)}`).join(" • ")}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip
                        label={PAYMENT_LABELS[t.payment_method] ?? t.payment_method}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          bgcolor: "#F8FAFC",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                          maxWidth: 140,
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                    <Chip
                      label={
                        t.status === "completed"
                          ? "Concluído"
                          : t.status === "canceled"
                            ? "Cancelado"
                            : "Pendente"
                      }
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        bgcolor:
                          t.status === "completed"
                            ? "#DCFCE7"
                            : t.status === "canceled"
                              ? "#FEE2E2"
                              : "#FEF3C7",
                        color:
                          t.status === "completed"
                            ? "#166534"
                            : t.status === "canceled"
                              ? "#991B1B"
                              : "#92400E",
                        flexShrink: 0,
                      }}
                    />
                    {t.rawSale && (
                      <IconButton
                        size="small"
                        onClick={() => setSelectedReceiptSale(t.rawSale!)}
                        sx={{
                          color: "#313485",
                          bgcolor: "#EEF2FF",
                          p: 0.5,
                          "&:hover": { bgcolor: "#E0E7FF" },
                        }}
                        title="Ver Comprovante / WhatsApp"
                      >
                        <Receipt size={16} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Data</TableCell>
                <TableCell sx={headerCellSx}>Cliente</TableCell>
                <TableCell sx={headerCellSx}>Tipo</TableCell>
                <TableCell sx={headerCellSx}>Método</TableCell>
                <TableCell sx={headerCellSx} align="right">Valor</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell sx={headerCellSx} align="center">Comprovante</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {dayjs(t.date).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell>{t.client}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.type}
                      size="small"
                      variant="outlined"
                      color={t.type === "Venda PDV" ? "primary" : "default"}
                      sx={
                        t.type === "Pago via Pacote"
                          ? {
                              color: "#8b5cf6",
                              borderColor: "#c084fc",
                              fontWeight: 600,
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {t.payments && t.payments.length > 1 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Chip
                          label="Múltiplo"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            bgcolor: "#F3E8FF",
                            color: "#7E22CE",
                            width: "fit-content",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem", lineHeight: 1.2 }}>
                          {t.payments.map((p) => `${PAYMENT_LABELS[p.payment_method] ?? p.payment_method}: R$ ${p.amount.toFixed(2)}`).join(" • ")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {PAYMENT_LABELS[t.payment_method] ?? t.payment_method}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fmtBRL(t.amount_cents)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        t.status === "completed"
                          ? "Concluído"
                          : t.status === "canceled"
                            ? "Cancelado"
                            : "Pendente"
                      }
                      color={
                        t.status === "completed"
                          ? "success"
                          : t.status === "canceled"
                            ? "error"
                            : "warning"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {t.rawSale ? (
                      <Tooltip title="Ver Comprovante / Enviar WhatsApp">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedReceiptSale(t.rawSale!)}
                          sx={{
                            color: "#313485",
                            bgcolor: "#EEF2FF",
                            "&:hover": { bgcolor: "#E0E7FF", color: "#1E1B4B" },
                          }}
                        >
                          <Receipt size={17} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.disabled">
                      Nenhuma transação encontrada para os filtros selecionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedReceiptSale && (
        <SaleReceiptModal
          open={!!selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
          sale={selectedReceiptSale}
          clientName={selectedReceiptSale.client?.name || selectedReceiptSale.appointment?.client?.name}
          clientPhone={selectedReceiptSale.client?.phone || selectedReceiptSale.appointment?.client?.phone}
        />
      )}
    </Box>
  );
}
