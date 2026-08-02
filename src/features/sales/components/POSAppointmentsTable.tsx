import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  alpha,
} from "@mui/material";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import type { Appointment } from "../../appointments/types";

interface POSAppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  searchTerm: string;
  getAppointmentPrice: (apt: Appointment) => number;
  onSelectAppointment: (apt: Appointment) => void;
}

export default function POSAppointmentsTable({
  appointments,
  isLoading,
  searchTerm,
  getAppointmentPrice,
  onSelectAppointment,
}: POSAppointmentsTableProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (appointments.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Calendar size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
          {searchTerm
            ? "Nenhum agendamento encontrado"
            : "Nenhum agendamento pendente de pagamento"}
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, opacity: 0.6 }}>
          {searchTerm
            ? "Tente buscar por outro nome"
            : "Agendamentos finalizados aparecerão aqui"}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                color: "text.primary",
                opacity: 0.5,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                borderBottom: "2px solid",
                borderColor: "divider",
                py: 1.25,
              },
            }}
          >
            <TableCell sx={{ pl: 3 }}>Cliente</TableCell>
            <TableCell>Pets</TableCell>
            <TableCell>Serviços</TableCell>
            <TableCell>Horário</TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>
              Valor
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map((apt) => {
            const priceCents = getAppointmentPrice(apt);
            const allPets = apt.items.map((item) => item.pet);
            const allServices = apt.items.flatMap((item) =>
              item.services
                .filter((s) => !s.is_package_covered)
                .map((s) => s.name)
            );
            const uniqueServices = [...new Set(allServices)];
            const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), "day");

            return (
              <TableRow
                key={apt.id}
                onClick={() => onSelectAppointment(apt)}
                sx={{
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: (theme) =>
                      alpha(theme.palette.primary.main, 0.04),
                  },
                  "& td": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1.75,
                  },
                }}
              >
                <TableCell sx={{ pl: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {apt.client.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {allPets.map((pet, idx) => (
                      <Chip
                        key={pet.id || idx}
                        label={pet.name}
                        size="small"
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          height: 24,
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.08),
                          color: "primary.main",
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ fontWeight: 500 }}
                  >
                    {uniqueServices.length > 0
                      ? uniqueServices.join(", ")
                      : "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      {isToday && (
                        <Chip
                          label="HOJE"
                          size="small"
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            height: 20,
                            bgcolor: (theme) =>
                              alpha(theme.palette.success.main, 0.1),
                            color: "success.dark",
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {dayjs(apt.scheduled_at).format("HH:mm")}
                      </Typography>
                    </Box>
                    {!isToday && (
                      <Typography
                        variant="caption"
                        color="text.primary"
                        sx={{ opacity: 0.5, fontWeight: 500 }}
                      >
                        {dayjs(apt.scheduled_at).format("DD/MM/YYYY")}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "primary.main" }}
                  >
                    R$ {(priceCents / 100).toFixed(2).replace(".", ",")}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
