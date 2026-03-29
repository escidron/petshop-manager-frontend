import { useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import { Box } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import InventoryAlerts from "../features/dashboard/InventoryAlerts";
import dayjs from "dayjs";
import type {
  Appointment,
  AppointmentFlowState,
} from "../features/appointments/types";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppointmentsByDay } from "../api/services/appointments";
import NoAppointmentsBanner from "../features/appointments/NoAppointmentsBanner";
import OnboardingFinishBanner from "../features/onboarding/OnboardingFinishBanner";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const queryClient = useQueryClient();
  const { tenant, checkAuth } = useAuth();
  const isOnboarding = tenant?.onboarding_step !== "completed";

  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const formattedDate = date.format("YYYY-MM-DD");

  const { data: dailyAppointments = [], isFetching } = useQuery({
    queryKey: ["appointments", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
    placeholderData: keepPreviousData,
  });

  const isFlowOpen = (
    flow: AppointmentFlowState,
  ): flow is Extract<AppointmentFlowState, { open: true }> => {
    return flow.open;
  };

  return (
    <Box>
      <Box
        sx={{
          maxWidth: "1170px",
          mx: "auto",
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {isOnboarding ? (
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
        ) : (
          <>
            <DashboardSummaryCards appointments={dailyAppointments} isFetching={isFetching} />
            <Box sx={{ width: "100%", display: "flex", gap: 4 }}>
              <Box sx={{ width: "100%", maxWidth: "70%" }}>
                <AppointmentsDailyList
                  date={date}
                  setDate={setDate}
                  appointments={dailyAppointments}
                  isFetching={isFetching}
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
              <Box sx={{ width: "100%", maxWidth: "30%" }}>
                <InventoryAlerts />
              </Box>
            </Box>
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
            if (isOnboarding) checkAuth();
            setFlow({ open: false });
          }}
          onClose={() => setFlow({ open: false })}
        />
      )}

    </Box>
  );
};

export default Dashboard;
