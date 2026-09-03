import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  List,
  ListItem,
  Divider,
} from "@mui/material";
import { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { listSales } from "../../api/services/sales";
import { getAppointmentsByTenant } from "../../api/services/appointments";
import { fetchClients } from "../../api/services/clients";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import theme from "../../theme";
import type { SaleResponse } from "../../features/sales/schemas";
import type { Appointment } from "../../features/appointments/types";
import type { Client } from "../../features/clients/types";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  money: "Dinheiro",
  other: "Outro",
  package: "Pacote",
  Pacote: "Pacote",
  pending: "Pendente (A Receber)",
  Pendente: "Pendente (A Receber)",
};

const PAYMENT_COLORS: Record<string, string> = {
  pix: theme.palette.success.main,
  credit_card: theme.palette.primary.main,
  debit_card: theme.palette.info.main,
  money: theme.palette.warning.main,
  other: theme.palette.text.disabled,
};

type SalesSummaryReportProps = {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SalesSummaryReport({ startDate, endDate }: SalesSummaryReportProps) {
  // Queries
  const { data: allSales = [], isLoading: loadingSales } = useQuery<SaleResponse[]>({
    queryKey: ["sales-summary", startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")],
    queryFn: () =>
      listSales(startDate?.format("YYYY-MM-DD"), endDate?.format("YYYY-MM-DD")),
  });

  const { data: allAppointments = [], isLoading: loadingApts } = useQuery<Appointment[]>({
    queryKey: [
      "appointments-summary",
      startDate?.format("YYYY-MM-DD"),
      endDate?.format("YYYY-MM-DD"),
    ],
    queryFn: () =>
      getAppointmentsByTenant(
        startDate?.format("YYYY-MM-DD"),
        endDate?.format("YYYY-MM-DD"),
      ),
  });

  const { data: allClients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ["clients-summary-list"],
    queryFn: fetchClients,
  });

  const isLoading = loadingSales || loadingApts || loadingClients;

  // Formatting Sales & Appointments into a transaction list
  const transactions = useMemo(() => {
    const saleRows = allSales.map((s) => ({
      id: `sale-${s.id}`,
      date: s.created_at,
      clientId: s.client_id,
      type: s.appointment_id ? "Agendamento" : "Venda PDV",
      payment_method: s.payment_method,
      amount_cents: Math.round(s.total_amount * 100),
      status: s.status,
      items: s.items ?? [],
    }));

    const aptRows = allAppointments
      .filter((a) => a.status === "completed" && !a.is_paid)
      .map((a) => ({
        id: `apt-${a.id}`,
        date: a.scheduled_at,
        clientId: a.client.id,
        type: a.is_fully_package_covered ? "Pago via Pacote" : "Agendamento",
        payment_method: a.is_fully_package_covered ? "Pacote" : "Pendente",
        amount_cents: getAppointmentTotal(a),
        status: "completed",
        items: [],
      }));

    return [...saleRows, ...aptRows];
  }, [allSales, allAppointments]);

  // KPI Calculations
  const stats = useMemo(() => {
    // Filter out canceled sales
    const completedTxs = transactions.filter((t) => t.status === "completed");
    
    // Revenue calculations (exclude package covered appointments because revenue is captured in package sales)
    const revenueTxs = completedTxs.filter((t) => t.type !== "Pago via Pacote");
    const totalRevenue = revenueTxs.reduce((acc, t) => acc + t.amount_cents, 0);

    // Count of PDV and completed sales
    const completedSalesCount = allSales.filter((s) => s.status === "completed").length;

    // Unique clients served
    const clientIds = new Set(completedTxs.map((t) => t.clientId).filter(Boolean));
    const uniqueClientsCount = clientIds.size;

    // Services performed:
    // 1. From completed appointments
    const completedAptsCount = allAppointments.filter((a) => a.status === "completed").length;
    // 2. From sales items of type service
    let serviceSalesCount = 0;
    allSales
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        s.items?.forEach((item) => {
          if (item.item_type === "service") {
            serviceSalesCount += item.quantity;
          }
        });
      });
    const totalServicesCount = completedAptsCount + serviceSalesCount;

    const avgTicket = revenueTxs.length > 0 ? totalRevenue / revenueTxs.length : 0;

    // Breakdown 1: Forma de Pagamento
    const byMethod: Record<string, number> = {};
    for (const t of revenueTxs) {
      const m = t.payment_method;
      byMethod[m] = (byMethod[m] ?? 0) + t.amount_cents;
    }
    const paymentBreakdown = Object.entries(byMethod)
      .map(([method, cents]) => ({
        method,
        label: PAYMENT_LABELS[method] ?? method,
        cents,
        pct: totalRevenue > 0 ? ((cents / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.cents - a.cents);

    // Breakdown 2: Vendas por Tipo
    let serviceRevenue = 0;
    let productRevenue = 0;
    let packageRevenue = 0;

    allSales
      .filter((s) => s.status === "completed")
      .forEach((s) => {
        s.items?.forEach((item) => {
          const amt = Math.round(item.subtotal * 100);
          if (item.item_type === "product") productRevenue += amt;
          else if (item.item_type === "service") serviceRevenue += amt;
          else if (item.item_type === "package") packageRevenue += amt;
        });
      });

    // Also add revenue from standalone appointments (not fully package covered)
    const standaloneApts = allAppointments.filter((a) => a.status === "completed" && !a.is_fully_package_covered && !a.is_paid);
    standaloneApts.forEach((a) => {
      serviceRevenue += getAppointmentTotal(a);
    });

    const totalTypeRevenue = serviceRevenue + productRevenue + packageRevenue;
    const typeBreakdown = [
      { label: "Serviços", cents: serviceRevenue, pct: totalTypeRevenue > 0 ? (serviceRevenue / totalTypeRevenue) * 100 : 0 },
      { label: "Produtos", cents: productRevenue, pct: totalTypeRevenue > 0 ? (productRevenue / totalTypeRevenue) * 100 : 0 },
      { label: "Pacotes", cents: packageRevenue, pct: totalTypeRevenue > 0 ? (packageRevenue / totalTypeRevenue) * 100 : 0 },
    ].sort((a, b) => b.cents - a.cents);

    // Breakdown 3: Vendas por Dia
    const byDay: Record<string, number> = {};
    revenueTxs.forEach((t) => {
      const day = dayjs(t.date).format("YYYY-MM-DD");
      byDay[day] = (byDay[day] ?? 0) + t.amount_cents;
    });

    const salesByDay = Object.entries(byDay)
      .map(([date, cents]) => ({
        date,
        formattedDate: dayjs(date).format("DD/MM/YYYY"),
        cents,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Calculation of new clients in the selected period
    const newClientsCount = allClients.filter((c) => {
      if (!c.created_at) return false;
      const created = dayjs(c.created_at);
      const isAfterStart = startDate ? !created.isBefore(startDate.startOf("day")) : true;
      const isBeforeEnd = endDate ? !created.isAfter(endDate.endOf("day")) : true;
      return isAfterStart && isBeforeEnd;
    }).length;

    return {
      totalRevenue,
      salesCount: completedSalesCount,
      uniqueClients: uniqueClientsCount,
      servicesCount: totalServicesCount,
      avgTicket,
      paymentBreakdown,
      typeBreakdown,
      salesByDay,
      newClientsCount,
    };
  }, [transactions, allSales, allAppointments, allClients, startDate, endDate]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2.5, sm: 3.5 },
        }}
      >
        {/* Card 1: Faturamento Acumulado - Destacado em largura total no mobile */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.75, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "divider",
            borderTop: `4px solid ${theme.palette.success.main}`,
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
            gridColumn: { xs: "span 2", sm: "span 1" },
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.72rem", sm: "0.75rem" } }}
          >
            FATURAMENTO ACUMULADO
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            color="success.main"
            sx={{ fontSize: { xs: "1.65rem", sm: "1.75rem" }, lineHeight: 1.2 }}
          >
            {fmtBRL(stats.totalRevenue)}
          </Typography>
        </Paper>

        {/* Card 2: Vendas Concluídas */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "divider",
            borderTop: `4px solid ${theme.palette.primary.main}`,
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
          >
            VENDAS CONCLUÍDAS
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.35rem", sm: "1.6rem" } }}
          >
            {stats.salesCount}
          </Typography>
        </Paper>

        {/* Card 3: Clientes Atendidos */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "divider",
            borderTop: `4px solid ${theme.palette.info.main}`,
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
          >
            CLIENTES ATENDIDOS
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.35rem", sm: "1.6rem" } }}
          >
            {stats.uniqueClients}
          </Typography>
        </Paper>

        {/* Card 4: Novos Clientes */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "divider",
            borderTop: "4px solid #8b5cf6",
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
          >
            NOVOS CLIENTES
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.35rem", sm: "1.6rem" } }}
          >
            {stats.newClientsCount}
          </Typography>
        </Paper>

        {/* Card 5: Serviços Realizados */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "success.light",
            borderTop: `4px solid ${theme.palette.warning.main}`,
            backgroundColor: "#e8f5e9",
            borderRadius: 2.5,
          }}
        >
          <Typography
            variant="caption"
            color="success.dark"
            fontWeight={800}
            sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
          >
            SERVIÇOS REALIZADOS
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            color="success.dark"
            sx={{ fontSize: { xs: "1.35rem", sm: "1.6rem" } }}
          >
            {stats.servicesCount}
          </Typography>
        </Paper>

        {/* Card 6: Ticket Médio */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            border: "1.5px solid",
            borderColor: "divider",
            borderTop: `4px solid ${theme.palette.secondary.main}`,
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
          >
            TICKET MÉDIO
          </Typography>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.18rem", sm: "1.45rem" }, lineHeight: 1.2 }}
          >
            {fmtBRL(stats.avgTicket)}
          </Typography>
        </Paper>
      </Box>

      {/* Breakdowns 3 Columns */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Column 1: Forma de Pagamento */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              height: "100%",
              minHeight: 280,
              borderRadius: 2.5,
              border: "1.5px solid",
              borderColor: "divider",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
              <DollarSign size={16} />
              FORMA DE PAGAMENTO
            </Typography>
            {stats.paymentBreakdown.length === 0 ? (
              <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 6 }}>
                Nenhum faturamento registrado.
              </Typography>
            ) : (
              <List disablePadding>
                {stats.paymentBreakdown.map((item, idx) => (
                  <Box key={item.method}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem disablePadding sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PAYMENT_COLORS[item.method] ?? "grey.400" }} />
                        <Typography variant="body2" fontWeight={600}>
                          {item.label}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        {item.pct.toFixed(1)}%
                      </Typography>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Column 2: Vendas por Tipo */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              height: "100%",
              minHeight: 280,
              borderRadius: 2.5,
              border: "1.5px solid",
              borderColor: "divider",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
              <Briefcase size={16} />
              VENDAS POR ÁREA
            </Typography>
            {stats.totalRevenue === 0 ? (
              <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 6 }}>
                Sem dados de vendas.
              </Typography>
            ) : (
              <List disablePadding>
                {stats.typeBreakdown.map((item, idx) => (
                  <Box key={item.label}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem disablePadding sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.label}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {item.pct.toFixed(1)}%
                      </Typography>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Column 3: Vendas por Dia */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              height: "100%",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              borderRadius: 2.5,
              border: "1.5px solid",
              borderColor: "divider",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2} display="flex" alignItems="center" gap={1}>
              <TrendingUp size={16} />
              VENDAS POR DIA
            </Typography>
            {stats.salesByDay.length === 0 ? (
              <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 6 }}>
                Nenhuma venda registrada.
              </Typography>
            ) : (
              <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 240, pr: 0.5 }}>
                <List disablePadding>
                  {stats.salesByDay.map((item, idx) => (
                    <Box key={item.date}>
                      {idx > 0 && <Divider sx={{ my: 0.75 }} />}
                      <ListItem disablePadding sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}>
                        <Typography variant="body2" color="text.primary">
                          {item.formattedDate}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {fmtBRL(item.cents)}
                        </Typography>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
