import {
  Box,
  Checkbox,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
} from "@mui/material";
import { applyAppointmentAction } from "../../api/services/appointments";
import { Plus, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import { useState } from "react";
import AppointmentListItem from "./AppointmentListItem";
import { buildDayTimeline } from "../../utils/getFreeSlotsforAppointment";
import AppointmentFreeTimeCard from "./AppointmentFreeTimeCard";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import DashboardCalendar from "../dashboard/DashboardCalendar";

import { useQueryClient } from "@tanstack/react-query";
import NoAppointmentsBanner from "./NoAppointmentsBanner";
import { useAuth } from "../../hooks/useAuth";
import { DEFAULT_WORKING_HOURS } from "../tenants/types";

const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type Props = {
  onEdit: (appointment: Appointment) => void;
  openFlow: (initialDate?: Dayjs) => void;
  date: Dayjs;
  onDateChange?: (newDate: Dayjs) => void;
  onMonthChange?: (newMonth: Dayjs) => void;
  highlightedDays?: Set<string>;
  appointments: Appointment[];
  isFetching?: boolean;
};

const AppointmentsDailyList = ({
  openFlow,
  onEdit,
  date,
  onDateChange,
  onMonthChange,
  highlightedDays,
  appointments,
  isFetching = false,
}: Props) => {
  const theme = useTheme();
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    appointmentId?: number;
  }>({ open: false });
  const [search, setSearch] = useState("");
  const [showCanceled, setShowCanceled] = useState(false);
  const [showFreeSlots, setShowFreeSlots] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = showFreeSlots || showCanceled;
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  const dayOfWeek = String(date.day());
  const daySchedule =
    tenant?.working_hours?.[dayOfWeek] ?? DEFAULT_WORKING_HOURS[dayOfWeek];
  const isOpen = daySchedule ? Boolean(daySchedule.is_open) : date.day() !== 0;

  const [startHour, startMinute] = (daySchedule?.open || "08:00")
    .split(":")
    .map((v) => parseInt(v, 10));
  const [closeHour, closeMinute] = (daySchedule?.close || "18:00")
    .split(":")
    .map((v) => parseInt(v, 10));

  const workStart = date
    .hour(!isNaN(startHour) ? startHour : 8)
    .minute(!isNaN(startMinute) ? startMinute : 0)
    .second(0);

  const workEnd = date
    .hour(!isNaN(closeHour) ? closeHour : 18)
    .minute(!isNaN(closeMinute) ? closeMinute : 0)
    .second(0);

  const filteredAppointments = appointments.filter((a) => {
    if (!showCanceled && a.status === "canceled") return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesClient = a.client.name.toLowerCase().includes(q);
    const matchesPet = a.items.some((item) =>
      item.pet.name.toLowerCase().includes(q),
    );
    return matchesClient || matchesPet;
  });

  const timeline = isOpen
    ? buildDayTimeline(filteredAppointments, workStart, workEnd, 30)
    : filteredAppointments.map((a) => ({
        type: "appointment" as const,
        data: a,
        start: dayjs(a.scheduled_at),
        end: dayjs(a.scheduled_at).add(30, "minute"),
      }));

  const selectedAppointment = appointments.find(
    (a) => a.id === detailsModal.appointmentId,
  );

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
    cancelAllFuture?: boolean
  ) => {
    setLoadingAction(action);
    try {
      await applyAppointmentAction(appointment.id, action, cancelAllFuture);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
        {/* Topo:
            - Desktop: Título + Data descritiva juntinhos à esquerda | Busca + Filtro + (+) e Checkboxes à direita
            - Mobile: Título à esquerda | Seletor de data aumentado à direita */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
            width: "100%",
          }}
        >
          {/* Lado Esquerdo: Título e Data descritiva bem coladinhos (como era antes) */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.25rem", xl: "1.35rem" },
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              Agendas do dia
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.disabled",
                fontWeight: 500,
                display: { xs: "none", md: "block" },
                mt: 0.2,
                textTransform: "capitalize",
                fontSize: "0.85rem",
              }}
            >
              {date.format("dddd, DD [de] MMMM")}
            </Typography>
          </Box>

          {/* Lado Direito Desktop: Busca + Botão Filtro + Botão (+) com Checkboxes alinhados embaixo */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.75,
            }}
          >
            {/* Linha dos botões/inputs no desktop */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                size="small"
                placeholder="Buscar tutor ou pet"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  width: { md: "200px", lg: "250px" },
                  backgroundColor: "white",
                  borderRadius: 1,
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <IconButton
                onClick={() => setFiltersOpen((prev) => !prev)}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: filtersOpen || hasActiveFilters ? "primary.main" : "divider",
                  bgcolor: filtersOpen || hasActiveFilters ? "rgba(49, 52, 133, 0.08)" : "white",
                  color: filtersOpen || hasActiveFilters ? "primary.main" : "text.secondary",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(49, 52, 133, 0.04)",
                  },
                }}
                title="Filtros"
              >
                <Filter size={18} />
              </IconButton>
              <Button
                size="small"
                sx={{
                  minWidth: "38px",
                  width: "38px",
                  height: "38px",
                  p: 0,
                  borderRadius: 1,
                  backgroundColor: "primary.main",
                  color: "white",
                }}
                onClick={() => openFlow()}
                title="Novo Agendamento"
              >
                <Plus size={20} />
              </Button>
            </Box>

            {/* Checkboxes de filtro no Desktop (alinhados à direita embaixo da busca/filtro) */}
            {(filtersOpen || hasActiveFilters) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  onClick={() => setShowFreeSlots(!showFreeSlots)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    px: 1,
                    py: 0.35,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: showFreeSlots ? "primary.main" : "divider",
                    bgcolor: showFreeSlots ? "rgba(49, 52, 133, 0.08)" : "white",
                    userSelect: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Checkbox
                    disableRipple
                    size="small"
                    checked={showFreeSlots}
                    sx={{ color: "primary.main", p: 0 }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: showFreeSlots ? 700 : 500,
                      color: showFreeSlots ? "primary.main" : "text.primary",
                    }}
                  >
                    Horários livres
                  </Typography>
                </Box>

                <Box
                  onClick={() => setShowCanceled(!showCanceled)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    px: 1,
                    py: 0.35,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: showCanceled ? "error.main" : "divider",
                    bgcolor: showCanceled ? "rgba(211, 47, 47, 0.08)" : "white",
                    userSelect: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Checkbox
                    disableRipple
                    size="small"
                    checked={showCanceled}
                    sx={{ color: "error.main", p: 0 }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: showCanceled ? 700 : 500,
                      color: showCanceled ? "error.main" : "text.primary",
                    }}
                  >
                    Cancelados
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Lado Direito Mobile: Seletor de data compacto com altura maior e setas confortáveis (OCULTO NO DESKTOP) */}
          {onDateChange && (
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                bgcolor: "white",
                borderRadius: 2,
                p: 0.35,
                height: 38,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                flexShrink: 0,
              }}
            >
              <IconButton
                size="small"
                onClick={() => onDateChange(date.subtract(1, "day"))}
                sx={{
                  color: "text.primary",
                  width: 32,
                  height: 32,
                  p: 0.5,
                  borderRadius: 1.5,
                  "&:active": { bgcolor: "action.selected" },
                }}
                aria-label="Dia anterior"
              >
                <ChevronLeft size={18} />
              </IconButton>

              <Box
                onClick={() => setCalendarModalOpen(true)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  cursor: "pointer",
                  px: 0.75,
                  py: 0.4,
                  height: "100%",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <CalendarIcon size={15} color={theme.palette.primary.main} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "text.primary",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                  }}
                >
                  {date.isSame(dayjs(), "day")
                    ? `Hoje, ${date.format("DD/MM")}`
                    : date.format("ddd, DD/MM")}
                </Typography>
              </Box>

              {!date.isSame(dayjs(), "day") && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onDateChange(dayjs())}
                  sx={{
                    height: 24,
                    fontSize: "0.7rem",
                    py: 0,
                    px: 0.6,
                    minWidth: "auto",
                    borderRadius: 0.8,
                    mr: 0.25,
                  }}
                >
                  Hoje
                </Button>
              )}

              <IconButton
                size="small"
                onClick={() => onDateChange(date.add(1, "day"))}
                sx={{
                  color: "text.primary",
                  width: 32,
                  height: 32,
                  p: 0.5,
                  borderRadius: 1.5,
                  "&:active": { bgcolor: "action.selected" },
                }}
                aria-label="Próximo dia"
              >
                <ChevronRight size={18} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Linha 2 Mobile: Busca + Botão Filtro */}
        <Box sx={{ display: { xs: "flex", md: "none" }, width: "100%", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Buscar tutor ou pet"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              backgroundColor: "white",
              borderRadius: 1,
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <IconButton
            onClick={() => setFiltersOpen((prev) => !prev)}
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              border: "1px solid",
              borderColor: filtersOpen || hasActiveFilters ? "primary.main" : "divider",
              bgcolor: filtersOpen || hasActiveFilters ? "rgba(49, 52, 133, 0.08)" : "white",
              color: filtersOpen || hasActiveFilters ? "primary.main" : "text.secondary",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            title="Filtros"
          >
            <Filter size={18} />
          </IconButton>
        </Box>

        {/* Linha 3 Mobile: Checkboxes de filtro no Mobile (visíveis ao clicar no filtro) */}
        {(filtersOpen || hasActiveFilters) && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 0.75,
              width: "100%",
            }}
          >
            <Box
              onClick={() => setShowFreeSlots(!showFreeSlots)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                px: 1,
                py: 0.35,
                borderRadius: 2,
                border: "1px solid",
                borderColor: showFreeSlots ? "primary.main" : "divider",
                bgcolor: showFreeSlots ? "rgba(49, 52, 133, 0.08)" : "white",
                userSelect: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Checkbox
                disableRipple
                size="small"
                checked={showFreeSlots}
                sx={{ color: "primary.main", p: 0 }}
              />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: showFreeSlots ? 700 : 500,
                  color: showFreeSlots ? "primary.main" : "text.primary",
                }}
              >
                Horários livres
              </Typography>
            </Box>

            <Box
              onClick={() => setShowCanceled(!showCanceled)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                px: 1,
                py: 0.35,
                borderRadius: 2,
                border: "1px solid",
                borderColor: showCanceled ? "error.main" : "divider",
                bgcolor: showCanceled ? "rgba(239, 68, 68, 0.08)" : "white",
                userSelect: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Checkbox
                disableRipple
                size="small"
                checked={showCanceled}
                sx={{ color: "error.main", p: 0 }}
              />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: showCanceled ? 700 : 500,
                  color: showCanceled ? "error.main" : "text.primary",
                }}
              >
                Cancelados
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Lista */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
        {isFetching ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={64}
              sx={{ borderRadius: 2, bgcolor: "grey.200" }}
            />
          ))
        ) : appointments.length === 0 && (!showFreeSlots || !isOpen) ? (
          <Box sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            {showFreeSlots && !isOpen && (
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255,167,38,0.15)"
                      : "#fff8e1",
                  border: "1px solid",
                  borderColor: "warning.main",
                  maxWidth: 420,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="warning.dark"
                >
                  Petshop Fechado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Não há horários livres disponíveis pois o estabelecimento está
                  configurado como fechado aos {DAY_NAMES[date.day()]}.
                </Typography>
              </Box>
            )}
            <NoAppointmentsBanner />
          </Box>
        ) : (
          <>
            {showFreeSlots && !isOpen && appointments.length > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255,167,38,0.15)"
                      : "#fff8e1",
                  border: "1px solid",
                  borderColor: "warning.main",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="body2"
                  color="warning.dark"
                  fontWeight={500}
                >
                  Petshop fechado aos {DAY_NAMES[date.day()]}. Não há horários livres adicionais.
                </Typography>
              </Box>
            )}
            {timeline.map((block, index) => {
              if (block.type === "appointment") {
                return (
                  <AppointmentListItem
                    key={block.data.id}
                    appointment={block.data}
                    openDetails={() =>
                      setDetailsModal({
                        open: true,
                        appointmentId: block.data.id,
                      })
                    }
                  />
                );
              }
              if (block.type === "free") {
                if (!showFreeSlots) return null;
                return (
                  <AppointmentFreeTimeCard
                    key={`free-${index}`}
                    block={block}
                    openFlow={openFlow}
                  />
                );
              }
              return null;
            })}
            {filteredAppointments.length === 0 && search && (
              <Typography variant="body1" color="text.disabled">
                Nenhum agendamento encontrado para esta busca.
              </Typography>
            )}
          </>
        )}
      </Box>

      {detailsModal.open && selectedAppointment && (
        <AppointmentDetailsModal
          open={detailsModal.open}
          onClose={() => setDetailsModal({ open: false })}
          appointment={selectedAppointment}
          handleAction={handleAction}
          loadingAction={loadingAction}
          onEdit={onEdit}
        />
      )}

      {/* Modal de Calendário (Especialmente para Mobile) */}
      <Dialog
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 0.5,
            pt: 1,
            px: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Selecionar Data
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!date.isSame(dayjs(), "day") && onDateChange && (
              <Button
                size="small"
                variant="outlined"
                sx={{ height: 26, fontSize: "0.75rem", py: 0, px: 1 }}
                onClick={() => {
                  onDateChange(dayjs());
                  setCalendarModalOpen(false);
                }}
              >
                Hoje
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setCalendarModalOpen(false)}
              sx={{ color: "text.primary", opacity: 0.7, "&:hover": { opacity: 1 } }}
            >
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center" }}>
          <DashboardCalendar
            value={date}
            onChange={(newDate) => {
              if (newDate && onDateChange) {
                onDateChange(newDate);
                setCalendarModalOpen(false);
              }
            }}
            onMonthChange={onMonthChange}
            highlightedDays={highlightedDays}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentsDailyList;
