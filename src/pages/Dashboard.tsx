import { useState } from "react";
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
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const isFlowOpen = (
    flow: AppointmentFlowState,
  ): flow is Extract<AppointmentFlowState, { open: true }> => {
    return flow.open;
  };

  console.log("flow", flow);
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
            <Typography fontWeight={400}>Agendamentos de hoje</Typography>
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
              10
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
              10
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
              R$ 4000
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
          gap: 2,
        }}
      >
        <Box sx={{ width: "60%" }}>
          <Typography variant="h5" fontWeight={600}>
            Agendas do dia
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
            <CustomCard>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </CustomCard>
          </Box>
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
                    setFlow({
                      open: true,
                      step: "appointment",
                    });
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

      {/* APPOINTMENT */}
      {isFlowOpen(flow) && (
        <AppointmentModal
          open={flow.step === "appointment"}
          selectedClient={flow.selectedClient}
          selectedPet={flow.selectedPet}
          onCreateClient={() =>
            setFlow((f) => (f.open ? { ...f, step: "client" } : f))
          }
          onCreatePet={() =>
            setFlow((f) => (f.open ? { ...f, step: "pet" } : f))
          }
          onClientSelect={(client) =>
            setFlow((f) => (f.open ? { ...f, selectedClient: client } : f))
          }
          onPetSelect={(pet) =>
            setFlow((f) => (f.open ? { ...f, selectedPet: pet } : f))
          }
          onClose={() => setFlow({ open: false })}
        />
      )}

      {/* CLIENT */}
      <ClientFormModal
        open={flow.open && flow.step === "client"}
        mode="create"
        onClose={() => setFlow({ open: false })}
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
      />

      {/* PET */}
      {isFlowOpen(flow) && flow.step === "pet" && (
        <PetFormModal
          open
          mode="create"
          clientId={flow.selectedClient?.id}
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
        />
      )}
    </Box>
  );
};

export default Dashboard;
