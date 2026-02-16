import { useCallback, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";

import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import ClientFormModal from "../features/clients/ClientFormModal";
import PetFormModal from "../features/pets/PetFormModal";
import CustomCard from "../components/Card/CustomCard";
import { Box, Typography } from "@mui/material";
// import {
//   BanknoteArrowUp,
//   CalendarCheck2,
//   CalendarDays,
//   HandCoins,
// } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import { useClients } from "../hooks/useClients";
import { usePets } from "../hooks/usePets";
import { getAppointmentsByDay } from "../api/services/appointments";
import type { Appointment } from "../features/appointments/types";

type AppointmentFlowState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      step: "appointment" | "client" | "pet";
      selectedClient?: Client;
      selectedPet?: Pet;
    };

const Dashboard = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const { getClients } = useClients();
  const { getPets } = usePets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [clientModal, setClientModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    client?: Client;
  }>({ open: false, mode: "create" });

  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pet?: Pet;
  }>({ open: false, mode: "create" });

  const isFlowOpen = (
    flow: AppointmentFlowState,
  ): flow is Extract<AppointmentFlowState, { open: true }> => {
    return flow.open;
  };

  const fetchAppointments = useCallback(async () => {
    const appointments = await getAppointmentsByDay(date.format("YYYY-MM-DD"));
    setAppointments(appointments);
  }, [date]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mx: "auto",
          justifyContent: "center",
        }}
      >
        {/* <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CalendarDays size={24} />
            <Typography fontWeight={400}>Agendamentos de dia</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              {
                appointments.filter(
                  (appointment) =>
                    dayjs(appointment.scheduled_at).format("YYYY-MM-DD") ===
                    date.format("YYYY-MM-DD"),
                ).length
              }
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CalendarCheck2 size={24} />
            <Typography fontWeight={400}>Check-ins pendentes</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              0
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <BanknoteArrowUp size={24} />
            <Typography fontWeight={400}>Faturamento do dia</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              R$ 400
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <HandCoins size={24} />
            <Typography fontWeight={400}>Faturamento do mês</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              R$ 8000
            </Typography>
          </Box>
        </CustomCard> */}
      </Box>
      <Box
        sx={{
          maxWidth: "1170px",
          mx: "auto",
          mt: 2,
          display: "flex",
          gap: 6,
        }}
      >
        <Box sx={{ width: "60%" }}>
          <AppointmentsDailyList
          appointments={appointments}
          fetchAppointments={fetchAppointments}
            date={date}
            openFlow={() =>
              setFlow({
                open: true,
                step: "appointment",
                mode: "create",
              })
            }
          />
        </Box>
        <Box sx={{ width: "40%" }}>
          <Typography variant="h5" fontWeight={600}>
            Calendario
          </Typography>
          <CustomCard sx={{ mt: 2, p: 1 }}>
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
      </Box>

      {isFlowOpen(flow) && (
        <AppointmentModal
          open={flow.step === "appointment"}
          mode={flow.mode}
          selectedClient={flow.selectedClient}
          selectedPet={flow.selectedPet}
          onSuccess={() => {
            fetchAppointments();
            setFlow({ open: false });
          }}
          onClose={() => setFlow({ open: false })}
        />
      )}

      {isFlowOpen(flow) && flow.step === "client" && (
        <ClientFormModal
          open={clientModal.open}
          mode={clientModal.mode}
          client={clientModal.client}
          onClose={() => {
            setClientModal({ open: false, mode: "create" });
          }}
          onSuccess={async (client) => {
            await getClients();
            setClientModal({ open: false, mode: "create" });
            setFlow({
              open: true,
              mode: "create",
              step: "appointment",
              selectedClient: client,
            });
          }}
          onSuccessAndAddPet={(client) => {
            setPetModal({ open: true, mode: "create" });
            setFlow({
              open: true,
              step: "pet",
              selectedClient: client,
              mode: "create",
            });
          }}
        />
      )}

      {isFlowOpen(flow) && flow.step === "pet" && (
        <PetFormModal
          client={flow.selectedClient}
          open={petModal.open}
          mode={petModal.mode}
          pet={petModal.pet}
          onClose={() => {
            setPetModal({ open: false, mode: "create" });
            setFlow({ open: true, step: "appointment", mode: "create" });
          }}
          onSuccess={async (pet) => {
            await getPets();
            setPetModal({ open: false, mode: "create" });
            setFlow({
              ...flow,
              open: true,
              step: "appointment",
              selectedPet: pet,
            });
          }}
        />
      )}
    </Box>
  );
};

export default Dashboard;
