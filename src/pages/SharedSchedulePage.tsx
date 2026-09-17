import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingScreen from "../components/Loading/LoadingScreen";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import {
  Calendar,
  Clock,
  MessageSquare,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getPublicSchedule, type PublicFreelancerSchedule } from "../api/services/employees";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../theme";

dayjs.locale("pt-br");

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  bather: "Banhista",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Entregador/Motorista",
  other: "Prestador",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; borderLeftColor: string }
> = {
  pending: {
    label: "Pendente",
    color: "#e65100",
    bg: "rgba(255, 152, 0, 0.15)",
    borderLeftColor: "#ffa726",
  },
  confirmed: {
    label: "Confirmado",
    color: "#2e7d32",
    bg: "rgba(76, 175, 80, 0.15)",
    borderLeftColor: "#66bb6a",
  },
  in_progress: {
    label: "Em Andamento",
    color: "#1565c0",
    bg: "rgba(33, 150, 243, 0.15)",
    borderLeftColor: "#29b6f6",
  },
  completed: {
    label: "Concluído",
    color: "#4caf50",
    bg: "rgba(76, 175, 80, 0.25)",
    borderLeftColor: "#4caf50",
  },
  no_show: {
    label: "Faltou",
    color: "#c62828",
    bg: "rgba(244, 67, 54, 0.15)",
    borderLeftColor: "#ef5350",
  },
};

export default function SharedSchedulePage() {
  const { token } = useParams<{ token: string }>();
  const [schedule, setSchedule] = useState<PublicFreelancerSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedule = async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPublicSchedule(token);
      setSchedule(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Não foi possível carregar a agenda. Verifique se o link está correto."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return <LoadingScreen message="Carregando sua agenda profissional..." />;
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          p: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            borderRadius: 3,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            textAlign: "center",
            p: 3,
          }}
        >
          <AlertCircle size={48} color={theme.palette.error.main} style={{ margin: "0 auto 16px" }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Ops! Algo deu errado
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            O petshop pode ter cancelado ou gerado um novo link de acesso por segurança.
          </Typography>
        </Card>
      </Box>
    );
  }

  // Group appointments by date
  const appointmentsByDate = schedule?.appointments.reduce((acc, appt) => {
    const dateStr = dayjs(appt.scheduled_at).format("YYYY-MM-DD");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(appt);
    return acc;
  }, {} as Record<string, typeof schedule.appointments>) || {};

  const sortedDates = Object.keys(appointmentsByDate).sort();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        color: "white",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            px: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.5px" }}>
              Olá, {schedule?.employee_name}!
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 600, color: "#ffb74d" }}>
              Sua agenda de {ROLE_LABELS[schedule?.employee_role || ""] || "colaborador(a)"} no {schedule?.petshop_name}
            </Typography>
          </Box>
          <IconButton
            onClick={() => fetchSchedule(true)}
            disabled={refreshing}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </IconButton>
        </Box>

        {/* AGENDA LIST */}
        {sortedDates.length === 0 ? (
          <Card
            sx={{
              borderRadius: 4,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              color: "text.primary",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              textAlign: "center",
              py: 8,
              px: 3,
            }}
          >
            <Calendar size={48} color="#2a5298" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
              Nenhum agendamento
            </Typography>
            <Typography variant="body2" color="text.primary">
              Você não possui serviços agendados para os próximos dias no momento.
            </Typography>
          </Card>
        ) : (
          sortedDates.map((dateStr) => {
            const dateObj = dayjs(dateStr);
            const isToday = dateObj.isSame(dayjs(), "day");
            const dayTitle = isToday
              ? "Hoje"
              : dateObj.format("dddd, D [de] MMMM");

            return (
              <Box key={dateStr} sx={{ mb: 4 }}>
                {/* DATE BADGE */}
                <Typography
                  variant="overline"
                  fontWeight={800}
                  sx={{
                    ml: 2,
                    mb: 1.5,
                    display: "block",
                    letterSpacing: "1px",
                    color: isToday ? "#ffb74d" : "rgba(255,255,255,0.8)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  {dayTitle}
                </Typography>

                {/* CARDS FOR THIS DATE */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {appointmentsByDate[dateStr].map((appt) => {
                    const timeStr = dayjs(appt.scheduled_at).format("HH:mm");
                    const status = STATUS_CONFIG[appt.status] || {
                      label: appt.status,
                      color: "#757575",
                      bg: "rgba(0,0,0,0.05)",
                      borderLeftColor: "#757575",
                    };

                    const totalDurationMinutes = appt.items
                      .flatMap((item) => item.services)
                      .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);
                    const endTime =
                      totalDurationMinutes > 0
                        ? dayjs(appt.scheduled_at).add(totalDurationMinutes, "minute")
                        : null;

                    return (
                      <Card
                        key={appt.id}
                        sx={{
                          borderRadius: 4,
                          bgcolor: "background.paper",
                          color: "text.primary",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          borderLeft: `6px solid ${status.borderLeftColor}`,
                          overflow: "hidden",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 25px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          {/* TOP ROW: TIME & STATUS */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                bgcolor: "rgba(49, 52, 133, 0.08)",
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 1.5,
                              }}
                            >
                              <Clock size={15} color="#313485" />
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="primary"
                              >
                                {timeStr} {endTime ? ` - ${endTime.format("HH:mm")}` : ""}
                              </Typography>
                            </Box>
                            <Chip
                              label={status.label}
                              size="small"
                              sx={{
                                bgcolor: status.bg,
                                color: status.color,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                px: 1,
                                height: 24,
                                borderRadius: 1,
                              }}
                            />
                          </Box>

                          <Divider sx={{ mb: 1.5, opacity: 0.6 }} />

                          {/* MIDDLE SECTION: DETAILS */}
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                            {/* Tutor Info */}
                            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                Tutor:
                              </Typography>
                              <Typography variant="body2" color="text.primary">
                                {appt.client_name}
                              </Typography>
                            </Box>

                            {/* Pet Info */}
                            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                Pet:
                              </Typography>
                              <Typography variant="body2" color="text.primary">
                                {appt.items
                                  .map((item) => `${item.pet.name}${item.pet.breed ? ` (${item.pet.breed})` : ""}`)
                                  .join(", ")}
                              </Typography>
                            </Box>

                            {/* Services Info */}
                            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                Serviços:
                              </Typography>
                              <Typography variant="body2" color="text.primary">
                                {appt.items
                                  .flatMap((item) => item.services)
                                  .map((svc) => `${svc.name}${svc.duration_minutes ? ` (${svc.duration_minutes} min)` : ""}`)
                                  .join(", ")}
                              </Typography>
                            </Box>
                          </Box>

                          {/* OBSERVATIONS */}
                          {appt.notes && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                bgcolor: "#fffdf5",
                                border: "1px dashed #ffe082",
                                borderRadius: 2,
                                p: 1,
                                mt: 1.5,
                              }}
                            >
                              <MessageSquare size={14} color="#ffb300" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <Box>
                                <Typography variant="caption" fontWeight={700} color="#b78103" display="block" sx={{ textTransform: "uppercase" }}>
                                  Observações:
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ mt: 0.25, fontSize: "0.8rem", lineHeight: 1.25 }}>
                                  {appt.notes}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            );
          })
        )}
      </Container>
    </Box>
  );
}
