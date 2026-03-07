import { useEffect, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import ClientFormModal from "../features/clients/ClientFormModal";
import PetFormModal from "../features/pets/PetFormModal";
import { Box } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import { useClients } from "../hooks/useClients";
import { usePets } from "../hooks/usePets";
import type {
  Appointment,
  AppointmentFlowState,
} from "../features/appointments/types";
import { useQueryClient } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../api/services/appointments";
import NoAppointmentsBanner from "../features/appointments/NoAppointmentsBanner";
import OnboardingFinishBanner from "../features/onboarding/OnboardingFinishBanner";

const Dashboard = () => {
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { getClients } = useClients();
  const { getPets } = usePets();
  const queryClient = useQueryClient();
  console.log("Dashboard page");
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

  useEffect(() => {
    const fetchAppointments = async () => {
      const appointments = await getAppointmentsByTenant();
      setAppointments(appointments);
    };

    fetchAppointments();
  }, [flow]);
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
          flexDirection: "column",
          gap: 6,
        }}
      >
        {appointments.length > 0 ? (
          <Box sx={{ width: "60%" }}>
            <AppointmentsDailyList
              onEdit={(appointment: Appointment) =>
                setFlow({
                  open: true,
                  step: "appointment",
                  mode: "edit",
                  appointment,
                })
              }
              openFlow={() =>
                setFlow({
                  open: true,
                  step: "appointment",
                  mode: "create",
                })
              }
            />
          </Box>
        ) : (
          <>
            <OnboardingFinishBanner
              openFlow={() =>
                setFlow({
                  open: true,
                  step: "appointment",
                  mode: "create",
                })
              }
            />
            <NoAppointmentsBanner />
          </>
        )}
      </Box>

      {isFlowOpen(flow) && (
        <AppointmentModal
          open={flow.step === "appointment"}
          mode={flow.mode}
          selectedClient={flow.selectedClient}
          selectedPet={flow.selectedPet}
          appointment={flow.appointment}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["appointments"],
            });
            setFlow({ open: false });
          }}
          onClose={() => setFlow({ open: false })}
          onCreateClient={() => {
            setFlow({ open: true, step: "client", mode: "create" });
            setClientModal({ open: true, mode: "create" });
          }}
        />
      )}

      {isFlowOpen(flow) && flow.step === "client" && (
        <ClientFormModal
          open={clientModal.open}
          mode={clientModal.mode}
          client={clientModal.client}
          createPetMandatory={true}
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
