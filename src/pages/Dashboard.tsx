import { useCallback, useEffect, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import type { Client } from "./ClientsPage";
import type { Pet } from "./PetsPage";
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
import { DEFAULT_PET_FORM } from "../features/pets/constants";
import type { PetFormData } from "../features/pets/PetForm";
import { DEFAULT_CLIENT_FORM } from "../features/clients/constants";
import type { ClientFormData } from "../features/clients/ClientForm";
import {
  applyAppointmentAction,
  getAppointmentsByDay,
  type Appointment,
  type AppointmentAction,
} from "../api/services/appointments";

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
  const [petForm, setPetForm] = useState<PetFormData>(DEFAULT_PET_FORM);
  const [clientForm, setClientForm] = useState<ClientFormData>(DEFAULT_CLIENT_FORM);
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
          open={flow.open && flow.step === "client"}
          mode="create"
          onClose={() =>
            setFlow((f) => (f.open ? { ...f, step: "appointment" } : f))
          }
          onSuccess={(client) =>
            setFlow((f) => ({
              ...f,
              selectedClient: client,
              step: "appointment",
              open: true,
            }))
          }
          onSuccessAndAddPet={(client) =>
            setFlow((f) => ({
              ...f,
              selectedClient: client,
              step: "pet",
              open: true, // 👈 mantém modal aberto
            }))
          }
          clientForm={clientForm}
          setClientForm={setClientForm}
        />
      )}

      {isFlowOpen(flow) && flow.step === "pet" && (
        <PetFormModal
          open={flow.step === "pet"}
          mode="create"
          client={flow.selectedClient}
          onClose={() =>
            setFlow((f) => (f.open ? { ...f, step: "appointment" } : f))
          }
          onSuccess={(pet) =>
            setFlow((f) =>
              f.open
                ? {
                    ...f,
                    selectedPet: pet,
                    step: "appointment",
                  }
                : f,
            )
          }
          petForm={petForm}
          setPetForm={setPetForm}
        />
      )}
    </Box>
  );
};

export default Dashboard;
