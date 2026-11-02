import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AlertTriangle,
  Bell,
  Calendar as CalendarIcon,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Info,
  PawPrint,
  Pill,
  Plus,
  Repeat,
  Search,
  ShoppingBag,
  ShowerHead,
  Sun,
  Utensils,
  X,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import CustomCard from "../components/Card/CustomCard";
import DashboardCalendar from "../features/dashboard/DashboardCalendar";
import OpenInvoices from "../features/dashboard/OpenInvoices";
import AppointmentModal from "../features/appointments/AppointmentModal";
import DaycareDetailsModal, {
  DaycareStatusChip,
  getDaycareStatusUI,
} from "../features/daycare/DaycareDetailsModal";
import DaycareModal from "../features/daycare/DaycareModal";
import DaycareObservationModal from "../features/daycare/DaycareObservationModal";
import DaycareServiceSummaryModal, {
  type DaycareGroup,
} from "../features/daycare/DaycareServiceSummaryModal";
import PetHealthModal from "../features/daycare/PetHealthModal";
import { getAppointmentsByDay } from "../api/services/appointments";
import {
  applyDaycareStayAction,
  deleteDaycareStay,
  listDaycareHighlightedDays,
  listDaycareStaysByDay,
  updateDaycareTask,
} from "../api/services/daycare";
import { Button } from "../components/Button/Button";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getServiceIcons } from "../utils/getServiceIcons";
import type { Appointment } from "../features/appointments/types";
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import type {
  DaycareStay,
  DaycareStayAction,
  DaycareStayStatus,
  DaycareTask,
} from "../features/daycare/types";

dayjs.locale("pt-br");

type FilterStatus = "all" | DaycareStayStatus;

const SummaryCard = ({
  icon,
  label,
  value,
  iconColor,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor: string;
  bgColor: string;
}) => (
  <CustomCard
    sx={{
      height: "100%",
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      p: { xs: 1.2, sm: 1.4 },
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        minWidth: 40,
        borderRadius: "10px",
        backgroundColor: bgColor,
        color: iconColor,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: "text.primary",
          opacity: 0.6,
          fontSize: "0.8rem",
          display: "block",
          lineHeight: 1.2,
          mb: 0.15,
        }}
        noWrap
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "text.primary",
          fontSize: "1.25rem",
          lineHeight: 1.2,
        }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  </CustomCard>
);

export default function DaycarePage() {
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";

  const [date, setDate] = useState<Dayjs>(dayjs());
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    stay?: DaycareStay | null;
  }>({ open: false, mode: "create", stay: null });

  const [detailsStayId, setDetailsStayId] = useState<number | null>(null);
  const [selectedServiceGroup, setSelectedServiceGroup] = useState<DaycareGroup | null>(null);
  const [selectedObsGroup, setSelectedObsGroup] = useState<DaycareGroup | null>(null);

  const [bathModalState, setBathModalState] = useState<{
    open: boolean;
    client?: Client;
    pet?: Pet;
    date?: string;
  }>({ open: false });

  const [healthModalPet, setHealthModalPet] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const formattedDate = date.format("YYYY-MM-DD");
  const startDate = calendarMonth.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
  const endDate = calendarMonth.add(1, "month").endOf("month").format("YYYY-MM-DD");

  const { data: stays = [], isFetching } = useQuery<DaycareStay[]>({
    queryKey: ["daycare", "day", formattedDate],
    queryFn: () => listDaycareStaysByDay(formattedDate),
    placeholderData: keepPreviousData,
  });

  const { data: dayAppointmentsData } = useQuery({
    queryKey: ["appointments", "day", formattedDate],
    queryFn: () => getAppointmentsByDay(formattedDate),
    placeholderData: keepPreviousData,
  });

  const dayAppointments: Appointment[] = useMemo(() => {
    if (Array.isArray(dayAppointmentsData)) return dayAppointmentsData;
    if (Array.isArray((dayAppointmentsData as any)?.appointments)) {
      return (dayAppointmentsData as any).appointments;
    }
    return [];
  }, [dayAppointmentsData]);

  const { data: highlightedList = [] } = useQuery<string[]>({
    queryKey: ["daycare", "highlights", calendarMonth.format("YYYY-MM")],
    queryFn: () => listDaycareHighlightedDays(startDate, endDate),
    placeholderData: keepPreviousData,
  });

  const highlightedDays = useMemo(() => new Set<string>(highlightedList), [highlightedList]);

  const summary = useMemo(() => {
    const total = stays.length;
    const confirmedOrPresent = stays.filter(
      (s) => s.status === "checked_in" || s.status === "checked_out"
    ).length;
    const canceledOrAbsent = stays.filter(
      (s) => s.status === "canceled" || s.status === "absent"
    ).length;

    const revenueCents = stays
      .filter((s) => s.status === "checked_out")
      .reduce(
        (acc, s) =>
          acc +
          (s.total_price_cents > 0
            ? s.total_price_cents
            : !s.is_package_covered && s.service
            ? (s.service.price_cents || 0) * (s.quantity || 1)
            : 0),
        0
      );

    const formattedRevenue = (revenueCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return {
      total,
      confirmedOrPresent,
      canceledOrAbsent,
      formattedRevenue,
    };
  }, [stays]);

  const filteredStays = useMemo(() => {
    return stays.filter((s) => {
      if (statusFilter === "all" && s.status === "canceled") return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchClient = s.client?.name?.toLowerCase().includes(q);
      const matchPet = s.pet?.name?.toLowerCase().includes(q);
      return matchClient || matchPet;
    });
  }, [stays, statusFilter, search]);

  // Agrupamento de estadias do mesmo tutor no mesmo horário (Padrão Banho & Tosa)
  const stayGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        primaryStay: DaycareStay;
        stays: DaycareStay[];
        client: DaycareStay["client"];
        scheduled_start_at: string;
        scheduled_end_at: string;
        status: DaycareStayStatus;
      }
    >();

    for (const stay of filteredStays) {
      const key = `${stay.client_id}_${stay.scheduled_start_at}_${stay.scheduled_end_at}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          primaryStay: stay,
          stays: [stay],
          client: stay.client,
          scheduled_start_at: stay.scheduled_start_at,
          scheduled_end_at: stay.scheduled_end_at,
          status: stay.status,
        });
      } else {
        const group = map.get(key)!;
        group.stays.push(stay);
      }
    }

    return Array.from(map.values());
  }, [filteredStays]);

  // Lista cronológica de todas as tarefas (Ração e Remédios) do dia
  const allDayTasks = useMemo(() => {
    const list: {
      task: DaycareTask;
      petName: string;
      clientName: string;
      stayStatus: DaycareStayStatus;
    }[] = [];

    for (const stay of stays) {
      if (stay.status === "absent" || stay.status === "canceled") continue;
      for (const t of stay.tasks || []) {
        list.push({
          task: t,
          petName: stay.pet?.name || "Pet",
          clientName: stay.client?.name || "",
          stayStatus: stay.status,
        });
      }
    }

    return list.sort((a, b) =>
      a.task.scheduled_time.localeCompare(b.task.scheduled_time)
    );
  }, [stays]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["daycare"] });
    queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
    queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
    queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
  };

  const handleDateChange = (newDate: Dayjs) => {
    setDate(newDate);
    setCalendarMonth(newDate.startOf("month"));
  };

  const handleAction = async (stay: DaycareStay, action: DaycareStayAction) => {
    try {
      setActionLoadingId(stay.id);
      const targetGroup = stays.filter(
        (s) =>
          s.client_id === stay.client_id &&
          s.scheduled_start_at === stay.scheduled_start_at &&
          s.scheduled_end_at === stay.scheduled_end_at
      );
      const staysToUpdate = targetGroup.length > 0 ? targetGroup : [stay];
      let lastUpdated = stay;
      for (const s of staysToUpdate) {
        lastUpdated = await applyDaycareStayAction(s.id, action);
      }
      const petNames = staysToUpdate
        .map((s) => s.pet?.name)
        .filter(Boolean)
        .join(" e ");

      if (action === "check_in") {
        toast.success(`Check-in de ${petNames} realizado!`);
      } else if (action === "check_out") {
        if (lastUpdated.covered_quantity > 0) {
          toast.success(
            `Check-out de ${petNames} realizado! (${lastUpdated.covered_quantity} crédito(s) descontado(s) do pacote)`
          );
        } else if (lastUpdated.service_id) {
          toast.success(
            `Check-out de ${petNames} realizado! Itens enviados para a Comanda no Caixa.`
          );
        } else {
          toast.success(`Check-out de ${petNames} realizado!`);
        }
      } else if (action === "mark_absent") {
        toast.success(`Falta registrada para ${petNames} (sem descontar pacote).`);
      } else if (action === "reopen") {
        toast.success(`Estadia de ${petNames} reaberta.`);
      }
      refreshData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Não foi possível atualizar o status da estadia."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (stay: DaycareStay) => {
    const targetGroup = stays.filter(
      (s) =>
        s.client_id === stay.client_id &&
        s.scheduled_start_at === stay.scheduled_start_at &&
        s.scheduled_end_at === stay.scheduled_end_at
    );
    const staysToDelete = targetGroup.length > 0 ? targetGroup : [stay];
    const petNames = staysToDelete
      .map((s) => s.pet?.name)
      .filter(Boolean)
      .join(" e ");

    if (
      !window.confirm(
        `Deseja realmente remover o agendamento de ${petNames}?`
      )
    ) {
      return;
    }
    try {
      setActionLoadingId(stay.id);
      for (const s of staysToDelete) {
        await deleteDaycareStay(s.id);
      }
      toast.success("Agendamento removido.");
      setDetailsStayId(null);
      refreshData();
    } catch {
      toast.error("Erro ao remover agendamento.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleTask = async (task: DaycareTask) => {
    try {
      await updateDaycareTask(task.id, { is_completed: !task.is_completed });
      queryClient.invalidateQueries({ queryKey: ["daycare", "day", formattedDate] });
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
    }
  };

  const handleSendWhatsAppReport = (stay: DaycareStay) => {
    const rawPhone = (stay.client?.phone || "").replace(/\D/g, "");
    if (!rawPhone) {
      toast.error("O cliente não possui telefone cadastrado.");
      return;
    }
    const phoneWithCountry = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;

    const checkInStr = stay.check_in_at
      ? dayjs(stay.check_in_at).format("HH:mm")
      : dayjs(stay.scheduled_start_at).format("HH:mm");
    const checkOutStr = stay.check_out_at
      ? dayjs(stay.check_out_at).format("HH:mm")
      : dayjs(stay.scheduled_end_at).format("HH:mm");

    const feedingTasks = (stay.tasks || []).filter((t) => t.task_type === "feeding");
    const medTasks = (stay.tasks || []).filter((t) => t.task_type === "medication");

    const lines = [
      `🐾 *Boletim da Creche — ${stay.pet?.name}* (${date.format("DD/MM/YYYY")})`,
      `✅ *Entrada:* ${checkInStr} | *Saída:* ${checkOutStr}`,
    ];

    if (stay.food_info) {
      lines.push(`🥣 *Alimentação:* ${stay.food_info}`);
    }
    if (feedingTasks.length > 0) {
      const doneCount = feedingTasks.filter((t) => t.is_completed).length;
      lines.push(
        `🍽️ *Refeições no dia:* ${doneCount}/${feedingTasks.length} concluída(s)`
      );
    }
    if (medTasks.length > 0) {
      const medsSummary = medTasks
        .map(
          (m) =>
            `${m.scheduled_time} - ${m.title} (${m.is_completed ? "Administrado ✓" : "Pendente"})`
        )
        .join(", ");
      lines.push(`💊 *Medicação:* ${medsSummary}`);
    }
    if (stay.notes) {
      lines.push(`📝 *Observações:* ${stay.notes}`);
    }

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const nowTimeStr = dayjs().format("HH:mm");
  const isTodaySelected = date.isSame(dayjs(), "day");
  const pendingTasksCount = allDayTasks.filter((t) => !t.task.is_completed).length;

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
          pb: {
            xs: "calc(96px + env(safe-area-inset-bottom, 0px))",
            sm: "calc(96px + env(safe-area-inset-bottom, 0px))",
            md: 5,
          },
        }}
      >
        {/* 1. CARDS DE RESUMO DO TOPO (Idênticos ao DashboardSummaryCards do Banho & Tosa) */}
        <Box sx={{ width: "100%", mb: { xs: 1.25, sm: 1.75 } }}>
          {/* ── MOBILE: Todos os 4 em 1 única linha compacta ── */}
          <CustomCard
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 1.25,
              borderRadius: 2.5,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
              <Typography
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: { xs: "0.62rem", sm: "0.75rem" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  lineHeight: 1,
                }}
              >
                <CalendarDays size={12} /> Agendamentos
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "text.primary",
                  lineHeight: 1.2,
                  mt: 0.35,
                }}
              >
                {isFetching ? <Skeleton width={20} sx={{ mx: "auto" }} /> : summary.total}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />

            <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
              <Typography
                sx={{
                  color: "info.main",
                  fontWeight: 700,
                  fontSize: { xs: "0.62rem", sm: "0.75rem" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  lineHeight: 1,
                }}
              >
                <CalendarCheck size={12} /> Confirmados
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "text.primary",
                  lineHeight: 1.2,
                  mt: 0.35,
                }}
              >
                {isFetching ? (
                  <Skeleton width={20} sx={{ mx: "auto" }} />
                ) : (
                  summary.confirmedOrPresent
                )}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />

            <Box sx={{ flex: 1, textAlign: "center", minWidth: 0, px: 0.25 }}>
              <Typography
                sx={{
                  color: "error.main",
                  fontWeight: 700,
                  fontSize: { xs: "0.62rem", sm: "0.75rem" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  lineHeight: 1,
                }}
              >
                <CalendarX size={12} /> Cancelados
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "text.primary",
                  lineHeight: 1.2,
                  mt: 0.35,
                }}
              >
                {isFetching ? (
                  <Skeleton width={20} sx={{ mx: "auto" }} />
                ) : (
                  summary.canceledOrAbsent
                )}
              </Typography>
            </Box>

            {isOwnerOrAdmin && (
              <>
                <Divider orientation="vertical" flexItem sx={{ my: 0.5, opacity: 0.4 }} />
                <Box sx={{ flex: 1.25, textAlign: "center", minWidth: 0, px: 0.25 }}>
                  <Typography
                    sx={{
                      color: "success.main",
                      fontWeight: 700,
                      fontSize: { xs: "0.62rem", sm: "0.75rem" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.35,
                      lineHeight: 1,
                    }}
                  >
                    <DollarSign size={12} /> Faturamento
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.88rem",
                      color: "text.primary",
                      lineHeight: 1.2,
                      mt: 0.35,
                    }}
                    noWrap
                  >
                    {isFetching ? (
                      <Skeleton width={40} sx={{ mx: "auto" }} />
                    ) : (
                      summary.formattedRevenue
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </CustomCard>

          {/* ── DESKTOP: Cards Individuais em Grade ── */}
          <Grid
            container
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Grid size={{ md: 6, lg: 3 }}>
              <SummaryCard
                icon={<CalendarDays size={20} />}
                label="Agendamentos"
                value={
                  isFetching ? (
                    <Skeleton width={40} sx={{ bgcolor: "grey.200" }} />
                  ) : (
                    summary.total
                  )
                }
                iconColor={theme.palette.primary.main}
                bgColor="rgba(49, 52, 133, 0.1)"
              />
            </Grid>
            <Grid size={{ md: 6, lg: 3 }}>
              <SummaryCard
                icon={<CalendarCheck size={20} />}
                label="Confirmados"
                value={
                  isFetching ? (
                    <Skeleton width={40} sx={{ bgcolor: "grey.200" }} />
                  ) : (
                    summary.confirmedOrPresent
                  )
                }
                iconColor={theme.palette.info.main}
                bgColor="rgba(2, 136, 209, 0.1)"
              />
            </Grid>
            <Grid size={{ md: 6, lg: 3 }}>
              <SummaryCard
                icon={<CalendarX size={20} />}
                label="Cancelados"
                value={
                  isFetching ? (
                    <Skeleton width={40} sx={{ bgcolor: "grey.200" }} />
                  ) : (
                    summary.canceledOrAbsent
                  )
                }
                iconColor={theme.palette.error.main}
                bgColor="rgba(211, 47, 47, 0.1)"
              />
            </Grid>
            {isOwnerOrAdmin && (
              <Grid size={{ md: 6, lg: 3 }}>
                <SummaryCard
                  icon={<DollarSign size={20} />}
                  label="Faturamento"
                  value={
                    isFetching ? (
                      <Skeleton width={80} sx={{ bgcolor: "grey.200" }} />
                    ) : (
                      summary.formattedRevenue
                    )
                  }
                  iconColor={theme.palette.success.main}
                  bgColor="rgba(46, 125, 50, 0.1)"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* 2. CORPO PRINCIPAL (Idêntico ao layout do Dashboard de Banho & Tosa) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: { xs: 2, md: 2.5, lg: 2.5 },
            alignItems: "flex-start",
          }}
        >
          {/* Coluna 1: Lista da Creche do Dia */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", lg: "1 1 0" },
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Header idêntico ao AppointmentsDailyList */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                {/* Lado Esquerdo: Título e Data descritiva */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="text.primary"
                    sx={{
                      fontSize: { xs: "1.1rem", sm: "1.25rem", xl: "1.35rem" },
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Creche do dia
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.disabled",
                      fontWeight: 500,
                      display: { xs: "none", md: "block" },
                      mt: 0.2,
                      textTransform: "capitalize",
                      fontSize: "0.85rem",
                    }}
                  >
                    {date.format("dddd, DD [de] MMMM")}
                  </Typography>
                </Box>

                {/* Lado Direito Desktop: Busca + Botão Filtro + Botão (+) */}
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" },
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 0.75,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Buscar tutor ou pet"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{
                        width: { md: "200px", lg: "250px" },
                        backgroundColor: "white",
                        borderRadius: 1,
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search size={16} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <IconButton
                      onClick={() => setFiltersOpen((prev) => !prev)}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor:
                          filtersOpen || statusFilter !== "all"
                            ? "primary.main"
                            : "divider",
                        bgcolor:
                          filtersOpen || statusFilter !== "all"
                            ? "rgba(49, 52, 133, 0.08)"
                            : "white",
                        color:
                          filtersOpen || statusFilter !== "all"
                            ? "primary.main"
                            : "text.secondary",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "rgba(49, 52, 133, 0.04)",
                        },
                      }}
                      title="Filtros"
                    >
                      <Filter size={18} />
                    </IconButton>
                    <Button
                      size="small"
                      sx={{
                        minWidth: "38px",
                        width: "38px",
                        height: "38px",
                        p: 0,
                        borderRadius: 1,
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                      onClick={() =>
                        setModalState({ open: true, mode: "create", stay: null })
                      }
                      title="Novo Agendamento na Creche"
                    >
                      <Plus size={20} />
                    </Button>
                  </Box>

                  {(filtersOpen || statusFilter !== "all") && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      {[
                        { id: "all", label: "Todos" },
                        { id: "pending", label: "Aguardando" },
                        { id: "checked_in", label: "No Pátio" },
                        { id: "checked_out", label: "Finalizados" },
                        { id: "absent", label: "Faltas" },
                      ].map((tab) => (
                        <Chip
                          key={tab.id}
                          size="small"
                          label={tab.label}
                          onClick={() => setStatusFilter(tab.id as FilterStatus)}
                          color={statusFilter === tab.id ? "primary" : "default"}
                          variant={statusFilter === tab.id ? "filled" : "outlined"}
                          sx={{ fontWeight: 700, cursor: "pointer" }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Lado Direito Mobile: Seletor de data compacto idêntico ao Banho e Tosa */}
                <Box
                  sx={{
                    display: { xs: "flex", md: "none" },
                    alignItems: "center",
                    bgcolor: "white",
                    borderRadius: 2,
                    p: 0.35,
                    height: 38,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    flexShrink: 0,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleDateChange(date.subtract(1, "day"))}
                    sx={{
                      color: "text.primary",
                      width: 32,
                      height: 32,
                      p: 0.5,
                      borderRadius: 1.5,
                    }}
                    aria-label="Dia anterior"
                  >
                    <ChevronLeft size={18} />
                  </IconButton>

                  <Box
                    onClick={() => setCalendarModalOpen(true)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.6,
                      cursor: "pointer",
                      px: 0.75,
                      py: 0.4,
                      height: "100%",
                      borderRadius: 1,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <CalendarIcon size={15} color={theme.palette.primary.main} />
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "text.primary",
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {date.isSame(dayjs(), "day")
                        ? `Hoje, ${date.format("DD/MM")}`
                        : date.format("ddd, DD/MM")}
                    </Typography>
                  </Box>

                  {!date.isSame(dayjs(), "day") && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDateChange(dayjs())}
                      sx={{
                        height: 24,
                        fontSize: "0.7rem",
                        py: 0,
                        px: 0.6,
                        minWidth: "auto",
                        borderRadius: 0.8,
                        mr: 0.25,
                      }}
                    >
                      Hoje
                    </Button>
                  )}

                  <IconButton
                    size="small"
                    onClick={() => handleDateChange(date.add(1, "day"))}
                    sx={{
                      color: "text.primary",
                      width: 32,
                      height: 32,
                      p: 0.5,
                      borderRadius: 1.5,
                    }}
                    aria-label="Próximo dia"
                  >
                    <ChevronRight size={18} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* LISTA DE CARDS DA CRECHE */}
            {isFetching && stays.length === 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <CustomCard key={i} sx={{ p: 2 }}>
                    <Skeleton variant="text" width="45%" height={28} />
                    <Skeleton variant="text" width="70%" />
                  </CustomCard>
                ))}
              </Box>
            ) : filteredStays.length === 0 ? (
              <CustomCard
                sx={{
                  py: 6,
                  px: 2,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <PawPrint size={38} color="#94a3b8" />
                <Typography variant="subtitle1" fontWeight={700} mt={0.5}>
                  Nenhum pet agendado na creche para este dia
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  Clique no botão abaixo para agendar uma diária, período por hora ou vários dias.
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() =>
                    setModalState({ open: true, mode: "create", stay: null })
                  }
                >
                  Novo Agendamento
                </Button>
              </CustomCard>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {stayGroups.map((group) => {
                  const primaryStay = group.primaryStay;
                  const startMoment = dayjs(group.scheduled_start_at);
                  const endMoment = dayjs(group.scheduled_end_at);
                  const statusUI = getDaycareStatusUI(group.status);
                  const cardBorderColor = statusUI.color;

                  const hasAnyNotes = group.stays.some((s) =>
                    Boolean(
                      (s.notes && s.notes.trim() !== "") ||
                        (s.food_info && s.food_info.trim() !== "") ||
                        (s.belongings && s.belongings.trim() !== "") ||
                        (s.pet?.notes && s.pet.notes.trim() !== "")
                    )
                  );

                  const pendingTasks = group.stays.flatMap((s) =>
                    (s.tasks || []).filter((t) => !t.is_completed)
                  );
                  const hasFeeding = group.stays.some(
                    (s) =>
                      Boolean(s.food_info) ||
                      (s.tasks || []).some((t) => t.task_type === "feeding")
                  );
                  const hasMedication = group.stays.some((s) =>
                    (s.tasks || []).some((t) => t.task_type === "medication")
                  );
                  const extraServiceIcons = group.stays.flatMap((s) =>
                    s.service ? getServiceIcons([s.service.name]) : []
                  );

                  const petBathAppt = dayAppointments.find(
                    (a) =>
                      a.status !== "canceled" &&
                      a.items?.some((it) =>
                        group.stays.some((s) => s.pet_id === it.pet?.id)
                      )
                  );

                  const isRecurrentGroup = group.stays.some((s) =>
                    Boolean(s.recurrence_id)
                  );
                  const isPackageCoveredGroup = group.stays.every((s) =>
                    Boolean(s.is_package_covered)
                  );

                  return (
                    <CustomCard
                      key={group.key}
                      sx={{
                        px: { xs: 1.25, sm: 2 },
                        py: { xs: 0.85, sm: 1 },
                        border: "1px solid",
                        borderColor: "divider",
                        borderLeft: "5px solid",
                        borderLeftColor: cardBorderColor,
                        width: "100%",
                        opacity:
                          group.status === "canceled" ||
                          group.status === "absent"
                            ? 0.5
                            : 1,
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                        "&:hover": {
                          borderColor: cardBorderColor,
                          borderLeftColor: cardBorderColor,
                        },
                      }}
                      onClick={() => setDetailsStayId(primaryStay.id)}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 1.25, sm: 2, md: 3, lg: 3, xl: 6 },
                          flexWrap: "nowrap",
                        }}
                      >
                        {/* Coluna de Horário */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: { xs: 42, sm: 50 },
                            flexShrink: 0,
                          }}
                        >
                          <Typography
                            fontWeight={700}
                            fontSize={{ xs: "0.85rem", sm: "0.95rem" }}
                            lineHeight={1}
                          >
                            {startMoment.format("HH:mm")}
                          </Typography>
                          <Box
                            sx={{
                              width: "1.5px",
                              height: "6px",
                              bgcolor: "divider",
                              my: "2px",
                              borderRadius: 1,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: { xs: "0.72rem", sm: "0.8rem" },
                              color: "text.primary",
                              opacity: 0.65,
                              fontWeight: 500,
                              lineHeight: 1,
                            }}
                          >
                            {endMoment.format("HH:mm")}
                          </Typography>
                        </Box>

                        {/* Coluna Tutor & Pets */}
                        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <Typography
                            fontSize={{ xs: "0.84rem", sm: "0.95rem" }}
                            fontWeight={500}
                            color="text.primary"
                            noWrap
                            sx={{
                              maxWidth: { xs: "100%", sm: "240px", md: "340px" },
                              lineHeight: 1.2,
                              opacity: 0.7,
                            }}
                          >
                            {group.client?.name}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.75,
                              alignItems: "center",
                              flexWrap: "nowrap",
                              overflow: "hidden",
                              mt: 0.25,
                            }}
                          >
                            {group.stays.map((s, index) => (
                              <Box
                                key={s.id}
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  alignItems: "center",
                                  minWidth: 0,
                                  flexShrink: index === 0 ? 0 : 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  fontWeight={700}
                                  noWrap
                                  sx={{
                                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                    maxWidth: { xs: "110px", sm: "180px" },
                                  }}
                                >
                                  {s.pet?.name}
                                </Typography>
                                {index < group.stays.length - 1 && (
                                  <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    sx={{ fontSize: "0.75rem" }}
                                  >
                                    •
                                  </Typography>
                                )}
                              </Box>
                            ))}

                            {hasAnyNotes && (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.35,
                                  alignItems: "center",
                                  cursor: "pointer",
                                  px: 0.5,
                                  py: 0.15,
                                  borderRadius: 1,
                                  bgcolor: "rgba(233, 30, 99, 0.08)",
                                  flexShrink: 0,
                                  transition: "background-color 0.15s ease",
                                  "&:hover": { bgcolor: "rgba(233, 30, 99, 0.18)" },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedObsGroup(group);
                                }}
                              >
                                <Info size={11} color={theme.palette.error.main} />
                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  fontWeight={700}
                                  sx={{ fontSize: "0.65rem" }}
                                >
                                  Obs
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {/* Coluna Direita: Alerta + Status Chip + Ícones */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 0.5, sm: 1.5 },
                            marginLeft: "auto",
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: { xs: "none", sm: "flex" },
                              alignItems: "center",
                              gap: 1,
                              justifyContent: "flex-end",
                              minWidth: { sm: 120 },
                              flexShrink: 0,
                              flexWrap: "nowrap",
                            }}
                          >
                            {pendingTasks.length > 0 && (
                              <Tooltip
                                title={`${pendingTasks.length} horário(s) de ração/remédio pendente(s)`}
                                arrow
                                placement="top"
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#f59e0b",
                                  }}
                                >
                                  <AlertTriangle size={19} strokeWidth={2.2} />
                                </Box>
                              </Tooltip>
                            )}
                            <DaycareStatusChip status={group.status} size="small" />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.6,
                              alignItems: "center",
                              justifyContent: "flex-end",
                              width: { xs: "auto", sm: 110 },
                              minWidth: { xs: "auto", sm: 110 },
                              cursor: "pointer",
                              borderRadius: 1,
                              px: { xs: 0.75, sm: 1 },
                              py: 0.5,
                              flexShrink: 0,
                              transition: "background-color 0.15s ease",
                              "&:hover": { bgcolor: "grey.100" },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedServiceGroup(group);
                            }}
                          >
                            <Tooltip
                              title={
                                primaryStay.modality?.name ||
                                (primaryStay.stay_type === "hourly"
                                  ? `Por hora (${primaryStay.quantity}h)`
                                  : primaryStay.stay_type === "multi_day"
                                  ? `${primaryStay.quantity} diárias`
                                  : "Período")
                              }
                              arrow
                              placement="top"
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.7,
                                }}
                              >
                                {primaryStay.stay_type === "hourly" ? (
                                  <Clock size={18} />
                                ) : primaryStay.stay_type === "multi_day" ? (
                                  <CalendarIcon size={18} />
                                ) : (
                                  <Sun size={18} />
                                )}
                              </Box>
                            </Tooltip>

                            {hasFeeding && (
                              <Tooltip title="Ração / Alimentação" arrow placement="top">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: 0.7,
                                  }}
                                >
                                  <Utensils size={17} />
                                </Box>
                              </Tooltip>
                            )}

                            {hasMedication && (
                              <Tooltip title="Medicação programada" arrow placement="top">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: 0.85,
                                    color: "error.main",
                                  }}
                                >
                                  <Pill size={17} />
                                </Box>
                              </Tooltip>
                            )}

                            {extraServiceIcons.map((icon, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  opacity: 0.7,
                                }}
                              >
                                {icon}
                              </Box>
                            ))}

                            {petBathAppt && (
                              <Tooltip
                                title={`Possui serviço agendado hoje às ${dayjs(petBathAppt.scheduled_at).format("HH:mm")}`}
                                arrow
                                placement="top"
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    color: "primary.main",
                                    opacity: 0.95,
                                  }}
                                >
                                  <ShowerHead size={18} />
                                </Box>
                              </Tooltip>
                            )}

                            {isRecurrentGroup && (
                              <Tooltip title="Estadia Recorrente" arrow placement="top">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: 0.9,
                                    color: "#7c3aed",
                                  }}
                                >
                                  <Repeat size={17} strokeWidth={2.2} />
                                </Box>
                              </Tooltip>
                            )}

                            {isPackageCoveredGroup && (
                              <Tooltip title="Coberto por Pacote" arrow placement="top">
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: 0.85,
                                    color: "success.main",
                                  }}
                                >
                                  <ShoppingBag size={18} />
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CustomCard>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Barra Lateral / Grade de Widgets (Idêntico ao Dashboard.tsx do Banho & Tosa) */}
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
            {/* Coluna A: Calendário e Fila de Ração/Remédios */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 340px", lg: "0 0 340px" },
                width: { xs: "100%", md: "340px" },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Calendário (idêntico ao Dashboard.tsx, com botão Hoje e recolher) */}
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

              {/* Fila de Ração & Remédios */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Bell size={20} />
                    <Typography variant="h6" fontWeight={600}>
                      Ração & Remédios
                    </Typography>
                  </Box>
                  {pendingTasksCount > 0 && (
                    <Chip
                      label={pendingTasksCount}
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 700, minWidth: 28 }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {allDayTasks.length === 0 ? (
                    <CustomCard sx={{ p: 2.5, textAlign: "center" }}>
                      <Typography variant="body2" color="text.disabled">
                        Nenhum horário de ração ou remédio programado
                      </Typography>
                    </CustomCard>
                  ) : (
                    allDayTasks.map(({ task, petName, clientName }) => {
                      const isDueOrLate =
                        isTodaySelected &&
                        !task.is_completed &&
                        task.scheduled_time <= nowTimeStr;

                      return (
                        <CustomCard
                          key={task.id}
                          sx={{
                            p: 1.5,
                            borderLeft: "3px solid",
                            borderColor: task.is_completed
                              ? "success.main"
                              : isDueOrLate
                              ? "error.main"
                              : "warning.main",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {task.scheduled_time} — {petName}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" display="block">
                                Tutor: {clientName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.primary"
                                sx={{
                                  display: "block",
                                  mt: 0.5,
                                  fontWeight: 600,
                                  textDecoration: task.is_completed
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {task.task_type === "feeding" ? "🥣 " : "💊 "}
                                {task.title}
                              </Typography>
                            </Box>

                            <Chip
                              label={task.is_completed ? "Feito ✓" : isDueOrLate ? "Dar agora" : "Marcar"}
                              color={
                                task.is_completed
                                  ? "success"
                                  : isDueOrLate
                                  ? "error"
                                  : "info"
                              }
                              size="small"
                              variant={task.is_completed ? "filled" : "outlined"}
                              onClick={() => handleToggleTask(task)}
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                height: 22,
                                cursor: "pointer",
                              }}
                            />
                          </Box>
                        </CustomCard>
                      );
                    })
                  )}
                </Box>
              </Box>
            </Box>

            {/* Coluna B: Comandas em Aberto */}
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
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Floating Action Button (FAB) idêntico ao Dashboard.tsx */}
      <Fab
        variant="extended"
        color="primary"
        aria-label="Novo Agendamento Creche"
        onClick={() => setModalState({ open: true, mode: "create", stay: null })}
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

      {/* Dialog do Calendário no Mobile (idêntico ao AppointmentsDailyList) */}
      <Dialog
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Selecionar Data
          </Typography>
          <IconButton size="small" onClick={() => setCalendarModalOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          <DashboardCalendar
            value={date}
            onChange={(newDate) => {
              if (newDate) {
                handleDateChange(newDate);
                setCalendarModalOpen(false);
              }
            }}
            onMonthChange={(newMonth) => setCalendarMonth(newMonth.startOf("month"))}
            highlightedDays={highlightedDays}
          />
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES DA CRECHE (Abre ao clicar no card, igual ao Banho & Tosa) */}
      <DaycareDetailsModal
        open={detailsStayId !== null}
        stay={stays.find((s) => s.id === detailsStayId) || null}
        groupStays={
          detailsStayId
            ? (() => {
                const found = stays.find((s) => s.id === detailsStayId);
                if (!found) return [];
                return stays.filter(
                  (s) =>
                    s.client_id === found.client_id &&
                    s.scheduled_start_at === found.scheduled_start_at &&
                    s.scheduled_end_at === found.scheduled_end_at
                );
              })()
            : []
        }
        onClose={() => setDetailsStayId(null)}
        onAction={handleAction}
        onEdit={(stayToEdit) =>
          setModalState({
            open: true,
            mode: "edit",
            stay: stayToEdit,
          })
        }
        onDelete={handleDelete}
        onToggleTask={handleToggleTask}
        onOpenHealth={(pet) => setHealthModalPet(pet)}
        onSendWhatsApp={handleSendWhatsAppReport}
        onScheduleBath={(client, pet, stayDate) => {
          setBathModalState({
            open: true,
            client,
            pet,
            date: stayDate,
          });
        }}
        isLoadingAction={actionLoadingId === detailsStayId}
      />

      {/* MODAL DE AGENDAMENTO / EDIÇÃO DA CRECHE */}
      <DaycareModal
        open={modalState.open}
        mode={modalState.mode}
        stay={modalState.stay}
        initialDate={formattedDate}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onSuccess={refreshData}
      />

      {/* MODAL DE AGENDAMENTO DE BANHO & TOSA (QUANDO CLICADO EM AGENDAR BANHO NA CRECHE) */}
      {bathModalState.open && (
        <AppointmentModal
          open={bathModalState.open}
          mode="create"
          selectedClient={bathModalState.client}
          selectedPet={bathModalState.pet}
          initialDate={bathModalState.date}
          onClose={() => setBathModalState({ open: false })}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["daycare"] });
          }}
        />
      )}

      {/* MODAL DE VACINAS E SAÚDE DO PET */}
      {healthModalPet && (
        <PetHealthModal
          open={!!healthModalPet}
          petId={healthModalPet.id}
          petName={healthModalPet.name}
          onClose={() => setHealthModalPet(null)}
        />
      )}

      {/* MODAL DE RESUMO DE SERVIÇOS E ROTINA (Ao clicar no container de ícones na direita) */}
      {selectedServiceGroup && (
        <DaycareServiceSummaryModal
          open={Boolean(selectedServiceGroup)}
          handleClose={() => setSelectedServiceGroup(null)}
          group={selectedServiceGroup}
          dayAppointments={dayAppointments}
        />
      )}

      {/* MODAL DE OBSERVAÇÕES (Ao clicar no badge Obs ao lado do pet) */}
      {selectedObsGroup && (
        <DaycareObservationModal
          open={Boolean(selectedObsGroup)}
          handleClose={() => setSelectedObsGroup(null)}
          group={selectedObsGroup}
        />
      )}
    </Box>
  );
}
