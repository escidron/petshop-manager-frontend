import { useState, useMemo } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import { Box, Typography, Fab } from "@mui/material";
import { Plus } from "lucide-react";
import AppointmentsDailyList from "../features/appointments/AppointmentsDailyList";
import DashboardSummaryCards from "../features/dashboard/DashboardSummaryCards";
import DashboardCalendar from "../features/dashboard/DashboardCalendar";
import GroomingQueue from "../features/dashboard/GroomingQueue";
import OpenInvoices from "../features/dashboard/OpenInvoices";
import WaitingListCard from "../features/dashboard/WaitingListCard";
import type { WaitingListEntry } from "../features/appointments/waiting-list/types";
import { useWaitingListMutations } from "../hooks/useWaitingList";
import dayjs, { type Dayjs } from "dayjs";
import type {
  Appointment,
  AppointmentFlowState,
} from "../features/appointments/types";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardStartup } from "../api/services/dashboard";
import NoAppointmentsBanner from "../features/appointments/NoAppointmentsBanner";
import OnboardingFinishBanner from "../features/onboarding/OnboardingFinishBanner";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button/Button";

const Dashboard = () => {
  const [flow, setFlow] = useState<AppointmentFlowState>({ open: false });
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const queryClient = useQueryClient();
  const { tenant, checkAuth } = useAuth();
  const { deleteEntry: deleteWaitingListEntry } = useWaitingListMutations();
  const isOnboarding = tenant?.onboarding_step !== "completed";

  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const [calendarMonth, setCalendarMonth] = useState<dayjs.Dayjs>(dayjs().startOf("month"));
  const formattedDate = date.format("YYYY-MM-DD");

  const startDate = calendarMonth.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
  const endDate = calendarMonth.add(1, "month").endOf("month").format("YYYY-MM-DD");

  const { data: startupData, isFetching } = useQuery({
    queryKey: ["dashboard-startup", formattedDate, calendarMonth.format("YYYY-MM")],
    queryFn: async () => {
      const data = await getDashboardStartup(formattedDate, startDate, endDate);
      
      // Seed React Query cache with the startup data so individual components don't fetch again
      queryClient.setQueryData(["appointments", formattedDate], data.appointments_today);
      queryClient.setQueryData(["appointments", "highlights", calendarMonth.format("YYYY-MM")], data.highlighted_days);
      queryClient.setQueryData(["open-invoices", { limit: 15, search: "" }], data.open_invoices);
      queryClient.setQueryData(["unpaid-packages", { limit: 15, search: "" }], data.unpaid_packages);
      queryClient.setQueryData(["packages"], data.packages_catalog);
      queryClient.setQueryData(["waiting-list", "pending"], data.waiting_list_pending);
      queryClient.setQueryData(["waiting-list", undefined], data.waiting_list_pending);
      
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const dailyAppointments = startupData?.appointments_today || [];
  const monthlyHighlights = startupData?.highlighted_days || [];

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
          mt: { xs: 0.5, sm: 1.5, md: 2 },
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 0.5, sm: 1.5, md: 2 },
          pb: { xs: "calc(96px + env(safe-area-inset-bottom, 0px))", sm: "calc(96px + env(safe-area-inset-bottom, 0px))", md: 5 },
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
            <DashboardSummaryCards
              appointments={dailyAppointments}
              revenueCents={startupData?.daily_revenue_cents ?? 0}
              isFetching={isFetching}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                gap: { xs: 2, md: 2.5, lg: 2.5 },
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
                  onDateChange={(newDate) => {
                    setDate(newDate);
                    setCalendarMonth(newDate.startOf("month"));
                  }}
                  onMonthChange={(newMonth) => setCalendarMonth(newMonth.startOf("month"))}
                  highlightedDays={highlightedDays}
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
                  openFlow={(time?: Dayjs) =>
                    setFlow({
                      open: true,
                      step: "appointment",
                      mode: "create",
                      initialDate: (time ?? date).toISOString(),
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
                  gap: { xs: 2, lg: 2.5 },
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
                    gap: 2,
                  }}
                >
                  {/* Calendário (visível apenas em telas md+, no mobile abre pelo botão no topo) */}
                  <Box
                    sx={{
                      display: { xs: "none", md: "block" },
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
                      <DashboardCalendar
                        value={date}
                        onChange={(newDate) => {
                          if (newDate) setDate(newDate);
                        }}
                        onMonthChange={(newMonth) => setCalendarMonth(newMonth.startOf("month"))}
                        highlightedDays={highlightedDays}
                      />
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
                  <OpenInvoices
                    initialOpenComandas={startupData?.open_comandas}
                    initialUnpaidPackages={startupData?.unpaid_packages}
                    packagesCatalog={startupData?.packages_catalog}
                    isFetching={isFetching}
                  />
                  <WaitingListCard
                    entries={startupData?.waiting_list_pending}
                    isFetching={isFetching}
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

      {/* Mobile Floating Action Button (FAB) para Novo Agendamento */}
      <Fab
        variant="extended"
        color="primary"
        aria-label="Novo Agendamento"
        onClick={() =>
          setFlow({
            open: true,
            step: "appointment",
            mode: "create",
            initialDate: date.toISOString(),
          })
        }
        sx={{
          position: "fixed",
          bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
          right: 16,
          zIndex: 900,
          boxShadow: "0 6px 20px rgba(49, 52, 133, 0.4)",
          display: { xs: "flex", md: "none" },
          height: 48,
          minWidth: "auto",
          borderRadius: "24px",
          px: 2.5,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.9rem",
          gap: 0.75,
          whiteSpace: "nowrap",
        }}
      >
        <Plus size={20} />
        Agendar
      </Fab>

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
              queryKey: ["dashboard-startup"],
            });
            queryClient.invalidateQueries({
              queryKey: ["appointments"],
            });
            queryClient.invalidateQueries({
              queryKey: ["open-comandas"],
            });
            queryClient.invalidateQueries({
              queryKey: ["pos-startup"],
            });
            queryClient.invalidateQueries({
              queryKey: ["pos-client"],
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
