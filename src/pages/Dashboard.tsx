import { useEffect, useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import { Box, CircularProgress } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import InventoryAlerts from "../features/dashboard/InventoryAlerts";
import dayjs from "dayjs";
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
  const queryClient = useQueryClient();

  // Date state for the daily view
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const formattedDate = date.format("YYYY-MM-DD");

  // Daily appointments query
  const { data: dailyAppointments = [], isLoading: isLoadingDaily } = useQuery({
    queryKey: ["appointments", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
  });

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
          maxWidth: "1170px",
          mx: "auto",
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
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
              <Box sx={{ width: "100%", maxWidth: "70%" }}>
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
              <Box sx={{ width: "100%", maxWidth: "30%" }}>
                <InventoryAlerts />
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
        />
      )}

    </Box>
  );
};

export default Dashboard;
