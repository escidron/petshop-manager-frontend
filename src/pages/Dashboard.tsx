import { useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import { Box, Typography } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import GroomingQueue from "../features/dashboard/GroomingQueue";
import OpenInvoices from "../features/dashboard/OpenInvoices";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import "dayjs/locale/pt-br";
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
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
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
          maxWidth: "1400px",
          mx: "auto",
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
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
            <Box sx={{ 
              width: "100%", 
              display: "flex", 
              gap: 4, 
              alignItems: "flex-start",
              flexWrap: { xs: "wrap", lg: "nowrap" }
            }}>
              {/* Coluna 1: Agendamentos */}
              <Box sx={{ flex: 1, minWidth: { xs: "100%", lg: 0 } }}>
                <AppointmentsDailyList
                  date={date}
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

              {/* Coluna 2: Calendário + Fila de Banho */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 320px" }, minWidth: 0 }}>
                <Box sx={{ 
                  backgroundColor: "white", 
                  borderRadius: 2, 
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  mb: 2
                }}>
                  <Box 
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    sx={{ 
                      p: 1.5, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      cursor: "pointer",
                      borderBottom: isCalendarExpanded ? "1px solid" : "none",
                      borderColor: "divider",
                      backgroundColor: "grey.50"
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      Calendário
                    </Typography>
                    <Box sx={{ transform: isCalendarExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "0.2s" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </Box>
                  </Box>

                  {isCalendarExpanded && (
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                      <DateCalendar
                        value={date}
                        onChange={(newDate) => {
                          if (newDate) setDate(newDate);
                        }}
                        dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                          const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
                          return days[day.day()];
                        }}
                        sx={{
                          width: "100%",
                          height: "300px",
                          margin: 0,
                          backgroundColor: "#ffffff",
                          "& *": {
                            color: "#3d4048 !important",
                          },
                          "& .MuiPickersCalendarHeader-root": { 
                            mt: 1, 
                            mb: 0,
                            px: 2,
                            minHeight: "40px",
                          },
                          "& .MuiPickersCalendarHeader-labelContainer": {
                            color: "#3d4048 !important",
                          },
                          "& .MuiPickersCalendarHeader-label": {
                            color: "#3d4048 !important",
                            fontWeight: 600,
                            fontSize: "0.9rem"
                          },
                          "& .MuiPickersArrowSwitcher-button": {
                            color: "#3d4048 !important"
                          },
                          "& .MuiDayCalendar-weekDayLabel": {
                            color: "#3d4048 !important",
                            fontWeight: 700,
                            fontSize: "0.75rem"
                          },
                          "& .MuiPickersDay-root": { 
                            width: "36px", 
                            height: "36px",
                            color: "#3d4048 !important",
                            fontSize: "0.85rem",
                            "&.Mui-selected": {
                              color: "white !important",
                              backgroundColor: "primary.main !important"
                            },
                          }
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </Box>
                <GroomingQueue />
              </Box>

              {/* Coluna 3: Comandas em Aberto */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 300px" }, minWidth: 0 }}>
                <OpenInvoices />
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
