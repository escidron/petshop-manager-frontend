import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Button as MuiButton,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import {
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  Printer,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { listCashSessions, listCashRegisters, getCurrentCashStatus } from "../../api/services/cash";
import type { CashSessionDetailResponse, CurrentCashStatusResponse } from "./types";
import { Button } from "../../components/Button/Button";

const getMovementTypeLabel = (type: string) => {
  switch (type) {
    case "opening": return "Abertura";
    case "sale": return "Venda (Dinheiro)";
    case "sale_cancel": return "Estorno / Cancel.";
    case "supply": return "Suprimento (+)";
    case "bleed": return "Sangria (-)";
    case "closing": return "Fechamento";
    default: return type;
  }
};

interface CashStatementViewProps {
  sessionData: CashSessionDetailResponse | null;
  cashRegisterId?: number | null;
  isLoading?: boolean;
  onOpenSupply?: () => void;
  onOpenBleed?: () => void;
  onOpenClose?: () => void;
  onOpenOpenModal?: () => void;
  onPrint?: () => void;
}

export default function CashStatementView({
  sessionData,
  cashRegisterId,
  isLoading: isInitialLoading,
  onOpenSupply,
  onOpenBleed,
  onOpenClose,
  onOpenOpenModal,
  onPrint,
}: CashStatementViewProps) {
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | "all">(
    cashRegisterId ?? sessionData?.cash_register?.id ?? "all"
  );

  // Fetch current terminal status to know if physical register is currently open
  const activeRegId = selectedRegisterId === "all" ? (cashRegisterId ?? undefined) : selectedRegisterId;
  const { data: terminalStatus } = useQuery<CurrentCashStatusResponse>({
    queryKey: ["cash-status", activeRegId],
    queryFn: () => getCurrentCashStatus(activeRegId),
    staleTime: 1000 * 15,
  });

  const isTerminalOpen = terminalStatus ? terminalStatus.is_open : (sessionData?.session.status === "open");

  // Default date to the sessionData date if provided, otherwise today
  const initialDate = useMemo(() => {
    if (sessionData?.session.opened_at) {
      return dayjs(sessionData.session.opened_at);
    }
    return dayjs();
  }, [sessionData?.session.opened_at]);

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(initialDate);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  // Fetch Registers for the filter dropdown
  const { data: registers = [] } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: () => listCashRegisters(false),
    staleTime: 1000 * 60 * 5,
  });

  // Calculate start & end date for the query
  const dateParams = useMemo(() => {
    if (!selectedDate) return { start: undefined, end: undefined };
    if (viewMode === "monthly") {
      const start = selectedDate.startOf("month").format("YYYY-MM-DD");
      const end = selectedDate.endOf("month").format("YYYY-MM-DD");
      return { start, end };
    }
    const dayStr = selectedDate.format("YYYY-MM-DD");
    return { start: dayStr, end: dayStr };
  }, [selectedDate, viewMode]);

  // Fetch sessions for the selected date / month & register
  const regParam = selectedRegisterId === "all" ? undefined : selectedRegisterId;
  const { data: fetchedSessions, isLoading: isQueryLoading } = useQuery({
    queryKey: ["cash-sessions-statement", dateParams.start, dateParams.end, regParam],
    queryFn: () => listCashSessions(dateParams.start, dateParams.end, regParam),
    staleTime: 1000 * 10,
  });

  // Filter by Register (fallback local filter if needed)
  const filteredSessions = useMemo(() => {
    if (fetchedSessions !== undefined) {
      if (selectedRegisterId === "all") return fetchedSessions;
      return fetchedSessions.filter((s) => s.cash_register.id === selectedRegisterId);
    }
    return sessionData ? [sessionData] : [];
  }, [fetchedSessions, sessionData, selectedRegisterId]);

  // Build combined display data for single session or aggregated monthly/multi-session
  const currentSessionDisplay = useMemo(() => {
    if (fetchedSessions !== undefined) {
      if (filteredSessions.length === 0) return null;
      if (filteredSessions.length === 1 && selectedRegisterId !== "all") return filteredSessions[0];

      // Aggregate multiple sessions on the same date/month or across all registers
      const combinedPaymentsMap: Record<string, { label: string; total_amount: number; count: number }> = {};
      let totalSales = 0;
      let totalSupplies = 0;
      let totalBleeds = 0;
      let totalInitial = 0;
      let totalBalance = 0;
      const allMovements: typeof filteredSessions[0]["movements"] = [];

      for (const s of filteredSessions) {
        totalSales += s.total_sales_amount;
        totalSupplies += s.total_supplies;
        totalBleeds += s.total_bleeds;
        totalInitial += s.session.initial_amount;
        totalBalance += s.current_balance;

        for (const m of s.movements) {
          allMovements.push({
            ...m,
            destination_or_origin:
              selectedRegisterId === "all" && s.cash_register?.name
                ? `${s.cash_register.name} • ${m.destination_or_origin}`
                : m.destination_or_origin,
          });
        }

        for (const pm of s.payment_methods) {
          if (!combinedPaymentsMap[pm.method]) {
            combinedPaymentsMap[pm.method] = { label: pm.label, total_amount: 0, count: 0 };
          }
          combinedPaymentsMap[pm.method].total_amount += pm.total_amount;
          combinedPaymentsMap[pm.method].count += pm.count;
        }
      }

      // Sort combined movements chronologically
      allMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const latestSession = filteredSessions[0];
      const aggregated: CashSessionDetailResponse = {
        session: {
          ...latestSession.session,
          initial_amount: selectedRegisterId === "all" ? totalInitial : latestSession.session.initial_amount,
        },
        cash_register:
          selectedRegisterId === "all"
            ? { id: 0, name: "Todos os Caixas (Consolidado)", is_active: true, created_at: "" }
            : latestSession.cash_register,
        current_balance: selectedRegisterId === "all" ? totalBalance : latestSession.current_balance,
        total_sales_amount: totalSales,
        total_supplies: totalSupplies,
        total_bleeds: totalBleeds,
        payment_methods: Object.entries(combinedPaymentsMap).map(([method, data]) => ({
          method,
          label: data.label,
          total_amount: data.total_amount,
          count: data.count,
        })),
        movements: allMovements,
      };

      return aggregated;
    }
    return sessionData || null;
  }, [fetchedSessions, filteredSessions, sessionData, selectedRegisterId]);

  if (isInitialLoading || isQueryLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress size={36} sx={{ color: "#2563EB" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "920px", mx: "auto" }}>
      {/* Top Filter Bar: Date, Month/Day tabs & Register Selector */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: "#F9FAFB",
          borderRadius: 3,
          border: "1px solid #E5E7EB",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          {/* Daily vs Monthly Tabs */}
          <Tabs
            value={viewMode}
            onChange={(_, val) => setViewMode(val)}
            sx={{
              bgcolor: "#E5E7EB",
              p: 0.5,
              borderRadius: 2.5,
              minHeight: 0,
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab
              label="Por Dia"
              value="daily"
              sx={{
                minHeight: 30,
                py: 0.4,
                px: 1.75,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                color: "#4B5563",
                "&.Mui-selected": { bgcolor: "#ffffff", color: "#111827", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
              }}
            />
            <Tab
              label="Mensal"
              value="monthly"
              sx={{
                minHeight: 30,
                py: 0.4,
                px: 1.75,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                color: "#4B5563",
                "&.Mui-selected": { bgcolor: "#ffffff", color: "#111827", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
              }}
            />
          </Tabs>

          {/* Date Picker & Register Filter */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                views={viewMode === "monthly" ? ["year", "month"] : ["year", "month", "day"]}
                value={selectedDate}
                onChange={(newVal) => setSelectedDate(newVal)}
                dayOfWeekFormatter={(day: Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
                  return days[day.day()];
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      minWidth: viewMode === "monthly" ? 210 : 190,
                      bgcolor: "#ffffff",
                      borderRadius: 2,
                      "& .MuiInputBase-input": { fontSize: "0.85rem", fontWeight: 700, color: "#111827" },
                    },
                  },
                  desktopPaper: {
                    sx: {
                      borderRadius: 3,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      border: "1px solid #E5E7EB",
                      "& .MuiPickersCalendarHeader-label": {
                        fontWeight: 700,
                        color: "#111827",
                        textTransform: "capitalize",
                      },
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#374151 !important",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        width: "36px",
                        height: "36px",
                        margin: 0,
                        textTransform: "capitalize",
                      },
                      "& .MuiPickersDay-root": {
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        width: "36px",
                        height: "36px",
                        margin: 0,
                        "&.Mui-selected": {
                          backgroundColor: "#16A34A !important",
                          color: "#ffffff !important",
                          fontWeight: 800,
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            {registers.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 150, bgcolor: "#ffffff", borderRadius: 2 }}>
                <Select
                  value={selectedRegisterId}
                  onChange={(e) => setSelectedRegisterId(e.target.value as any)}
                  sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}
                >
                  <MenuItem value="all">Todos os Caixas</MenuItem>
                  {registers.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
      </Paper>

      {/* When no sessions exist for this period */}
      {!currentSessionDisplay ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            bgcolor: "#ffffff",
            mb: 3,
          }}
        >
          <AlertCircle size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827", mb: 1 }}>
            Nenhuma atividade registrada neste dia
          </Typography>
          <Typography variant="body2" sx={{ color: "#4B5563" }}>
            Não foram encontradas movimentações ou sessões de caixa para a data selecionada.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Terminal Title, Status & Timestamps */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 0.5, flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
                {selectedRegisterId === "all" ? "Todos os Caixas (Consolidado)" : currentSessionDisplay.cash_register.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, display: "block" }}>
                {selectedRegisterId === "all" ? (
                  <>
                    Período: {selectedDate ? selectedDate.format("DD/MM/YYYY") : "Hoje"} • {filteredSessions.length} {filteredSessions.length === 1 ? "sessão registrada" : "sessões registradas"}
                  </>
                ) : (
                  <>
                    Abertura: {dayjs(currentSessionDisplay.session.opened_at).format("DD/MM/YYYY [às] HH:mm")}
                    {currentSessionDisplay.session.opened_by_name && ` por ${currentSessionDisplay.session.opened_by_name}`}
                    {currentSessionDisplay.session.closed_at && (
                      <> • Fechamento: {dayjs(currentSessionDisplay.session.closed_at).format("HH:mm")}</>
                    )}
                  </>
                )}
              </Typography>
            </Box>

            {selectedRegisterId === "all" ? (
              <Chip
                label="Visão Consolidada"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                }}
              />
            ) : (
              <Chip
                icon={currentSessionDisplay.session.status === "open" ? <Unlock size={14} /> : <Lock size={14} />}
                label={currentSessionDisplay.session.status === "open" ? "Caixa Aberto" : "Caixa Fechado"}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor: currentSessionDisplay.session.status === "open" ? "#DCFCE7" : "#F3F4F6",
                  color: currentSessionDisplay.session.status === "open" ? "#166534" : "#4B5563",
                  border: `1px solid ${currentSessionDisplay.session.status === "open" ? "#86EFAC" : "#D1D5DB"}`,
                }}
              />
            )}
          </Box>

          {/* Card 1: VENDAS POR FORMA DE PAGAMENTO */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: "#ffffff",
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "#1F2937",
                mb: 2,
                textTransform: "uppercase",
                fontSize: "0.8rem",
                letterSpacing: 0.5,
              }}
            >
              Vendas por Forma de Pagamento
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {currentSessionDisplay.payment_methods.map((pm) => (
                <Box
                  key={pm.method}
                  sx={{
                    flex: { xs: "1 1 calc(50% - 12px)", sm: "1 1 calc(25% - 12px)" },
                    bgcolor: "#F9FAFB",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #E5E7EB",
                    boxSizing: "border-box",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 700, display: "block" }}>
                    {pm.label} ({pm.count})
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: "#111827", mt: 0.25, whiteSpace: "nowrap" }}>
                    R$ {pm.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2, borderColor: "#E5E7EB" }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body1" sx={{ fontWeight: 800, color: "#1F2937" }}>
                Total Geral de Vendas
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#16A34A", whiteSpace: "nowrap" }}>
                R$ {currentSessionDisplay.total_sales_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>

          {/* Card 2: MOVIMENTAÇÕES DE DINHEIRO */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: "#ffffff",
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              mb: 3,
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 2.5, pb: 1.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: "#1F2937",
                  textTransform: "uppercase",
                  fontSize: "0.8rem",
                  letterSpacing: 0.5,
                }}
              >
                Movimentações de Dinheiro (Livro Caixa)
              </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: "#1F2937", bgcolor: "#F9FAFB", whiteSpace: "nowrap" }}>
                      {viewMode === "monthly" ? "Data / Horário" : "Horário"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#1F2937", bgcolor: "#F9FAFB" }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#1F2937", bgcolor: "#F9FAFB" }}>Destino / Origem / Descrição</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#1F2937", bgcolor: "#F9FAFB", whiteSpace: "nowrap" }}>Valor (R$)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#1F2937", bgcolor: "#F9FAFB", whiteSpace: "nowrap" }}>Saldo Acumulado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentSessionDisplay.movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#6B7280" }}>
                        Nenhuma movimentação de dinheiro registrada nesta sessão.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSessionDisplay.movements.map((mov) => {
                      const isNeutral = mov.type === "opening" || mov.type === "closing";
                      const isNegative = !isNeutral && (mov.amount < 0 || mov.type === "bleed" || mov.type === "sale_cancel");
                      const isPositive = !isNeutral && (mov.amount > 0 || mov.type === "supply" || mov.type === "sale");
                      const valuePrefix = isNegative ? "- " : isPositive ? "+ " : "";
                      const valueColor = isNegative ? "#DC2626" : isPositive ? "#16A34A" : "#111827";

                      return (
                        <TableRow key={mov.id} hover>
                          <TableCell sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            {viewMode === "monthly"
                              ? dayjs(mov.created_at).format("DD/MM [às] HH:mm")
                              : dayjs(mov.created_at).format("HH:mm")}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip
                              label={getMovementTypeLabel(mov.type)}
                              size="small"
                              sx={{
                                height: 22,
                                fontWeight: 800,
                                fontSize: "0.7rem",
                                bgcolor:
                                  mov.type === "opening"
                                    ? "#EFF6FF"
                                    : mov.type === "supply"
                                    ? "#DCFCE7"
                                    : mov.type === "bleed"
                                    ? "#FEE2E2"
                                    : mov.type === "sale"
                                    ? "#F0FDF4"
                                    : "#F3F4F6",
                                color:
                                  mov.type === "opening"
                                    ? "#1E40AF"
                                    : mov.type === "supply"
                                    ? "#166534"
                                    : mov.type === "bleed"
                                    ? "#991B1B"
                                    : mov.type === "sale"
                                    ? "#15803D"
                                    : "#374151",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "#111827", fontWeight: 600, fontSize: "0.85rem" }}>
                            {mov.destination_or_origin ? (
                              <>
                                <strong>{mov.destination_or_origin}</strong>
                                {mov.description && <span style={{ color: "#4B5563" }}> • {mov.description}</span>}
                              </>
                            ) : (
                              mov.description || "-"
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              color: valueColor,
                            }}
                          >
                            {valuePrefix}R${" "}
                            {Math.abs(mov.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: "#111827", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                            R$ {mov.balance_after.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totalizers Summary Bar */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#F9FAFB",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block" }}>
                    Fundo de Abertura:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#111827", whiteSpace: "nowrap" }}>
                    R$ {currentSessionDisplay.session.initial_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block" }}>
                    Total Suprimento (+):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#16A34A", whiteSpace: "nowrap" }}>
                    R$ {currentSessionDisplay.total_supplies.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block" }}>
                    Total Sangria (-):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#DC2626", whiteSpace: "nowrap" }}>
                    R$ {currentSessionDisplay.total_bleeds.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>
                  Saldo Final em Dinheiro
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#111827", whiteSpace: "nowrap" }}>
                  R$ {currentSessionDisplay.current_balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* Action Footer Buttons - Always accessible */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderRadius: 3,
          bgcolor: "#F9FAFB",
          border: "1px solid #E5E7EB",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          {onPrint && currentSessionDisplay && (
            <MuiButton
              variant="outlined"
              size="small"
              onClick={onPrint}
              startIcon={<Printer size={16} />}
              sx={{
                color: "#374151",
                borderColor: "#D1D5DB",
                bgcolor: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "#F3F4F6", borderColor: "#9CA3AF" },
              }}
            >
              Imprimir Comprovante
            </MuiButton>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {onOpenSupply && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenSupply}
              startIcon={<ArrowUpRight size={16} />}
              sx={{
                bgcolor: "#16A34A",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "#15803D" },
              }}
            >
              + Suprimento
            </Button>
          )}

          {onOpenBleed && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenBleed}
              startIcon={<ArrowDownRight size={16} />}
              sx={{
                bgcolor: "#D97706",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "#B45309" },
              }}
            >
              - Sangria
            </Button>
          )}

          {isTerminalOpen && onOpenClose && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenClose}
              startIcon={<Lock size={16} />}
              sx={{
                bgcolor: "#DC2626",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "#B91C1C" },
              }}
            >
              Fechar Caixa
            </Button>
          )}

          {!isTerminalOpen && onOpenOpenModal && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenOpenModal}
              startIcon={<Unlock size={16} />}
              sx={{
                bgcolor: "#16A34A",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "#15803D" },
              }}
            >
              Abrir Caixa
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
