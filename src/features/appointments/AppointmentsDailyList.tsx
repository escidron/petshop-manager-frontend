import { Box, Typography } from "@mui/material";
import {
  applyAppointmentAction,
  getAppointmentsByDay,
} from "../../api/services/appointments";
import { CalendarDays, Plus } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import { useState } from "react";
import AppointmentListItem from "./AppointmentListItem";
import { buildDayTimeline } from "../../utils/getFreeSlotsforAppointment";
import AppointmentFreeTimeCard from "./AppointmentFreeTimeCard";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import CustomCard from "../../components/Card/CustomCard";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  onEdit: (appointment: Appointment) => void;
  openFlow: () => void;
};
const AppointmentsDailyList = ({ openFlow, onEdit }: Props) => {
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    appointmentId?: number;
  }>({ open: false });
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [showCalendar, setShowCalendar] = useState(false);
  const formattedDate = date.format("YYYY-MM-DD");
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
  });
  // Todo colocar em env config
  const workStart = date.hour(8).minute(0).second(0);
  const workEnd = date.hour(18).minute(0).second(0);

  const timeline = buildDayTimeline(
    appointments,
    workStart,
    workEnd,
    30, // duração mínima para mostrar bloco livre
  );

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
  ) => {
    await applyAppointmentAction(appointment.id, action);
    queryClient.invalidateQueries({
      queryKey: ["appointments"],
    });
  };

  const selectedAppointment = appointments.find(
    (a) => a.id === detailsModal.appointmentId,
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Agendas do dia
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            onClick={() => setShowCalendar(!showCalendar)}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "4px",
              border: "1px solid",
              borderColor: "primary.main",
              height: "36px",
              width: "36px",
              cursor: "pointer",
              backgroundColor: showCalendar ? "primary.main" : "transparent",
              color: showCalendar ? "white" : "primary.main",
            }}
          >
            <CalendarDays />
          </Box>
          <Button startIcon={<Plus />} onClick={openFlow}>
            Criar Agendamento
          </Button>
        </Box>
      </Box>
      {showCalendar && (
        <Box>
          <CustomCard sx={{ mt: 2, p: 1, width: "350px", height: "340px" }}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
            >
              <DateCalendar
                value={date}
                onChange={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                  }
                }}
                sx={{
                  width: "100%",
                  color: "text.primary",
                  "& .MuiDayCalendar-weekDayLabel": {
                    color: "text.primary",
                  },
                }}
              />
            </LocalizationProvider>
          </CustomCard>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        {timeline.map((block, index) => {
          if (block.type === "appointment") {
            return (
              <AppointmentListItem
                key={block.data.id}
                appointment={block.data}
                openDetails={() => {
                  setDetailsModal({
                    open: true,
                    appointmentId: block.data.id,
                  });
                }}
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
        {appointments.length === 0 && (
          <Typography variant="body1" color="text.disabled">
            Nenhum agendamento para este dia
          </Typography>
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
