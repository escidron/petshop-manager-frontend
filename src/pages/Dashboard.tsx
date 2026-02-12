import { useCallback, useEffect, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";

import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import ClientFormModal from "../features/clients/ClientFormModal";
import PetFormModal from "../features/pets/PetFormModal";
import CustomCard from "../components/Card/CustomCard";
import { Box, Typography } from "@mui/material";
import {
  BanknoteArrowUp,
  CalendarCheck2,
  CalendarDays,
  HandCoins,
} from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import { useClient } from "../hooks/useClient";
import {
  applyAppointmentAction,
  getAppointmentsByDay,
  type Appointment,
  type AppointmentAction,
} from "../api/services/appointments";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import { useClients } from "../hooks/useClients";
import { usePets } from "../hooks/usePets";

type AppointmentFlowState =
  | { open: false }
  | {
      open: true;
      step: "appointment" | "client" | "pet";
      selectedClient?: Client;
      selectedPet?: Pet;
    };

const Dashboard = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const { pets, setClientId, setPets } = useClient();
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const { getClients } = useClients();
  const { getPets } = usePets();

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = useCallback(async () => {
    const appointments = await getAppointmentsByDay(date.format("YYYY-MM-DD"));
    setAppointments(appointments);
  }, [date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
  ) => {
    await applyAppointmentAction(appointment.id, action);
    fetchAppointments();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mx: "auto",
          justifyContent: "center",
          mt: 2,
        }}
      >
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
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
        </CustomCard>
      </Box>
      <Box
        sx={{
          maxWidth: "1170px",
          mx: "auto",
          mt: 6,
          display: "flex",
          gap: 6,
        }}
      >
        <Box sx={{ width: "60%" }}>
          <AppointmentsDailyList
            handleAction={handleAction}
            appointments={appointments}
            openFlow={() =>
              setFlow({
                open: true,
                step: "appointment",
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
          pets={pets}
          currentDate={date}
          selectedClient={flow.selectedClient}
          selectedPet={flow.selectedPet}
          onSuccess={() => {
            fetchAppointments();
            setFlow({ open: false });
          }}
          onCreateClient={() =>
            setFlow((flow) => (flow.open ? { ...flow, step: "client" } : flow))
          }
          onCreatePet={() =>
            setFlow((flow) => (flow.open ? { ...flow, step: "pet" } : flow))
          }
          onClientSelect={(client) => {
            setFlow((flow) =>
              flow.open
                ? { ...flow, selectedClient: client, selectedPet: undefined }
                : flow,
            );
            setClientId(client?.id || undefined);
            if (!client) setPets([]);
          }}
          onPetSelect={(pet) =>
            setFlow((flow) =>
              flow.open ? { ...flow, selectedPet: pet } : flow,
            )
          }
          onClose={() => setFlow({ open: false })}
        />
      )}

      {isFlowOpen(flow) && flow.step === "client" && (
        <ClientFormModal
          open={clientModal.open}
          mode={clientModal.mode}
          client={clientModal.client}
          onClose={() => setClientModal({ open: false, mode: "create" })}
          onSuccess={async () => {
            await getClients();
            setClientModal({ open: false, mode: "create" });
          }}
          onSuccessAndAddPet={(client) => {
            setPetModal({ open: true, mode: "create" });
            setClientModal({ open: false, mode: "create", client });
          }}
        />
      )}

      {isFlowOpen(flow) && flow.step === "pet" && (
        <PetFormModal
          open={petModal.open}
          mode={petModal.mode}
          pet={petModal.pet}
          onClose={() => setPetModal({ open: false, mode: "create" })}
          onSuccess={async () => {
            await getPets();
            setPetModal({ open: false, mode: "create" });
          }}
        />
      )}
    </Box>
  );
};

export default Dashboard;
