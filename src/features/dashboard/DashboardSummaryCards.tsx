import { Box, Skeleton, Typography, Grid, Divider } from "@mui/material";
import { CalendarDays, CalendarCheck, DollarSign, CalendarX } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import type { Appointment } from "../appointments/types";
import theme from "../../theme";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  appointments: Appointment[];
  revenueCents?: number;
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
      height: "100%",
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      p: { xs: 1.2, sm: 1.4 },
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        minWidth: 40,
        borderRadius: "10px",
        backgroundColor: bgColor,
        color: iconColor,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "text.primary",
          opacity: 0.6,
          fontSize: "0.8rem",
          display: "block",
          lineHeight: 1.2,
          mb: 0.15,
        }}
        noWrap
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "text.primary",
          fontSize: "1.25rem",
          lineHeight: 1.2,
        }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  </CustomCard>
);

export default function DashboardSummaryCards({ appointments, revenueCents = 0, isFetching = false }: Props) {
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";

  const totalAppointments = appointments.length;

  const confirmedCount = appointments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "completed" ||
      a.status === "in_progress",
  ).length;

  const cancelledCount = appointments.filter(
    (a) => a.status === "canceled",
  ).length;

  const formattedRevenue = (revenueCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Box sx={{ width: "100%", mb: { xs: 1.25, sm: 1.75 } }}>
      {/* ── MOBILE: Todos os 4 em 1 única linha compacta ── */}
      <CustomCard
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 1.25,
          borderRadius: 2.5,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Agendados */}
        <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
          <Typography
            sx={{
              color: "primary.main",
              fontWeight: 700,
              fontSize: { xs: "0.62rem", sm: "0.75rem" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.35,
              lineHeight: 1,
            }}
          >
            <CalendarDays size={12} /> Agendados
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "text.primary", lineHeight: 1.2, mt: 0.35 }}>
            {isFetching ? <Skeleton width={20} sx={{ mx: "auto" }} /> : totalAppointments}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />

        {/* Confirmados */}
        <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
          <Typography
            sx={{
              color: "info.main",
              fontWeight: 700,
              fontSize: { xs: "0.62rem", sm: "0.75rem" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.35,
              lineHeight: 1,
            }}
          >
            <CalendarCheck size={12} /> Confirmados
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "text.primary", lineHeight: 1.2, mt: 0.35 }}>
            {isFetching ? <Skeleton width={20} sx={{ mx: "auto" }} /> : confirmedCount}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />

        {/* Cancelados */}
        <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
          <Typography
            sx={{
              color: "error.main",
              fontWeight: 700,
              fontSize: { xs: "0.62rem", sm: "0.75rem" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.35,
              lineHeight: 1,
            }}
          >
            <CalendarX size={12} /> Cancelados
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "text.primary", lineHeight: 1.2, mt: 0.35 }}>
            {isFetching ? <Skeleton width={20} sx={{ mx: "auto" }} /> : cancelledCount}
          </Typography>
        </Box>

        {isOwnerOrAdmin && (
          <>
            <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />

            {/* Faturamento */}
            <Box sx={{ flex: 1.25, textAlign: "center", minWidth: 0, px: 0.25 }}>
              <Typography
                sx={{
                  color: "success.main",
                  fontWeight: 700,
                  fontSize: { xs: "0.62rem", sm: "0.75rem" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  lineHeight: 1,
                }}
              >
                <DollarSign size={12} /> Faturamento
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "text.primary", lineHeight: 1.2, mt: 0.35 }} noWrap>
                {isFetching ? <Skeleton width={40} sx={{ mx: "auto" }} /> : formattedRevenue}
              </Typography>
            </Box>
          </>
        )}
      </CustomCard>

      {/* ── DESKTOP: Cards Individuais em Grade ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ display: { xs: "none", md: "flex" } }}>
        <Grid size={{ md: 6, lg: 3 }}>
          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Agendamentos"
            value={isFetching ? <Skeleton width={40} sx={{ bgcolor: "grey.200" }} /> : totalAppointments}
            iconColor={theme.palette.primary.main}
            bgColor="rgba(49, 52, 133, 0.1)"
          />
        </Grid>
        <Grid size={{ md: 6, lg: 3 }}>
          <SummaryCard
            icon={<CalendarCheck size={20} />}
            label="Confirmados"
            value={isFetching ? <Skeleton width={40} sx={{ bgcolor: "grey.200" }} /> : confirmedCount}
            iconColor={theme.palette.info.main}
            bgColor="rgba(2, 136, 209, 0.1)"
          />
        </Grid>
        <Grid size={{ md: 6, lg: 3 }}>
          <SummaryCard
            icon={<CalendarX size={20} />}
            label="Cancelados"
            value={isFetching ? <Skeleton width={40} sx={{ bgcolor: "grey.200" }} /> : cancelledCount}
            iconColor={theme.palette.error.main}
            bgColor="rgba(211, 47, 47, 0.1)"
          />
        </Grid>
        {isOwnerOrAdmin && (
          <Grid size={{ md: 6, lg: 3 }}>
            <SummaryCard
              icon={<DollarSign size={20} />}
              label="Faturamento"
              value={isFetching ? <Skeleton width={80} sx={{ bgcolor: "grey.200" }} /> : formattedRevenue}
              iconColor={theme.palette.success.main}
              bgColor="rgba(46, 125, 50, 0.1)"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
