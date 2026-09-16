import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listSales } from "../../api/services/sales";
import {
  X,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Search,
  Receipt,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { SaleResponse } from "../sales/schemas";
import SaleDetailsModal from "../sales/SaleDetailsModal";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";

interface DaySalesModalProps {
  open: boolean;
  date: string | null;
  sales?: SaleResponse[];
  onRefresh?: () => void;
  isLoading?: boolean;
  onClose: () => void;
}

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getSalePets = (sale: SaleResponse): string => {
  // 1. Pet diretamente associado à venda
  if (sale.pet?.name) {
    return sale.pet.name;
  }

  // 2. Pets de itens do agendamento vinculado
  if (sale.appointment?.items && sale.appointment.items.length > 0) {
    const apptPets: string[] = [];
    for (const item of sale.appointment.items) {
      if (item.pet?.name && !apptPets.includes(item.pet.name)) {
        apptPets.push(item.pet.name);
      }
    }
    if (apptPets.length > 0) {
      return apptPets.join(", ");
    }
  }

  // 3. Pets cadastrados do cliente
  const clientPets = sale.client?.pets || sale.appointment?.client?.pets;
  if (clientPets && clientPets.length > 0) {
    const names = clientPets.map((p) => p.name).filter(Boolean);
    if (names.length > 0) {
      return names.join(", ");
    }
  }

  return "";
};

const PAYMENT_CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pix: { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  credit_card: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  debit_card: { bg: "#f0f9ff", text: "#0284c7", border: "#bae6fd" },
  money: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  package: { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
  multiple: { bg: "#fdf4ff", text: "#c026d3", border: "#f5d0fe" },
  other: { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
};

export default function DaySalesModal({ open, date, sales = [], onRefresh, isLoading, onClose }: DaySalesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "pdv" | "appointment">("all");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // Auto-fetch fresh sales for the selected date on open / invalidation
  const { data: fetchedSales, isFetching, refetch } = useQuery({
    queryKey: ["day-sales", date],
    queryFn: () => (date ? listSales(date, date) : Promise.resolve([])),
    enabled: open && Boolean(date),
    staleTime: 0,
    initialData: sales && sales.length > 0 ? sales : undefined,
  });

  const effectiveSales = fetchedSales || sales;
  const isSyncing = isFetching || isManualRefreshing || Boolean(isLoading);

  // Formatted date string (e.g. "Domingo, 06 de setembro de 2026")
  const formattedFullDate = useMemo(() => {
    if (!date) return "";
    const parsed = dayjs(date);
    const dayOfWeek = parsed.format("dddd");
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return `${capitalizedDay}, ${parsed.format("DD/MM/YYYY")}`;
  }, [date]);

  // Daily statistics
  const stats = useMemo(() => {
    const completed = effectiveSales.filter((s) => s.status === "completed");
    const canceled = effectiveSales.filter((s) => s.status === "canceled");

    const totalRevenueCents = Math.round(
      completed.reduce((acc, s) => acc + (s.total_amount || 0), 0) * 100
    );

    const completedCount = completed.length;
    const avgTicketCents = completedCount > 0 ? Math.round(totalRevenueCents / completedCount) : 0;

    // Total items sold
    let totalItemsCount = 0;
    completed.forEach((s) => {
      s.items?.forEach((item) => {
        totalItemsCount += item.quantity || 1;
      });
    });

    // Payment methods breakdown
    const byMethod: Record<string, number> = {};
    completed.forEach((s) => {
      if (s.payments && s.payments.length > 0) {
        s.payments.forEach((p) => {
          const amtCents = Math.round((p.amount || 0) * 100);
          byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + amtCents;
        });
      } else {
        const amtCents = Math.round((s.total_amount || 0) * 100);
        byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + amtCents;
      }
    });

    const paymentMethods = Object.entries(byMethod)
      .map(([method, cents]) => ({
        method,
        label: formatPaymentMethod(method),
        cents,
        pct: totalRevenueCents > 0 ? (cents / totalRevenueCents) * 100 : 0,
      }))
      .sort((a, b) => b.cents - a.cents);

    return {
      totalRevenueCents,
      completedCount,
      canceledCount: canceled.length,
      avgTicketCents,
      totalItemsCount,
      paymentMethods,
    };
  }, [effectiveSales]);

  // Filtered sales based on search and channel
  const filteredSales = useMemo(() => {
    return effectiveSales
      .filter((s) => {
        // Channel filter
        if (channelFilter === "pdv" && s.appointment_id) return false;
        if (channelFilter === "appointment" && !s.appointment_id) return false;

        // Search term filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase().trim();

        const matchId = String(s.id).includes(q);
        const clientName = (s.client?.name || s.appointment?.client?.name || "").toLowerCase();
        const matchClient = clientName.includes(q);
        const petsText = getSalePets(s).toLowerCase();
        const matchPet = petsText.includes(q);
        const matchItem = s.items?.some((item) => item.name.toLowerCase().includes(q));

        return matchId || matchClient || matchPet || matchItem;
      })
      .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());
  }, [effectiveSales, channelFilter, searchTerm]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            p: { xs: 2, sm: 2.5 },
            bgcolor: "#f8fafc",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "#313485",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(49, 52, 133, 0.25)",
              }}
            >
              <Calendar size={22} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                  Relatório de Vendas do Dia
                </Typography>
                <Chip
                  label={fmtBRL(stats.totalRevenueCents)}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    fontSize: "0.85rem",
                    height: 24,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.3 }}>
                {formattedFullDate}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Atualizar vendas do dia">
              <span>
                <IconButton
                  onClick={async () => {
                    setIsManualRefreshing(true);
                    try {
                      if (onRefresh) onRefresh();
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ["day-sales"] }),
                        refetch(),
                      ]);
                    } finally {
                      setIsManualRefreshing(false);
                    }
                  }}
                  disabled={isSyncing}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": { bgcolor: "#e2e8f0", color: "#313485" },
                  }}
                >
                  <Box
                    component={RefreshCw}
                    size={19}
                    sx={{
                      animation: isSyncing ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { bgcolor: "#e2e8f0", color: "text.primary" },
              }}
            >
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: "auto" }}>
          {/* KPI Mini-Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Card 1: Faturamento */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderTop: "3.5px solid #10b981",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <DollarSign size={15} color="#059669" />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  FATURAMENTO
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color="success.main">
                {fmtBRL(stats.totalRevenueCents)}
              </Typography>
            </Paper>

            {/* Card 2: Vendas Realizadas */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderTop: "3.5px solid #313485",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <ShoppingCart size={15} color="#313485" />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  VENDAS CONCLUÍDAS
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {stats.completedCount}
                </Typography>
                {stats.canceledCount > 0 && (
                  <Typography variant="caption" color="error.main" fontWeight={600}>
                    ({stats.canceledCount} cancelada{stats.canceledCount > 1 ? "s" : ""})
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Card 3: Ticket Médio */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderTop: "3.5px solid #8b5cf6",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <TrendingUp size={15} color="#7c3aed" />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  TICKET MÉDIO
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                {fmtBRL(stats.avgTicketCents)}
              </Typography>
            </Paper>

            {/* Card 4: Itens Vendidos */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderTop: "3.5px solid #f59e0b",
                bgcolor: "#ffffff",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <Package size={15} color="#d97706" />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  ITENS / SERVIÇOS
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                {stats.totalItemsCount}
              </Typography>
            </Paper>
          </Box>

          {/* Payment Methods Breakdown Strip */}
          {stats.paymentMethods.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                mb: 3,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5 }}>
                FORMAS DE PAGAMENTO:
              </Typography>
              {stats.paymentMethods.map((pm) => {
                const colors = PAYMENT_CHIP_COLORS[pm.method] || PAYMENT_CHIP_COLORS.other;
                return (
                  <Chip
                    key={pm.method}
                    size="small"
                    label={`${pm.label}: ${fmtBRL(pm.cents)} (${pm.pct.toFixed(0)}%)`}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      bgcolor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      height: 26,
                    }}
                  />
                );
              })}
            </Paper>
          )}

          {/* Search and Filters Bar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              mb: 2,
            }}
          >
            <TextField
              size="small"
              placeholder="Buscar por cliente, pet, item ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                minWidth: { xs: "100%", sm: 300 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748B" />
                  </InputAdornment>
                ),
                ...(searchTerm && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm("")}>
                        <X size={14} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }),
              }}
            />

            <Stack direction="row" spacing={1}>
              <Chip
                label={`Todas (${effectiveSales.length})`}
                clickable
                color={channelFilter === "all" ? "primary" : "default"}
                variant={channelFilter === "all" ? "filled" : "outlined"}
                onClick={() => setChannelFilter("all")}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />
              <Chip
                label={`PDV (${effectiveSales.filter((s) => !s.appointment_id).length})`}
                clickable
                color={channelFilter === "pdv" ? "primary" : "default"}
                variant={channelFilter === "pdv" ? "filled" : "outlined"}
                onClick={() => setChannelFilter("pdv")}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />
              <Chip
                label={`Agendamento (${effectiveSales.filter((s) => Boolean(s.appointment_id)).length})`}
                clickable
                color={channelFilter === "appointment" ? "primary" : "default"}
                variant={channelFilter === "appointment" ? "filled" : "outlined"}
                onClick={() => setChannelFilter("appointment")}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />
            </Stack>
          </Box>

          {/* Sales Table */}
          {filteredSales.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: 6,
                px: 2,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
              }}
            >
              <Receipt size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
              <Typography variant="body1" fontWeight={600} color="text.secondary">
                Nenhuma venda encontrada para esta data com os filtros atuais.
              </Typography>
              {searchTerm && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setSearchTerm("")}
                  sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
                >
                  Limpar busca
                </Button>
              )}
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      HORA / ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      CLIENTE / PET
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      CANAL
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      PAGAMENTO
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      TOTAL
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      STATUS
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>
                      ITENS DA VENDA
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSales.map((sale) => {
                    const clientName =
                      sale.client?.name || sale.appointment?.client?.name || "Consumidor (Balcão)";
                    const petsText = getSalePets(sale);
                    const isAppointment = Boolean(sale.appointment_id);
                    const time = dayjs(sale.created_at).format("HH:mm");
                    const colors = PAYMENT_CHIP_COLORS[sale.payment_method] || PAYMENT_CHIP_COLORS.other;

                    return (
                      <TableRow
                        key={sale.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Time / ID */}
                        <TableCell sx={{ py: 1.25 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Clock size={13} color="#64748B" />
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                              {time}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            #{sale.id}
                          </Typography>
                        </TableCell>

                        {/* Client / Pet */}
                        <TableCell sx={{ py: 1.25 }}>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 400,
                                fontSize: "0.82rem",
                                lineHeight: 1.25,
                              }}
                            >
                              {clientName}
                            </Typography>
                            {petsText ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.primary",
                                  fontSize: "0.88rem",
                                  lineHeight: 1.3,
                                }}
                              >
                                {petsText}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.disabled",
                                  fontSize: "0.75rem",
                                  lineHeight: 1.3,
                                }}
                              >
                                —
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Channel */}
                        <TableCell sx={{ py: 1.25 }}>
                          <Chip
                            size="small"
                            label={isAppointment ? "Agendamento" : "PDV"}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.72rem",
                              height: 22,
                              bgcolor: isAppointment ? "#e0f2fe" : "#f1f5f9",
                              color: isAppointment ? "#0369a1" : "#475569",
                              border: `1px solid ${isAppointment ? "#bae6fd" : "#cbd5e1"}`,
                            }}
                          />
                        </TableCell>

                        {/* Payment */}
                        <TableCell sx={{ py: 1.25 }}>
                          <Chip
                            size="small"
                            label={formatPaymentMethod(sale.payment_method)}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.72rem",
                              height: 22,
                              bgcolor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          />
                          {sale.payments && sale.payments.length > 1 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", fontSize: "0.68rem", mt: 0.25 }}
                            >
                              ({sale.payments.length} formas)
                            </Typography>
                          )}
                        </TableCell>

                        {/* Total */}
                        <TableCell align="right" sx={{ py: 1.25 }}>
                          <Typography variant="body2" fontWeight={800} color="text.primary">
                            {fmtBRL(Math.round(sale.total_amount * 100))}
                          </Typography>
                          {sale.discount_amount > 0 && (
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ display: "block", textDecoration: "line-through" }}
                            >
                              Desc: {fmtBRL(Math.round(sale.discount_amount * 100))}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center" sx={{ py: 1.25 }}>
                          <Chip
                            size="small"
                            label={sale.status === "completed" ? "Concluída" : "Cancelada"}
                            color={sale.status === "completed" ? "success" : "error"}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 20,
                            }}
                          />
                        </TableCell>

                        {/* Itens da Venda / Detalhes */}
                        <TableCell align="center" sx={{ py: 1.25 }}>
                          <Tooltip title="Ver itens e detalhes da venda">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedSaleId(sale.id)}
                              endIcon={<ArrowRight size={13} />}
                              sx={{
                                textTransform: "none",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                py: 0.3,
                                px: 1.25,
                                borderRadius: 1.75,
                                borderColor: "#313485",
                                color: "#313485",
                                "&:hover": {
                                  bgcolor: "rgba(49, 52, 133, 0.08)",
                                  borderColor: "#313485",
                                },
                              }}
                            >
                              Detalhes
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <Divider />

        {/* Footer */}
        <DialogActions
          sx={{
            p: 2,
            px: 3,
            bgcolor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Exibindo {filteredSales.length} de {effectiveSales.length} vendas registradas no dia
          </Typography>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              bgcolor: "#313485",
              color: "#ffffff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              "&:hover": { bgcolor: "#242767" },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sale Details Sub-Modal */}
      {selectedSaleId && (
        <SaleDetailsModal
          open={Boolean(selectedSaleId)}
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </>
  );
}
