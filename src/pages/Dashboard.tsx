import { useState, useMemo } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import { Box, Typography, Badge } from "@mui/material";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import GroomingQueue from "../features/dashboard/GroomingQueue";
import OpenInvoices from "../features/dashboard/OpenInvoices";
import WaitingListCard from "../features/dashboard/WaitingListCard";
import type { WaitingListEntry } from "../features/appointments/waiting-list/types";
import { useWaitingList } from "../hooks/useWaitingList";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import "dayjs/locale/pt-br";
import dayjs from "dayjs";
import type {
  Appointment,
  AppointmentFlowState,
} from "../features/appointments/types";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAppointmentsByDay, getHighlightedDays } from "../api/services/appointments";
import NoAppointmentsBanner from "../features/appointments/NoAppointmentsBanner";
import OnboardingFinishBanner from "../features/onboarding/OnboardingFinishBanner";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button/Button";

function CustomDay(props: PickersDayProps & { highlightedDays?: Set<string>, day: dayjs.Dayjs }) {
  const { highlightedDays = new Set(), day, outsideCurrentMonth, ...other } = props;

  const hasAppointment = !outsideCurrentMonth && highlightedDays.has(day.format("YYYY-MM-DD"));

  if (!hasAppointment) {
    return <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />;
  }

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      variant="dot"
      sx={{
        "& .MuiBadge-badge": {
          backgroundColor: "#1976d2", // primary main
          bottom: 4,
          right: "50%",
          transform: "translateX(50%)",
          width: 14,
          height: 3,
          borderRadius: 2,
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

const Dashboard = () => {
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const queryClient = useQueryClient();
  const { tenant, checkAuth } = useAuth();
  const { deleteEntry: deleteWaitingListEntry } = useWaitingList();
  const isOnboarding = tenant?.onboarding_step !== "completed";

  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const [calendarMonth, setCalendarMonth] = useState<dayjs.Dayjs>(dayjs().startOf("month"));
  const formattedDate = date.format("YYYY-MM-DD");

  const { data: dailyAppointments = [], isFetching } = useQuery({
    queryKey: ["appointments", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
    placeholderData: keepPreviousData,
  });

  const { data: monthlyHighlights = [] } = useQuery({
    queryKey: ["appointments", "highlights", calendarMonth.format("YYYY-MM")],
    queryFn: () =>
      getHighlightedDays(
        calendarMonth.subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
        calendarMonth.add(1, "month").endOf("month").format("YYYY-MM-DD")
      ),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // Keep cached data fresh for 5 minutes
  });

  const highlightedDays = useMemo(() => {
    return new Set<string>(monthlyHighlights);
  }, [monthlyHighlights]);

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
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                gap: { xs: 2.5, md: 3, lg: 4 },
                alignItems: "flex-start",
              }}
            >
              {/* Coluna 1: Agendamentos (Ocupa 100% no LG/MD para dar fôlego, e fica fluida no XL) */}
              <Box
                sx={{
                  flex: { xs: "1 1 100%", lg: "1 1 0" },
                  width: "100%",
                }}
              >
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
                      initialDate: date.toISOString(),
                    })
                  }
                />
              </Box>

              {/* Barra Lateral / Grade de Widgets */}
              {/* No MD/SM (<1200px): Fica embaixo dos agendamentos em 2 colunas horizontais (sm: row) */}
              {/* No LG/XL (1200-1700px): Fica ao lado dos agendamentos em 1 única coluna vertical (lg: column) */}
              {/* Acima de 1700px: Expande para as 3 colunas totais (row) */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    md: "row",
                    lg: "column",
                  },
                  gap: { xs: 3, lg: 4 },
                  flex: {
                    xs: "1 1 100%",
                    lg: "0 0 340px",
                  },
                  "@media (min-width: 1700px)": {
                    flexDirection: "row",
                    flex: "0 0 680px",
                  },
                  width: "100%",
                  alignItems: "flex-start",
                }}
              >
                {/* Coluna A: Calendário e Fila de Atendimento */}
                <Box
                  sx={{
                    flex: { xs: "1 1 100%", md: "1 1 340px", lg: "0 0 340px" },
                    width: { xs: "100%", md: "340px" },
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: "white",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      overflow: "hidden",
                    }}
                  >
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
                        backgroundColor: "grey.50",
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Calendário
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {!date.isSame(dayjs(), "day") && (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ height: 24, fontSize: "0.7rem", py: 0, px: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDate(dayjs());
                              setCalendarMonth(dayjs().startOf("month"));
                              if (!isCalendarExpanded) setIsCalendarExpanded(true);
                            }}
                          >
                            Hoje
                          </Button>
                        )}
                        <Box
                          sx={{
                            transform: isCalendarExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "0.2s",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Box>
                      </Box>
                    </Box>

                    {isCalendarExpanded && (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DateCalendar
                          value={date}
                          onChange={(newDate) => {
                            if (newDate) setDate(newDate);
                          }}
                          onMonthChange={(newMonth) => setCalendarMonth(newMonth.startOf("month"))}
                          dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                            const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                            return days[day.day()];
                          }}
                          slots={{
                            day: CustomDay,
                          }}
                          slotProps={{
                            day: {
                              highlightedDays,
                            } as PickersDayProps & { highlightedDays: Set<string> },
                          }}
                          sx={{
                            width: "100%",
                            height: "320px",
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
                              fontSize: "0.9rem",
                            },
                            "& .MuiPickersArrowSwitcher-button": {
                              color: "#3d4048 !important",
                            },
                            "& .MuiDayCalendar-weekDayLabel": {
                              color: "#3d4048 !important",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            },
                            "& .MuiPickersDay-root": {
                              width: "36px",
                              height: "36px",
                              color: "#3d4048 !important",
                              fontSize: "0.85rem",
                              "&.MuiPickersDay-today:not(.Mui-selected)": {
                                border: "none !important",
                                backgroundColor: "#e0e0e0 !important",
                              },
                              "&.Mui-selected": {
                                color: "white !important",
                                backgroundColor: "primary.main !important",
                              },
                              "&.Mui-disabled": {
                                color: "#b8bbc2 !important",
                                opacity: 0.4,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  </Box>
                  <GroomingQueue appointments={dailyAppointments} isFetching={isFetching} />
                </Box>

                {/* Coluna B: Comandas e Lista de Espera */}
                <Box
                  sx={{
                    flex: { xs: "1 1 100%", md: "1 1 320px", lg: "0 0 320px" },
                    width: { xs: "100%", md: "320px" },
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <OpenInvoices />
                  <WaitingListCard
                    onScheduleEntry={(entry: WaitingListEntry) => {
                      setFlow({
                        open: true,
                        mode: "create",
                        step: "appointment",
                        selectedClient: entry.client,
                        waitingListEntryId: entry.id,
                        initialDate: entry.preferred_date ?? undefined,
                        prefill: {
                          client_id: entry.client_id,
                          notes: entry.notes || "",
                          items: entry.items.map((item) => ({
                            pet_id: item.pet_id,
                            service_ids: item.services.map((s) => s.id),
                          })),
                        },
                      });
                    }}
                  />
                </Box>
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
          initialDate={flow.initialDate}
          prefill={flow.prefill}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["appointments"],
            });
            if (flow.waitingListEntryId) {
              deleteWaitingListEntry(flow.waitingListEntryId);
            }
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
