import { useEffect, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import ClientFormModal from "../features/clients/ClientFormModal";
import PetFormModal from "../features/pets/PetFormModal";
import { Box, CircularProgress } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import dayjs from "dayjs";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import { useClients } from "../hooks/useClients";
import { usePets } from "../hooks/usePets";
import type {
  Appointment,
  AppointmentFlowState,
} from "../features/appointments/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAppointmentsByDay,
  getAppointmentsByTenant,
} from "../api/services/appointments";
import NoAppointmentsBanner from "../features/appointments/NoAppointmentsBanner";
import OnboardingFinishBanner from "../features/onboarding/OnboardingFinishBanner";

const Dashboard = () => {
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getClients } = useClients();
  const { getPets } = usePets();
  const queryClient = useQueryClient();

  // Date state for the daily view
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const formattedDate = date.format("YYYY-MM-DD");

  // Daily appointments query
  const { data: dailyAppointments = [], isLoading: isLoadingDaily } = useQuery({
    queryKey: ["appointments", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
  });

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
    let isMounted = true;

    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const fetchedAppointments = await getAppointmentsByTenant();
        if (isMounted) {
          setAppointments(fetchedAppointments);
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      isMounted = false;
    };
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
      ></Box>
      <Box
        sx={{
          maxWidth: "1170px",
          mx: "auto",
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2, // Adjusted gap
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "200px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : appointments.length > 0 ? (
          <>
            <DashboardSummaryCards appointments={dailyAppointments} />
            <Box sx={{ width: "100%", display: "flex", gap: 4 }}>
              <Box sx={{ width: "70%" }}>
                <AppointmentsDailyList
                  date={date}
                  setDate={setDate}
                  appointments={dailyAppointments}
                  isLoading={isLoadingDaily}
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
              <Box sx={{ width: "30%" }}>
                {/* Space for future sidebar widgets in dashboard if needed */}
              </Box>
            </Box>
          </>
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
