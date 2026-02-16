import { Box, Typography } from "@mui/material";
import { applyAppointmentAction } from "../../api/services/appointments";
import { Plus } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import { useEffect, useState } from "react";
import AppointmentListItem from "./AppointmentListItem";
import { buildDayTimeline } from "../../utils/getFreeSlotsforAppointment";
import AppointmentFreeTimeCard from "./AppointmentFreeTimeCard";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

type Props = {
  date: dayjs.Dayjs;
  openFlow: () => void;
  appointments: Appointment[];
  fetchAppointments: () => Promise<void>;
};
const AppointmentsDailyList = ({
  openFlow,
  appointments,
  fetchAppointments,
  date,
}: Props) => {
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    appointmentId?: number;
  }>({ open: false });
  // Todo colocar em env config
  const workStart = date.hour(8).minute(0).second(0);
  const workEnd = date.hour(18).minute(0).second(0);

  const timeline = buildDayTimeline(
    appointments,
    workStart,
    workEnd,
    30, // duração mínima para mostrar bloco livre
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
  ) => {
    await applyAppointmentAction(appointment.id, action);
    await fetchAppointments();
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
        <Button startIcon={<Plus />} onClick={openFlow}>
          Novo Agendamento
        </Button>
      </Box>
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
            Nenhum agendamento para hoje
          </Typography>
        )}
      </Box>
      {detailsModal.open && selectedAppointment && (
        <AppointmentDetailsModal
          open={detailsModal.open}
          onClose={() => setDetailsModal({ open: false })}
          appointment={selectedAppointment}
          handleAction={handleAction}
        />
      )}
    </>
  );
};

export default AppointmentsDailyList;
