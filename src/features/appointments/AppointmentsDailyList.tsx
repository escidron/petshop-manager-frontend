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
import { Plus, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
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

type Props = {
  onEdit: (appointment: Appointment) => void;
  openFlow: () => void;
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
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);
  const queryClient = useQueryClient();

  const workStart = date.hour(8).minute(0).second(0);
  const workEnd = date.hour(18).minute(0).second(0);

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

  const timeline = buildDayTimeline(
    filteredAppointments,
    workStart,
    workEnd,
    30,
  );

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
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Header */}
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, width: "100%" }}>
        {/* Linha 1: Título "Agendas do dia" + Seletor de data compacto na mesma linha */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            width: "100%",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              sx={{
                fontSize: { xs: "1.05rem", sm: "1.2rem", xl: "1.35rem" },
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

          {/* Seletor Compacto na mesma linha */}
          {onDateChange && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "white",
                borderRadius: 2,
                p: { xs: 0.25, sm: 0.4 },
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                flexShrink: 0,
              }}
            >
              <IconButton
                size="small"
                onClick={() => onDateChange(date.subtract(1, "day"))}
                sx={{ color: "text.primary", p: { xs: 0.35, sm: 0.5 } }}
                aria-label="Dia anterior"
              >
                <ChevronLeft size={16} />
              </IconButton>

              <Box
                onClick={() => setCalendarModalOpen(true)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  px: { xs: 0.6, sm: 1 },
                  py: 0.2,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <CalendarIcon size={14} color={theme.palette.primary.main} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "0.78rem", sm: "0.85rem" },
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
                    height: 22,
                    fontSize: "0.68rem",
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
                sx={{ color: "text.primary", p: { xs: 0.35, sm: 0.5 } }}
                aria-label="Próximo dia"
              >
                <ChevronRight size={16} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Linha 2: Busca + Botão (+) + Filtros em chips */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar tutor ou pet"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flex: 1,
              minWidth: { xs: "140px", sm: 220 }, 
              backgroundColor: "white", 
              borderRadius: 1 
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

          <Button
            size="small"
            sx={{ 
              minWidth: "38px", 
              width: "38px",
              height: "38px", 
              p: 0, 
              borderRadius: 1, 
              backgroundColor: "primary.main",
              color: "white"
            }}
            onClick={openFlow}
            title="Novo Agendamento"
          >
            <Plus size={20} />
          </Button>

          {/* Filtros de visualização em formato de chips */}
          {appointments.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: { xs: "100%", sm: "auto" }, mt: { xs: 0.25, sm: 0 } }}>
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
                    fontSize: { xs: "0.72rem", sm: "0.8rem" },
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
                    fontSize: { xs: "0.72rem", sm: "0.8rem" },
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
        ) : appointments.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <NoAppointmentsBanner />
          </Box>
        ) : (
          <>
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
