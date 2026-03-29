import { Box, Skeleton, Typography } from "@mui/material";
import { CalendarDays, CalendarCheck, DollarSign } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import type { Appointment } from "../appointments/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import theme from "../../theme";

type Props = {
  appointments: Appointment[];
  isFetching?: boolean;
};

const SummaryCard = ({
  icon,
  label,
  value,
  iconColor,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor: string;
  bgColor: string;
}) => (
  <CustomCard
    sx={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 2,
      p: 2,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: "12px",
        backgroundColor: bgColor,
        color: iconColor,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="body2"
        color="text.disabled"
        sx={{ fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
        {value}
      </Typography>
    </Box>
  </CustomCard>
);

export default function DashboardSummaryCards({ appointments, isFetching = false }: Props) {
  const totalAppointments = appointments.length;

  const completedAppointments = appointments.filter(
    (a) => a.status === "completed",
  );

  const totalRevenueCents = completedAppointments.reduce(
    (acc, a) => acc + getAppointmentTotal(a),
    0,
  );

  const confirmedCount = appointments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "completed" ||
      a.status === "in_progress",
  ).length;

  const formattedRevenue = (totalRevenueCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        width: "100%",
        mb: 2,
        flexWrap: { xs: "wrap", sm: "nowrap" },
      }}
    >
      <SummaryCard
        icon={<CalendarDays size={24} />}
        label="Agendamentos do dia"
        value={isFetching ? <Skeleton width={40} sx={{ bgcolor: "grey.200" }} /> : totalAppointments}
        iconColor={theme.palette.primary.main}
        bgColor="rgba(49, 52, 133, 0.1)"
      />
      <SummaryCard
        icon={<DollarSign size={24} />}
        label="Faturamento do dia"
        value={isFetching ? <Skeleton width={80} sx={{ bgcolor: "grey.200" }} /> : formattedRevenue}
        iconColor={theme.palette.success.main}
        bgColor="rgba(46, 125, 50, 0.1)"
      />
      <SummaryCard
        icon={<CalendarCheck size={24} />}
        label="Agendamentos confirmados"
        value={isFetching ? <Skeleton width={40} sx={{ bgcolor: "grey.200" }} /> : confirmedCount}
        iconColor={theme.palette.info.main}
        bgColor="rgba(2, 136, 209, 0.1)"
      />
    </Box>
  );
}
