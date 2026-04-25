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
} from "lucide-react";
import { listSales } from "../api/services/sales";
import { getAppointmentsByTenant } from "../api/services/appointments";
import { getAppointmentTotal } from "../utils/getAppointmentTotalPrice";
import CustomCard from "../components/Card/CustomCard";
import theme from "../theme";
import type { SaleResponse } from "../features/sales/schemas";
import type { Appointment } from "../features/appointments/types";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Crédito",
  debit_card: "Débito",
  money: "Dinheiro",
  other: "Outro",
  Pacote: "Pacote",
  Pendente: "Pendente",
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
  <CustomCard
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 1,
      borderTop: `4px solid ${color}`,
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="body2" color="text.disabled" fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ color }}>{icon}</Box>
    </Box>
    <Typography variant="h5" fontWeight={700}>
      {value}
    </Typography>
  </CustomCard>
);

const paymentColors: Record<string, string> = {
  pix: theme.palette.success.main,
  credit_card: theme.palette.primary.main,
  debit_card: theme.palette.info.main,
  money: theme.palette.warning.main,
  other: theme.palette.text.disabled,
};

export default function FinancialReportPage() {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf("day"));
  const [filterPayment, setFilterPayment] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: allSales = [], isLoading: loadingSales } = useQuery<SaleResponse[]>({
    queryKey: ["sales", startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")],
    queryFn: () =>
      listSales(startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")),
  });

  const { data: allAppointments = [], isLoading: loadingApts } = useQuery<Appointment[]>({
    queryKey: [
      "appointments",
      "financial-report",
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
    ],
    queryFn: () =>
      getAppointmentsByTenant(
        startDate?.format("YYYY-MM-DD"),
        endDate?.format("YYYY-MM-DD"),
      ),
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
      if (filterPayment && t.payment_method !== filterPayment) return false;
      if (filterType && t.type !== filterType) return false;
      return true;
    });
  }, [allTransactions, filterPayment, filterType]);

  const summary = useMemo(() => {
    const completed = filtered.filter((t) => t.status === "completed");
    const revenue = completed.filter((t) => t.type !== "Pago via Pacote");
    const canceled = filtered.filter((t) => t.status === "canceled");
    const totalRevenue = revenue.reduce((acc, t) => acc + t.amount_cents, 0);

    const byMethod: Record<string, number> = {};
    for (const t of revenue) {
      byMethod[t.payment_method] = (byMethod[t.payment_method] ?? 0) + t.amount_cents;
    }

    return {
      totalRevenue,
      avgTicket: revenue.length > 0 ? totalRevenue / revenue.length : 0,
      completedCount: revenue.length,
      canceledCount: canceled.length,
      byMethod,
    };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Data", "Cliente", "Tipo", "Método", "Valor (R$)", "Status"];
    const rows = filtered.map((t) => [
      dayjs(t.date).format("DD/MM/YYYY HH:mm"),
      t.client,
      t.type,
      PAYMENT_LABELS[t.payment_method] ?? t.payment_method,
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
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1400px" }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Relatório Financeiro
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        <ReportCard
          icon={<DollarSign size={20} />}
          label="FATURAMENTO"
          value={fmtBRL(summary.totalRevenue)}
          color={theme.palette.success.main}
        />
        <ReportCard
          icon={<ShoppingCart size={20} />}
          label="TRANSAÇÕES CONCLUÍDAS"
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
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Typography
            variant="body2"
            color="text.disabled"
            fontWeight={700}
            sx={{ width: "100%", mb: -1 }}
          >
            MÉTODOS DE PAGAMENTO
          </Typography>
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
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    borderLeft: `4px solid ${color}`,
                    minWidth: 220,
                    position: "relative",
                  }}
                >
                  <CreditCard size={24} color={color} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.disabled" fontWeight={700} display="block">
                      {PAYMENT_LABELS[method] ?? method}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {fmtBRL(cents)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "info.dark",
                      bgcolor: "info.50",
                      backgroundColor: "#e3f2fd",
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      lineHeight: 1.6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pct}%
                  </Typography>
                </Paper>
              );
            })}
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <DatePicker
              label="De"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="Até"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small" } }}
            />
            <Select
              size="small"
              displayEmpty
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              sx={{ minWidth: 150 }}
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
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=""><em>Tipo (Todos)</em></MenuItem>
              <MenuItem value="Venda PDV">Venda PDV</MenuItem>
              <MenuItem value="Agendamento">Agendamento</MenuItem>
              <MenuItem value="Pago via Pacote">Pago via Pacote</MenuItem>
            </Select>
            <Box sx={{ ml: "auto" }}>
              <Button
                variant="outlined"
                startIcon={<Download size={16} />}
                onClick={exportCSV}
                disabled={isLoading || filtered.length === 0}
              >
                Exportar CSV
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>
      </Paper>

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
                    color={
                      t.type === "Venda PDV"
                        ? "primary"
                        : t.type === "Pago via Pacote"
                          ? "secondary"
                          : "default"
                    }
                  />
                </TableCell>
                <TableCell>{PAYMENT_LABELS[t.payment_method] ?? t.payment_method}</TableCell>
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
              </TableRow>
            ))}
            {filtered.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled">
                    Nenhuma transação encontrada para os filtros selecionados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
