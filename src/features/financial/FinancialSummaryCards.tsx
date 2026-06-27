import { Box, Skeleton, Typography } from "@mui/material";
import { DollarSign, CheckCircle2, Calculator, XCircle } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import theme from "../../theme";
import type { FinancialSummary } from "./types";

type Props = {
  summary: FinancialSummary;
  isLoading?: boolean;
};

const FinancialCard = ({
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
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.disabled" fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ color: color }}>{icon}</Box>
    </Box>
    <Typography variant="h5" fontWeight={700}>
      {value}
    </Typography>
  </CustomCard>
);

export default function FinancialSummaryCards({ summary, isLoading = false }: Props) {
  const formattedRevenue = (summary.totalRevenueCents / 100).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  const formattedTicket = (summary.averageTicketCents / 100).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 4,
        flexWrap: "wrap",
      }}
    >
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <CustomCard key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={40} />
          </CustomCard>
        ))
      ) : (
        <>
          <FinancialCard
            icon={<DollarSign size={20} />}
            label="FATURAMENTO TOTAL"
            value={formattedRevenue}
            color={theme.palette.success.main}
          />
          <FinancialCard
            icon={<CheckCircle2 size={20} />}
            label="ATENDIMENTOS"
            value={summary.completedCount}
            color={theme.palette.primary.main}
          />
          <FinancialCard
            icon={<Calculator size={20} />}
            label="TICKET MÉDIO"
            value={formattedTicket}
            color={theme.palette.info.main}
          />
          <FinancialCard
            icon={<XCircle size={20} />}
            label="CANCELAMENTOS"
            value={summary.canceledCount}
            color={theme.palette.error.main}
          />
        </>
      )}
    </Box>
  );
}
