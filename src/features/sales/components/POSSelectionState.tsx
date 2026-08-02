import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Skeleton,
  alpha,
} from "@mui/material";
import {
  Search,
  Calendar,
  PlusCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import type { Appointment } from "../../appointments/types";
import { Button } from "../../../components/Button/Button";

interface POSSelectionStateProps {
  searchTerm: string;
  appointments: Appointment[];
  isLoading: boolean;
  getAppointmentPrice: (apt: Appointment) => number;
  onSearchChange: (v: string) => void;
  onSelectAppointment: (apt: Appointment) => void;
  onNewSession: () => void;
}

export default function POSSelectionState({
  searchTerm,
  appointments,
  isLoading,
  getAppointmentPrice,
  onSearchChange,
  onSelectAppointment,
  onNewSession,
}: POSSelectionStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maxWidth: 700,
        mx: "auto",
        width: "100%",
        pt: 2,
      }}
    >
      {/* Hero Search */}
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}
        >
          Quem será atendido?
        </Typography>
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          Selecione um agendamento abaixo ou inicie um novo atendimento
        </Typography>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        autoFocus
        placeholder="Buscar por cliente, pet ou serviço..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          ),
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            fontSize: "1rem",
            height: 56,
            "& input": { fontWeight: 600 },
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderWidth: 2 },
            "&:hover fieldset": { borderColor: "primary.main" },
            "&.Mui-focused fieldset": { borderWidth: 2 },
          },
        }}
      />

      {/* New Session Button */}
      <Button
        variant="outlined"
        fullWidth
        onClick={onNewSession}
        startIcon={<PlusCircle size={20} />}
        sx={{
          height: 48,
          borderRadius: 3,
          fontWeight: 700,
          fontSize: "0.9rem",
          borderWidth: 2,
          borderStyle: "dashed",
          "&:hover": { borderStyle: "solid" },
        }}
      >
        Novo atendimento sem agendamento
      </Button>

      {/* Pending Appointments */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: 1.5, color: "text.primary" }}
          >
            Pendências do Cliente
          </Typography>
          {appointments.length > 0 && (
            <Chip
              label={appointments.length}
              size="small"
              color="primary"
              sx={{ fontWeight: 800, height: 22, fontSize: "0.7rem" }}
            />
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={80} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        ) : appointments.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Calendar size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {searchTerm
                ? "Nenhum resultado encontrado"
                : "Nenhuma pendência"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.primary", mt: 0.5 }}
            >
              {searchTerm
                ? "Tente buscar por outro nome"
                : "Agendamentos finalizados aparecerão aqui"}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {appointments.map((apt) => {
              const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), "day");
              const price = getAppointmentPrice(apt);
              const services = [
                ...new Set(
                  apt.items.flatMap((i) =>
                    i.services
                      .filter((s) => !s.is_package_covered)
                      .map((s) => s.name)
                  )
                ),
              ];
              const pets = [...new Set(apt.items.map((i) => i.pet.name))];

              return (
                <Paper
                  key={apt.id}
                  elevation={0}
                  onClick={() => onSelectAppointment(apt)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.03),
                      "& .arrow-icon": { opacity: 1, transform: "translateX(0)" },
                    },
                  }}
                >
                  {/* Date icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: isToday
                        ? (theme) => alpha(theme.palette.primary.main, 0.1)
                        : "action.hover",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isToday ? "primary.main" : "text.primary",
                    }}
                  >
                    {isToday ? (
                      <>
                        <Clock size={14} />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 800, fontSize: "0.6rem", mt: 0.25 }}
                        >
                          HOJE
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: "0.75rem" }}
                        >
                          {dayjs(apt.scheduled_at).format("DD")}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, fontSize: "0.6rem", opacity: 0.7 }}
                        >
                          {dayjs(apt.scheduled_at).format("MMM").toUpperCase()}
                        </Typography>
                      </>
                    )}
                  </Box>

                  {/* Main info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 800,
                          color: "text.primary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {apt.client.name}
                      </Typography>
                      {isToday && (
                        <Chip
                          label={dayjs(apt.scheduled_at).format("HH:mm")}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.primary",
                        fontWeight: 500,
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pets.join(", ")}
                      {services.length > 0 && (
                        <span style={{ opacity: 0.6 }}> · {services.join(", ")}</span>
                      )}
                    </Typography>
                  </Box>

                  {/* Price + Arrow */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 900, color: "primary.main" }}
                    >
                      R$ {(price / 100).toFixed(2).replace(".", ",")}
                    </Typography>
                    <Box
                      className="arrow-icon"
                      sx={{
                        color: "primary.main",
                        opacity: 0,
                        transform: "translateX(-4px)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <ArrowRight size={20} />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
