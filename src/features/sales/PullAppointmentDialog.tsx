import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Typography,
  Box,
  IconButton,
  Chip,
  Paper,
} from "@mui/material";
import { X, Calendar, User, Dog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../../api/services/appointments";
import dayjs from "dayjs";
import type { Appointment } from "../appointments/types";

interface PullAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (appointment: Appointment) => void;
}

export default function PullAppointmentDialog({
  open,
  onClose,
  onSelect,
}: PullAppointmentDialogProps) {
  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ["appointments", "pull-list"],
    queryFn: () => getAppointmentsByTenant(),
  });

  // Filter for confirmed, in-progress or completed appointments that are recent (today or yesterday)
  const pullableAppointments = allAppointments
    .filter((apt) => {
      const scheduledDate = dayjs(apt.scheduled_at);
      // Include appointments from today or yesterday to be more flexible with timezones/late work
      const isRecent = scheduledDate.isAfter(
        dayjs().subtract(1, "day").startOf("day"),
      );

      const isPullableStatus = [
        "confirmed",
        "in_progress",
        "completed",
      ].includes(apt.status);
      return isRecent && isPullableStatus;
    })
    .sort((a, b) => dayjs(b.scheduled_at).diff(dayjs(a.scheduled_at)));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Calendar size={20} />
          <Typography variant="h6" fontWeight={700}>
            Puxar Agendamento do Dia
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Carregando agendamentos...
            </Typography>
          </Box>
        ) : pullableAppointments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.primary">
              Nenhum agendamento pendente encontrado para hoje.
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {pullableAppointments.map((apt) => (
              <ListItem
                key={apt.id}
                component={Paper}
                elevation={0}
                onClick={() => onSelect(apt)}
                sx={{
                  m: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  cursor: "pointer",
                  width: "auto",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        {dayjs(apt.scheduled_at).format("HH:mm")}
                      </Typography>
                      <Chip
                        label={
                          apt.status === "confirmed"
                            ? "Confirmado"
                            : apt.status === "in_progress"
                              ? "Em Andamento"
                              : "Finalizado"
                        }
                        size="small"
                        color={
                          apt.status === "confirmed"
                            ? "info"
                            : apt.status === "in_progress"
                              ? "warning"
                              : "success"
                        }
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                      {apt.status === "completed" && !apt.is_paid && (
                        <Chip
                          label="PAGAMENTO PENDENTE"
                          size="small"
                          color="error"
                          variant="filled"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 900,
                            animation: "pulse 2s infinite",
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="subtitle2"
                      color={apt.is_fully_package_covered ? "success.main" : "primary.main"}
                      fontWeight={800}
                    >
                      {apt.is_fully_package_covered
                        ? "Pacote"
                        : `R$ ${(
                            apt.items.reduce(
                              (acc, item) =>
                                acc +
                                item.services
                                  .filter((s) => !s.is_package_covered)
                                  .reduce((sAcc, s) => sAcc + s.price_cents, 0),
                              0,
                            ) / 100
                          ).toFixed(2)}`}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <User size={14} color="gray" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {apt.client.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {apt.items.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "action.hover",
                          px: 1,
                          borderRadius: 1,
                        }}
                      >
                        <Dog size={12} color="gray" />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {item.pet.name}:
                        </Typography>
                        <Typography variant="caption">
                          {item.services.map((s) => s.name).join(", ")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
