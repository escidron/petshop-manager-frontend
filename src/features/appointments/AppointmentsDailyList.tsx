import {
  Box,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Popover,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { applyAppointmentAction } from "../../api/services/appointments";
import { CalendarDays, Plus, Search } from "lucide-react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import { useState } from "react";
import AppointmentListItem from "./AppointmentListItem";
import { buildDayTimeline } from "../../utils/getFreeSlotsforAppointment";
import AppointmentFreeTimeCard from "./AppointmentFreeTimeCard";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import {
  PickersDay,
  type PickersDayProps,
} from "@mui/x-date-pickers/PickersDay";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  onEdit: (appointment: Appointment) => void;
  openFlow: () => void;
  date: Dayjs;
  setDate: (date: Dayjs) => void;
  appointments: Appointment[];
  isFetching?: boolean;
};

const CustomDay = (props: PickersDayProps & { selectedDate: Dayjs }) => {
  const { day, selectedDate, ...other } = props;
  const isToday = day.isSame(dayjs(), "day");
  const isSelected = day.isSame(selectedDate, "day");

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        ...(isToday &&
          !isSelected && {
            backgroundColor: "grey.200",
            color: "text.primary",
            fontWeight: 600,
            "&:hover": { backgroundColor: "grey.300" },
          }),
      }}
    />
  );
};

const AppointmentsDailyList = ({
  openFlow,
  onEdit,
  date,
  setDate,
  appointments,
  isFetching = false,
}: Props) => {
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    appointmentId?: number;
  }>({ open: false });
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [showCanceled, setShowCanceled] = useState(false);
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

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
  ) => {
    await applyAppointmentAction(appointment.id, action);
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  const selectedAppointment = appointments.find(
    (a) => a.id === detailsModal.appointmentId,
  );

  const calendarOpen = Boolean(calendarAnchor);

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Agendas do dia
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por tutor ou pet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 260, backgroundColor: "white", borderRadius: 1 }}
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
          <Box
            onClick={(e) =>
              setCalendarAnchor(calendarAnchor ? null : e.currentTarget)
            }
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "4px",
              border: "1px solid",
              borderColor: "primary.main",
              height: "36px",
              width: "36px",
              flexShrink: 0,
              cursor: "pointer",
              backgroundColor: calendarOpen ? "primary.main" : "transparent",
              color: calendarOpen ? "white" : "primary.main",
            }}
          >
            <CalendarDays />
          </Box>
          <Button startIcon={<Plus />} onClick={openFlow}>
            Criar Agendamento
          </Button>
        </Box>
      </Box>
      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Checkbox
            disableRipple
            size="small"
            checked={showCanceled}
            onChange={(e) => setShowCanceled(e.target.checked)}
            sx={{ color: "primary.main", py: 0 }}
          />
        }
        label={
          <Typography variant="body2" color="text.primary">
            Mostrar cancelados
          </Typography>
        }
      />
      {/* Popover calendário */}
      <Popover
        open={calendarOpen}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { mt: 1, borderRadius: 2, boxShadow: 4 } },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DateCalendar
            value={date}
            onChange={(newDate) => {
              if (newDate) {
                setDate(newDate);
                setCalendarAnchor(null);
              }
            }}
            slots={{
              day: (props) => <CustomDay {...props} selectedDate={date} />,
            }}
            sx={{
              width: 320,
              color: "text.primary",
              "& .MuiDayCalendar-weekDayLabel": { color: "text.primary" },
            }}
          />
        </LocalizationProvider>
      </Popover>

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
            {filteredAppointments.length === 0 && (
              <Typography variant="body1" color="text.disabled">
                {search
                  ? "Nenhum agendamento encontrado para esta busca."
                  : "Nenhum agendamento para este dia."}
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
          onEdit={onEdit}
        />
      )}
    </>
  );
};

export default AppointmentsDailyList;
