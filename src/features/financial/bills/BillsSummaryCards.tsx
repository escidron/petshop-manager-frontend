import { Box, Card, Typography, Chip, alpha } from "@mui/material";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { FinancialBillsSummary } from "./types";

interface Props {
  summary?: FinancialBillsSummary;
}

const fmtBRL = (val: number = 0) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BillsSummaryCards({ summary }: Props) {
  const totalPayable = summary?.total_payable ?? 0;
  const payablePaid = summary?.payable_paid ?? 0;
  const payablePending = summary?.payable_pending ?? 0;
  const payableOverdue = summary?.payable_overdue ?? 0;
  const overdueCount = (summary?.payable_overdue_count ?? 0) + (summary?.receivable_overdue_count ?? 0);

  const totalReceivable = summary?.total_receivable ?? 0;
  const receivablePaid = summary?.receivable_paid ?? 0;
  const receivablePending = summary?.receivable_pending ?? 0;

  const netBalanceProjected =
    summary?.net_balance_projected ?? (totalReceivable - totalPayable);
  const netBalanceRealized =
    summary?.net_balance_realized ?? (receivablePaid - payablePaid);
  const netBalancePending =
    summary?.net_balance_pending ?? (receivablePending - payablePending);
  const isNetPositive = netBalanceProjected >= 0;

  const totalOverdueAmount = payableOverdue + (summary?.receivable_overdue ?? 0);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 1.5,
        mb: 2,
        flexShrink: 0,
      }}
    >
      {/* Card 1: A Pagar */}
      <Card
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "4px solid #EF4444",
          borderRadius: 2.5,
          bgcolor: "background.paper",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}
          >
            Contas a Pagar
          </Typography>
          <Box
            sx={{
              p: 0.6,
              borderRadius: 1.5,
              bgcolor: alpha("#EF4444", 0.1),
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowUpRight size={16} />
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={800} color="#DC2626" sx={{ fontSize: "1.3rem", lineHeight: 1.2 }}>
          {fmtBRL(totalPayable)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, pt: 0.75, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            Pago: <strong>{fmtBRL(payablePaid)}</strong>
          </Typography>
          <Typography variant="caption" color="#B91C1C" sx={{ fontSize: "0.72rem", fontWeight: 700 }}>
            Pendente: {fmtBRL(payablePending)}
          </Typography>
        </Box>
      </Card>

      {/* Card 2: A Receber */}
      <Card
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "4px solid #10B981",
          borderRadius: 2.5,
          bgcolor: "background.paper",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}
          >
            Contas a Receber
          </Typography>
          <Box
            sx={{
              p: 0.6,
              borderRadius: 1.5,
              bgcolor: alpha("#10B981", 0.1),
              color: "#10B981",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowDownLeft size={16} />
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={800} color="#059669" sx={{ fontSize: "1.3rem", lineHeight: 1.2 }}>
          {fmtBRL(totalReceivable)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, pt: 0.75, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            Recebido: <strong>{fmtBRL(receivablePaid)}</strong>
          </Typography>
          <Typography variant="caption" color="#047857" sx={{ fontSize: "0.72rem", fontWeight: 700 }}>
            Pendente: {fmtBRL(receivablePending)}
          </Typography>
        </Box>
      </Card>

      {/* Card 3: Saldo do Período */}
      <Card
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          border: "1px solid",
          borderColor: "divider",
          borderLeft: `4px solid ${isNetPositive ? "#10B981" : "#EF4444"}`,
          borderRadius: 2.5,
          bgcolor: "background.paper",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}
          >
            Saldo do Período
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={isNetPositive ? "Superávit" : "Déficit"}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 800,
                bgcolor: alpha(isNetPositive ? "#10B981" : "#EF4444", 0.12),
                color: isNetPositive ? "#059669" : "#DC2626",
              }}
            />
            <Box
              sx={{
                p: 0.6,
                borderRadius: 1.5,
                bgcolor: alpha(isNetPositive ? "#10B981" : "#EF4444", 0.1),
                color: isNetPositive ? "#10B981" : "#EF4444",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Scale size={16} />
            </Box>
          </Box>
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          color={isNetPositive ? "#059669" : "#DC2626"}
          sx={{ fontSize: "1.3rem", lineHeight: 1.2 }}
        >
          {fmtBRL(netBalanceProjected)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, pt: 0.75, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            Realizado: <strong>{fmtBRL(netBalanceRealized)}</strong>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: netBalancePending >= 0 ? "#059669" : "#DC2626",
            }}
          >
            Pendente: {fmtBRL(netBalancePending)}
          </Typography>
        </Box>
      </Card>

      {/* Card 4: Títulos Vencidos */}
      <Card
        elevation={0}
        sx={{
          py: 1.5,
          px: 2,
          border: "1px solid",
          borderColor: overdueCount > 0 ? alpha("#EF4444", 0.35) : "divider",
          borderLeft: `4px solid ${overdueCount > 0 ? "#DC2626" : "#10B981"}`,
          borderRadius: 2.5,
          bgcolor: overdueCount > 0 ? alpha("#EF4444", 0.03) : "background.paper",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}
          >
            Contas Vencidas
          </Typography>
          <Box
            sx={{
              p: 0.6,
              borderRadius: 1.5,
              bgcolor: alpha(overdueCount > 0 ? "#DC2626" : "#10B981", 0.1),
              color: overdueCount > 0 ? "#DC2626" : "#10B981",
              display: "flex",
              alignItems: "center",
            }}
          >
            {overdueCount > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          </Box>
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          color={overdueCount > 0 ? "#DC2626" : "#059669"}
          sx={{ fontSize: "1.3rem", lineHeight: 1.2 }}
        >
          {fmtBRL(totalOverdueAmount)}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, pt: 0.75, borderTop: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            A Pagar Vencido: <strong>{fmtBRL(payableOverdue)}</strong>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: overdueCount > 0 ? "#DC2626" : "#059669",
            }}
          >
            {overdueCount > 0 ? `${overdueCount} em atraso` : "Em dia"}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
