import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Typography,
  Autocomplete,
  TextField,
  alpha,
  useMediaQuery,
  IconButton,
  Tooltip,
  Checkbox,
} from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getEmployees } from "../../api/services/employees";
import {
  assignAppointmentEmployees,
  listAppointmentsByClient,
  removeUnpaidAppointmentService,
  cancelCompletedAppointment,
  addAppointmentService,
} from "../../api/services/appointments";
import { useServices } from "../../hooks/useServices";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { getServicesForPet } from "../../utils/serviceMatcher";
import { getCommissionRules } from "../../api/services/commissions";
import {
  listClientPackagesByClient,
} from "../../api/services/client_packages";
import { fetchClientById } from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import {
  CalendarCheck,
  Check,
  Dot,
  Info,
  Mars,
  ShoppingBag,
  Pencil,
  Play,
  ShoppingCart,
  Venus,
  X,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Repeat,
  Trash2,
  XCircle,
  Plus,
  CheckCircle2,
  Users,
} from "lucide-react";
import type { Appointment, AppointmentAction } from "./types";
import ClientePersonalInfo from "../clients/ClientePersonalInfo";
import ManageRecurrenceModal from "./ManageRecurrenceModal";
import CustomCard from "../../components/Card/CustomCard";
import theme from "../../theme";
import { Button } from "../../components/Button/Button";
import { AppointmentStatusChip } from "./AppointmentStatusChip";
import { formatAppointmentDate } from "../../utils/formatAppointmentDate";
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import type { CoatType } from "../pets/types";

type Props = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  handleAction: (
    appointment: Appointment,
    action: AppointmentAction,
    cancelAllFuture?: boolean,
  ) => void;
  loadingAction: AppointmentAction | null;
  onEdit: (appointment: Appointment) => void;
};
const AppointmentDetailsModal = ({
  open,
  appointment,
  onClose,
  handleAction,
  loadingAction,
  onEdit,
}: Props) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";
  const queryClient = useQueryClient();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [serviceToRemove, setServiceToRemove] = useState<{
    id: number;
    name: string;
    petId?: number;
  } | null>(null);

  const removeServiceMutation = useMutation({
    mutationFn: async ({
      serviceId,
      petId,
    }: {
      serviceId: number;
      petId?: number;
    }) => {
      if (!appointment) return;
      return await removeUnpaidAppointmentService(
        appointment.id,
        serviceId,
        petId,
      );
    },
    onSuccess: () => {
      toast.success("Serviço removido com sucesso!");
      setServiceToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Erro ao remover serviço.";
      toast.error(msg);
    },
  });

  const [addServicePet, setAddServicePet] = useState<{
    petId: number;
    petName: string;
  } | null>(null);
  const { services: tenantServices = [] } = useServices({
    enabled: Boolean(addServicePet),
  });
  const [selectedNewServiceId, setSelectedNewServiceId] = useState<number | null>(null);
  const [selectedNewEmployeeIds, setSelectedNewEmployeeIds] = useState<number[]>([]);

  const addServiceMutation = useMutation({
    mutationFn: async ({
      petId,
      serviceId,
      employeeId,
      employeeIds,
    }: {
      petId: number;
      serviceId: number;
      employeeId?: number;
      employeeIds?: number[];
    }) => {
      if (!appointment) return;
      return await addAppointmentService(appointment.id, {
        pet_id: petId,
        service_id: serviceId,
        employee_id: employeeId,
        employee_ids: employeeIds,
      });
    },
    onSuccess: () => {
      toast.success("Serviço adicionado com sucesso!");
      setAddServicePet(null);
      setSelectedNewServiceId(null);
      setSelectedNewEmployeeIds([]);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Erro ao adicionar serviço.";
      toast.error(msg);
    },
  });
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: open,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 120,   // 2 horas
  });

  const activeEmployees = employees.filter((e) => e.is_active);

  // Fetch commission rules
  const { data: commissionRules = [] } = useQuery({
    queryKey: ["commissionRules"],
    queryFn: getCommissionRules,
    enabled: open,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15,
  });

  const checkHasCommission = (employeeId: number, serviceId: number) => {
    return commissionRules.some((rule) => {
      if (!rule.is_active) return false;
      if (rule.applies_to === "product") return false;

      // Check validity dates if appointment date is available
      if (appointment?.scheduled_at) {
        const apptDate = appointment.scheduled_at.slice(0, 10);
        if (rule.valid_from && rule.valid_from > apptDate) return false;
        if (rule.valid_until && rule.valid_until < apptDate) return false;
      }

      // Check employee: if no specific employees are defined, applies to all
      const hasSpecificEmployees =
        (rule.employee_ids && rule.employee_ids.length > 0) ||
        (rule.employees && rule.employees.length > 0) ||
        Boolean(rule.employee_id);

      const employeeMatch =
        !hasSpecificEmployees ||
        (rule.employee_ids && rule.employee_ids.some((id) => Number(id) === Number(employeeId))) ||
        (rule.employees && rule.employees.some((e) => Number(e.id) === Number(employeeId))) ||
        Number(rule.employee_id) === Number(employeeId);

      // Check service: if no specific services are defined, applies to all
      const hasSpecificServices =
        (rule.service_ids && rule.service_ids.length > 0) ||
        (rule.services && rule.services.length > 0);

      const serviceMatch =
        !hasSpecificServices ||
        (rule.service_ids && rule.service_ids.some((id) => Number(id) === Number(serviceId))) ||
        (rule.services && rule.services.some((s) => Number(s.id) === Number(serviceId)));

      return employeeMatch && serviceMatch;
    });
  };

  // Fetch Active Packages for Client
  const { data: clientPackages = [] } = useQuery({
    queryKey: ["clientPackages", "client", appointment?.client?.id],
    queryFn: () => listClientPackagesByClient(appointment.client.id),
    enabled: open && !!appointment?.client?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch full client details (to guarantee full details such as address even if loaded from older cache or summary)
  const { data: fullClient } = useQuery({
    queryKey: ["client", appointment?.client?.id],
    queryFn: () => fetchClientById(appointment.client.id),
    enabled: open && !!appointment?.client?.id,
    initialData: appointment?.client as any,
    staleTime: 1000 * 60 * 5,
  });

  const client = fullClient || appointment.client;

  const { data: clientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments", "client", appointment?.client?.id],
    queryFn: () => listAppointmentsByClient(appointment.client.id),
    enabled: open && !!appointment?.client?.id && !!appointment?.recurrence_id,
    staleTime: 1000 * 60 * 5,
  });

  const upcomingRecurringAppt = useMemo(() => {
    const now = new Date();
    const fromList = clientAppointments
      .filter(
        (a) =>
          a.recurrence_id &&
          new Date(a.scheduled_at) >= now &&
          a.status !== "canceled"
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      )[0];

    if (fromList) return fromList;
    if (appointment?.recurrence_id && appointment.status !== "canceled") {
      return appointment;
    }
    return null;
  }, [clientAppointments, appointment]);

  const [manageRecurrenceOpen, setManageRecurrenceOpen] = useState(false);
  const [selectedRecurrenceAppt, setSelectedRecurrenceAppt] = useState<Appointment | null>(null);

  const handleOpenManageRecurrence = (appt: Appointment) => {
    setSelectedRecurrenceAppt(appt);
    setManageRecurrenceOpen(true);
  };

  const handleClientClick = () => {
    if (client?.id) {
      onClose();
      navigate(`/registration/clients/${client.id}`);
    }
  };

  const availablePackages = useMemo(() => {
    return clientPackages
      .filter((pkg) => pkg.is_active)
      .map((pkg) => ({
        ...pkg,
        remaining:
          pkg.credits?.reduce((acc, credit) => acc + credit.remaining_qty, 0) ||
          0,
      }))
      .filter((pkg) => pkg.remaining > 0);
  }, [clientPackages]);

  // Dynamically map which services will be covered by packages
  const coveredServiceKeys = useMemo(() => {
    const coveredIds = new Set<string>();
    if (!appointment?.items) return coveredIds;

    // Track global credit remaining quantities
    const globalCredits = new Map<number, number>(); // credit.id -> remaining_qty
    // Map petId -> Map<serviceId, creditId[]>
    const petServiceToCredits = new Map<number, Map<number, number[]>>();

    appointment.items.forEach((item) => {
      const petId = item.pet?.id;
      if (!petId) return;

      if (!petServiceToCredits.has(petId)) {
        petServiceToCredits.set(petId, new Map());
      }
      const serviceMap = petServiceToCredits.get(petId)!;

      clientPackages.forEach((pkg) => {
        if (!pkg.is_active) return;
        // Verify this package actually applies to this pet
        const isPetInPkg = !pkg.pets || pkg.pets.length === 0 || pkg.pets.some((p) => p.id === petId);
        if (!isPetInPkg) return;

        pkg.credits?.forEach((credit) => {
          if (credit.service_id && credit.remaining_qty > 0) {
            if (!globalCredits.has(credit.id)) {
              globalCredits.set(credit.id, credit.remaining_qty);
            }

            const cList = serviceMap.get(credit.service_id) || [];
            if (!cList.includes(credit.id)) {
              cList.push(credit.id);
              serviceMap.set(credit.service_id, cList);
            }
          }
        });
      });
    });

    appointment.items.forEach((item) => {
      const petId = item.pet?.id;
      const serviceMap = petId ? petServiceToCredits.get(petId) : undefined;

      item.services.forEach((s) => {
        const key = `${item.id}-${s.id}`;
        if (s.is_package_covered) {
          coveredIds.add(key);
        } else if (appointment.status !== "completed" && serviceMap) {
          // Try to find an available credit for this pet and this service
          const cList = serviceMap.get(s.id) || [];
          for (const creditId of cList) {
            const remaining = globalCredits.get(creditId) || 0;
            if (remaining > 0) {
              coveredIds.add(key);
              globalCredits.set(creditId, remaining - 1);
              break;
            }
          }
        }
      });
    });

    return coveredIds;
  }, [appointment, clientPackages]);

  // Compute precise appointment total excluding currently-covered, future-covered or removed
  const totalCents = useMemo(() => {
    return appointment.items.reduce((itemsAcc, item) => {
      const itemTotal = item.services.reduce((servicesAcc, s) => {
        if (s.is_removed) return servicesAcc;
        const key = `${item.id}-${s.id}`;
        return coveredServiceKeys.has(key)
          ? servicesAcc
          : servicesAcc + s.price_cents;
      }, 0);
      return itemsAcc + itemTotal;
    }, 0);
  }, [appointment, coveredServiceKeys]);

  const allServices = appointment.items.flatMap((i) =>
    i.services.map((s) => ({ ...s, petId: i.pet.id, petName: i.pet.name }))
  );
  const coveredServices = allServices.filter((s) => s.is_package_covered && !s.is_removed);
  const billableServices = allServices.filter((s) => !s.is_package_covered && !s.is_removed);
  const removedServices = allServices.filter((s) => s.is_removed);
  const isAllRemoved = allServices.length > 0 && removedServices.length === allServices.length;
  const billableCount = billableServices.length;

  const remainingBalances = useMemo(() => {
    if (appointment.status !== "completed") return [];
    const usedServiceIds = new Set(
      appointment.items
        .flatMap((i) => i.services)
        .filter((s) => s.is_package_covered)
        .map((s) => s.id),
    );
    if (usedServiceIds.size === 0) return [];

    const balances: string[] = [];
    usedServiceIds.forEach((serviceId) => {
      let totalRemaining = 0;
      let serviceName = "";
      const seenCreditIds = new Set<number>();

      clientPackages.forEach((pkg) => {
        if (!pkg.is_active) return;
        pkg.credits?.forEach((c) => {
          if (c.service_id === serviceId) {
            if (!seenCreditIds.has(c.id)) {
              seenCreditIds.add(c.id);
              totalRemaining += c.remaining_qty;
              if (!serviceName) serviceName = c.service_name || "Serviço";
            }
          }
        });
      });
      if (totalRemaining > 0 || seenCreditIds.size > 0) {
        balances.push(`${totalRemaining}x ${serviceName}`);
      }
    });
    return balances;
  }, [appointment, clientPackages]);

  const [localAssignments, setLocalAssignments] = useState<
    Record<string, number[]>
  >({});
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(20);

  // Invalidate cache immediately when appointment completes to refresh remaining balances
  useEffect(() => {
    if (appointment?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
    }
  }, [appointment?.status, queryClient]);

  useEffect(() => {
    if (open && appointment) {
      setShowAllNotes(false);
      const initial: Record<string, number[]> = {};
      appointment.items.forEach((item) => {
        item.services.forEach((svc) => {
          const key = `${item.id}-${svc.id}`;
          if (svc.employee_ids && Array.isArray(svc.employee_ids) && svc.employee_ids.length > 0) {
            initial[key] = svc.employee_ids;
          } else if (svc.employee_id) {
            initial[key] = [svc.employee_id];
          } else {
            initial[key] = [];
          }
        });
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalAssignments(initial);
    }
  }, [open, appointment]);

  const assignMutation = useMutation({
    mutationFn: (
      assignments: {
        appointment_item_id: number;
        service_id: number;
        employee_id: number | null;
        employee_ids: number[];
      }[],
    ) => assignAppointmentEmployees(appointment.id, assignments),
    onSuccess: () => {
      toast.success("Profissional(is) salvo(s) com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: () => {
      toast.error("Erro ao salvar profissional(is)");
    },
  });

  const [cancelCompletedOpen, setCancelCompletedOpen] = useState(false);
  const [cancelCompletedReason, setCancelCompletedReason] = useState("");

  const cancelCompletedMutation = useMutation({
    mutationFn: (reason?: string) =>
      cancelCompletedAppointment(appointment.id, reason),
    onSuccess: () => {
      toast.success("Agendamento finalizado cancelado e estornos realizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["financial-bills"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["comandas"] });
      setCancelCompletedOpen(false);
      setCancelCompletedReason("");
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.detail || "Erro ao cancelar agendamento finalizado."
      );
    },
  });

  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth={false}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: "90%", lg: "1200px" },
            maxWidth: "1250px",
            minWidth: "unset",
            m: { xs: 0, sm: 2 },
            height: { xs: "100dvh", sm: "auto" },
            maxHeight: { xs: "100dvh", sm: "90vh" },
            borderRadius: { xs: 0, sm: 3 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
        backdrop: {
          sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          pt: { xs: "calc(12px + env(safe-area-inset-top, 0px))", sm: 2 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: "1.15rem", sm: "1.4rem" }, fontWeight: 700 }}>
          Detalhes do agendamento
        </Typography>
        <Box
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover", color: "text.primary" },
          }}
          onClick={onClose}
        >
          <X size={22} />
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2.5, md: 3 },
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 2 },
          overflowX: "hidden",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          flex: 1,
        }}
      >
        <Box
          className="coluna-1"
          sx={{
            width: { xs: "100%", md: "48%" },
            minWidth: 0,
            display: "flex",
            gap: 2,
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
              Agendamento
            </Typography>
            <CustomCard sx={{ mt: 1, px: { xs: 1.5, sm: 2 }, py: 1, width: "100%", minWidth: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" fontWeight={500}>
                    {formatAppointmentDate(appointment.scheduled_at)}
                  </Typography>
                  {appointment.recurrence_id && (
                    <Chip
                      icon={<Repeat size={13} />}
                      label={
                        appointment.recurrence_frequency === "weekly"
                          ? "Semanal"
                          : appointment.recurrence_frequency === "biweekly"
                          ? "Quinzenal"
                          : appointment.recurrence_frequency === "monthly"
                          ? "Mensal"
                          : "Recorrente"
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, "& .MuiChip-label": { px: 0.8 }, "& .MuiChip-icon": { ml: 0.5, mr: -0.2 } }}
                    />
                  )}
                </Box>
                <AppointmentStatusChip status={appointment.status} />
              </Box>
              {appointment.notes && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Info size={14} color={theme.palette.error.main} />
                    <Typography variant="body2" color="error.main">
                      Observações do agendamento
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 3,
                      wordBreak: "break-word",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {appointment.notes.length > 180 && !showAllNotes
                      ? `${appointment.notes.slice(0, 180)}...`
                      : appointment.notes}
                  </Typography>
                  {appointment.notes.length > 180 && (
                    <Typography
                      variant="caption"
                      color="primary.main"
                      sx={{
                        ml: 3,
                        cursor: "pointer",
                        display: "inline-block",
                        mt: 0.5,
                        fontWeight: 700,
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => setShowAllNotes(!showAllNotes)}
                    >
                      {showAllNotes ? "Mostrar menos" : "Mostrar mais"}
                    </Typography>
                  )}
                </Box>
              )}
              {appointment.warnings && appointment.warnings.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {appointment.warnings.map((w, i) => (
                    <Alert
                      key={i}
                      severity="warning"
                      icon={<AlertTriangle size={16} />}
                      sx={{ py: 0.25, fontSize: "0.75rem" }}
                    >
                      {w}
                    </Alert>
                  ))}
                </Box>
              )}

              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                {appointment.status === "pending" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: 1.25,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<X size={15} />}
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                        sx={{
                          fontSize: "0.78rem",
                          borderColor: "error.light",
                          opacity: 0.85,
                          "&:hover": { opacity: 1, borderColor: "error.main" },
                        }}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            onClose();
                            onEdit(appointment);
                          }}
                          startIcon={<Pencil size={15} />}
                          disabled={!!loadingAction}
                          size="small"
                          sx={{ flex: { xs: 1, sm: "initial" } }}
                        >
                          Alterar
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAction(appointment, "confirm")}
                          startIcon={<CalendarCheck size={16} />}
                          loading={loadingAction === "confirm"}
                          disabled={!!loadingAction}
                          size="small"
                          sx={{ flex: { xs: 1.5, sm: "initial" }, fontWeight: 700 }}
                        >
                          Confirmar
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}

                {appointment.status === "confirmed" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: 1.25,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<X size={15} />}
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                        sx={{
                          fontSize: "0.78rem",
                          borderColor: "error.light",
                          opacity: 0.85,
                          "&:hover": { opacity: 1, borderColor: "error.main" },
                        }}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            onClose();
                            onEdit(appointment);
                          }}
                          startIcon={<Pencil size={15} />}
                          disabled={!!loadingAction}
                          size="small"
                          sx={{ flex: { xs: 1, sm: "initial" } }}
                        >
                          Alterar
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Play size={16} />}
                          loading={loadingAction === "start"}
                          disabled={!!loadingAction}
                          onClick={() => handleAction(appointment, "start")}
                          sx={{ flex: { xs: 1.5, sm: "initial" }, fontWeight: 700 }}
                        >
                          Iniciar Serviços
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
                {appointment.status === "in_progress" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column-reverse", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: 1.25,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<X size={15} />}
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                        sx={{
                          fontSize: "0.78rem",
                          borderColor: "error.light",
                          opacity: 0.85,
                          "&:hover": { opacity: 1, borderColor: "error.main" },
                        }}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            onClose();
                            onEdit(appointment);
                          }}
                          startIcon={<Pencil size={15} />}
                          disabled={!!loadingAction}
                          size="small"
                          sx={{ flex: { xs: 1, sm: "initial" } }}
                        >
                          Alterar
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Check size={16} />}
                          loading={loadingAction === "complete"}
                          disabled={!!loadingAction}
                          onClick={() => handleAction(appointment, "complete")}
                          sx={{ flex: { xs: 1.5, sm: "initial" }, fontWeight: 700 }}
                        >
                          Finalizar
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
                {appointment.status === "completed" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 700 }}
                      >
                        Resumo da Finalização
                      </Typography>

                      {isAllRemoved ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                            <CheckCircle2 size={18} color={theme.palette.text.secondary} />
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                              Atendimento concluído sem cobrança pendente.
                            </Typography>
                          </Box>
                          <Box sx={{ pl: 3.2, display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Todos os serviços foram dispensados da cobrança:
                            </Typography>
                            {removedServices.map((s, idx) => (
                              <Typography key={`rem-all-${idx}`} variant="caption" color="text.secondary">
                                • <strong>{s.name}</strong> {s.removal_reason ? `(${s.removal_reason})` : "dispensado no caixa"}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <>
                          {coveredServices.map((s, idx) => (
                            <Box
                              key={`cov-${idx}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                                color: "success.main",
                              }}
                            >
                              <Check size={18} strokeWidth={3} />
                              <Typography variant="body2">
                                <strong>{s.name}</strong> debitado do pacote.
                              </Typography>
                            </Box>
                          ))}

                          {remainingBalances.length > 0 && (
                            <Box sx={{ mb: billableCount > 0 ? 1.5 : 0, pl: 3.5 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                <ShoppingBag
                                  size={14}
                                  color={theme.palette.text.secondary}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.primary"
                                  fontWeight={600}
                                >
                                  Saldo de pacotes atualizado:
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  pl: 3,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.5,
                                }}
                              >
                                {remainingBalances.map((balance, idx) => (
                                  <Typography
                                    key={`bal-${idx}`}
                                    variant="caption"
                                    color="text.primary"
                                  >
                                    • {balance}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {billableServices.map((s, idx) => (
                            <Box
                              key={`bil-${idx}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                mb: 0.5,
                                p: 0.5,
                                borderRadius: 1,
                                bgcolor: appointment.is_paid
                                  ? "transparent"
                                  : "action.hover",
                                color: appointment.is_paid
                                  ? "success.main"
                                  : "warning.main",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {appointment.is_paid ? (
                                  <Check size={18} strokeWidth={3} />
                                ) : (
                                  <AlertCircle size={18} />
                                )}
                                <Typography variant="body2">
                                  <strong>{s.name}</strong>{" "}
                                  {appointment.is_paid
                                    ? "pago no caixa."
                                    : "pendente de pagamento no caixa."}
                                </Typography>
                              </Box>

                              {!appointment.is_paid &&
                                appointment.status === "completed" && (
                                  <Tooltip title="Remover serviço lançado por engano">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        setServiceToRemove({
                                          id: s.id,
                                          name: s.name,
                                          petId: s.petId,
                                        })
                                      }
                                      sx={{ p: 0.5 }}
                                    >
                                      <Trash2 size={16} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                            </Box>
                          ))}

                          {removedServices.map((s, idx) => (
                            <Box
                              key={`rem-partial-${idx}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                                color: "text.disabled",
                              }}
                            >
                              <Dot color={theme.palette.text.disabled} size={16} />
                              <Typography variant="body2" sx={{ color: "text.disabled", textDecoration: "line-through" }}>
                                {s.name}
                              </Typography>
                              <Chip
                                label="Não Cobrado"
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 18,
                                  fontSize: 10,
                                  px: 0.5,
                                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                                  borderColor: "warning.light",
                                  color: "warning.dark",
                                  fontWeight: 700,
                                }}
                              />
                            </Box>
                          ))}
                        </>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: isOwnerOrAdmin ? "space-between" : "flex-end",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {isOwnerOrAdmin && (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          {appointment.status !== "completed" && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Pencil size={14} />}
                              onClick={() => onEdit(appointment)}
                              sx={{
                                color: "#4B5563",
                                borderColor: "#D1D5DB",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                whiteSpace: "nowrap",
                                "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F3F4F6" },
                              }}
                            >
                              Editar
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<XCircle size={14} />}
                            onClick={() => setCancelCompletedOpen(true)}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Cancelar
                          </Button>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {appointment.is_paid ? (
                          <Chip
                            label="PAGO"
                            color="success"
                            size="small"
                            variant="filled"
                            sx={{ fontWeight: 900, px: 1 }}
                          />
                        ) : isAllRemoved ? (
                          <Chip
                            label="NÃO COBRADO"
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 800,
                              px: 1,
                              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                              borderColor: "warning.light",
                              color: "warning.dark",
                            }}
                          />
                        ) : appointment.is_fully_package_covered ? (
                          <Chip
                            label="PAGO"
                            color="success"
                            size="small"
                            variant="filled"
                            icon={<ShoppingBag size={13} />}
                            sx={{ fontWeight: 900, px: 1 }}
                          />
                        ) : (
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            startIcon={<ShoppingCart size={16} />}
                            onClick={() => {
                              navigate("/pos", {
                                state: { pullAppointment: appointment },
                              });
                            }}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            Cobrar no Caixa
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </CustomCard>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}
              >
                Tutor
              </Typography>
              <Button
                variant="text"
                size="small"
                endIcon={<ExternalLink size={14} />}
                onClick={handleClientClick}
                sx={{
                  textTransform: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "primary.main",
                  p: 0.5,
                  minWidth: "auto",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                Ver perfil completo
              </Button>
            </Box>
            <Box sx={{ width: "100%", minWidth: 0 }}>
              <ClientePersonalInfo
                client={client}
                variant="appointment"
                onClientClick={handleClientClick}
                upcomingRecurringAppt={upcomingRecurringAppt}
                onManageRecurrence={handleOpenManageRecurrence}
              />
            </Box>
          </Box>

          {/* PACOTES DISPONÍVEIS */}
          {availablePackages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
                  Pacotes Disponíveis
                </Typography>
                <Chip
                  label={availablePackages.length}
                  size="small"
                  sx={{
                    height: 22,
                    minWidth: 22,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  }}
                />
              </Box>

              <Box sx={{ mt: 1, width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {availablePackages.map((pkg) => (
                  <CustomCard
                    key={pkg.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      px: { xs: 1.5, sm: 2 },
                      py: 1.5,
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="primary.main"
                      >
                        {pkg.package_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={theme.palette.text.disabled}
                        fontWeight={500}
                      >
                        Vence:{" "}
                        {pkg.expires_at
                          ? dayjs(pkg.expires_at).format("DD/MM/YYYY")
                          : "Sem validade"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      {pkg.credits?.map((credit) => (
                        <Box
                          key={credit.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              fontWeight: 500,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                bgcolor:
                                  credit.remaining_qty > 0
                                    ? "primary.main"
                                    : theme.palette.text.disabled,
                                flexShrink: 0,
                              }}
                            />
                            {credit.service_name}
                          </Typography>

                          <Typography variant="body2">
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 700,
                                color:
                                  credit.remaining_qty > 0
                                    ? "text.primary"
                                    : theme.palette.text.disabled,
                              }}
                            >
                              restam {credit.remaining_qty}
                            </Box>{" "}
                            <Box
                              component="span"
                              sx={{ color: theme.palette.text.disabled }}
                            >
                              (usou {credit.used_qty} de {credit.total_qty})
                            </Box>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CustomCard>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Box className="coluna-2" sx={{ width: { xs: "100%", md: "50%" }, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
              Pets & Serviços
            </Typography>
            <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}>
              {formattedTotal}
            </Typography>
          </Box>
          <Box sx={{ mt: 1, display: "flex", gap: 2, flexDirection: "column" }}>
            {appointment.items.map((item) => (
              <CustomCard key={item.id} sx={{ px: { xs: 1.5, sm: 2 }, py: 1, width: "100%", minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="h6"
                      fontWeight={500}
                      noWrap
                      sx={{ maxWidth: "250px" }}
                    >
                      {item.pet.name}
                    </Typography>

                    {item.pet.breed && (
                      <>
                        ,
                        <Typography
                          variant="body2"
                          color={theme.palette.text.disabled}
                          sx={{ mt: 1, ml: 0.5 }}
                        >
                          {item.pet.breed}
                        </Typography>
                      </>
                    )}
                  </Box>
                  {item.pet.gender &&
                    (item.pet.gender.includes("male") ||
                      item.pet.gender.includes("female")) && (
                      <Chip
                        label={item.pet.gender === "male" ? "Macho" : "Femea"}
                        icon={
                          item.pet.gender === "male" ? (
                            <Mars
                              color={theme.palette.text.primary}
                              size={16}
                            />
                          ) : (
                            <Venus
                              color={theme.palette.text.primary}
                              size={16}
                            />
                          )
                        }
                        sx={{
                          bgcolor:
                            item.pet.gender === "male"
                              ? "rgba(33, 150, 243, 0.3)"
                              : "rgba(233, 30, 99, 0.3)",
                          color: "text.primary",
                          px: 1,
                          height: "25px",
                          borderRadius: 2,
                        }}
                      />
                    )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2">{item.pet.species}</Typography>
                  {item.pet.size && (
                    <>
                      <Dot color={theme.palette.text.disabled} size={16} />
                      <Typography variant="body2">
                        Porte {item.pet.size}
                      </Typography>
                    </>
                  )}
                  {item.pet.coat_type && (
                    <>
                      <Dot color={theme.palette.text.disabled} size={16} />
                      <Typography variant="body2">
                        Pelagem{" "}
                        {getCoatTypeLabel(item.pet.coat_type as CoatType)}
                      </Typography>
                    </>
                  )}
                  {item.pet.coat_color && (
                    <>
                      <Dot size={16} />
                      <Typography variant="body2">
                        Cor {item.pet.coat_color}
                      </Typography>
                    </>
                  )}
                </Box>
                {item.pet.notes && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Info size={14} color={theme.palette.error.main} />
                      <Typography variant="body2" color="error.main">
                        Observações do pet
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 3 }}>
                      {item.pet.notes}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={500}>
                    Serviços do pet
                  </Typography>
                  {!appointment.is_paid && appointment.status !== "canceled" && appointment.status !== "no_show" && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={14} />}
                      onClick={() => {
                        setSelectedNewServiceId(null);
                        setSelectedNewEmployeeIds([]);
                        setAddServicePet({ petId: item.pet.id, petName: item.pet.name });
                      }}
                      sx={{ fontSize: "0.75rem", py: 0.25, px: 1, height: 26, borderRadius: 1.5, fontWeight: 600 }}
                    >
                      Adicionar serviço
                    </Button>
                  )}
                </Box>
                <Box>
                  {item.services.map((s) => {
                    const key = `${item.id}-${s.id}`;
                    const currentEmpIds = localAssignments[key] || [];
                    const selectedEmployees = activeEmployees.filter((e) =>
                      currentEmpIds.map(Number).includes(Number(e.id)),
                    );
                    const uncommissionedEmps = selectedEmployees.filter(
                      (e) => !checkHasCommission(Number(e.id), s.id),
                    );

                    return (
                      <Box
                        key={s.id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          py: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Dot
                              color={theme.palette.text.disabled}
                              size={16}
                            />
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ maxWidth: "250px" }}
                            >
                              {s.name}
                            </Typography>
                            {coveredServiceKeys.has(key) && (
                              <Chip
                                label="pacote"
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<ShoppingBag size={10} />}
                                sx={{ height: 18, fontSize: 10, px: 0.5 }}
                              />
                            )}
                            {s.is_removed && (
                              <Tooltip title={s.removal_reason ? `${s.removal_reason}${s.removed_at ? ` em ${dayjs(s.removed_at).format("DD/MM/YYYY HH:mm")}` : ""}` : "Dispensado da cobrança no caixa"}>
                                <Chip
                                  label={s.billing_status === "canceled" ? "Cancelado" : "Não Cobrado"}
                                  size="small"
                                  color="default"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    px: 0.5,
                                    bgcolor: (theme) => alpha(s.billing_status === "canceled" ? theme.palette.error.main : theme.palette.warning.main, 0.08),
                                    borderColor: s.billing_status === "canceled" ? "error.light" : "warning.light",
                                    color: s.billing_status === "canceled" ? "error.dark" : "warning.dark",
                                    fontWeight: 700,
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: (coveredServiceKeys.has(key) || s.is_removed)
                                  ? "line-through"
                                  : "none",
                                color: (coveredServiceKeys.has(key) || s.is_removed)
                                  ? "text.disabled"
                                  : "text.primary",
                              }}
                            >
                              {coveredServiceKeys.has(key) &&
                              !s.is_package_covered ? (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    marginRight: 8,
                                    fontStyle: "italic",
                                    textDecoration: "none",
                                  }}
                                >
                                  disponível
                                </span>
                              ) : null}
                              {(s.price_cents / 100).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </Typography>
                            {!s.is_removed &&
                              !appointment.is_paid &&
                              appointment.status !== "canceled" &&
                              appointment.status !== "no_show" &&
                              !s.is_package_covered &&
                              (item.services.length > 1 || appointment.items.length > 1) && (
                                <Tooltip title="Remover este serviço">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      setServiceToRemove({
                                        id: s.id,
                                        name: s.name,
                                        petId: item.pet.id,
                                      })
                                    }
                                    sx={{ p: 0.25 }}
                                  >
                                    <Trash2 size={15} />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </Box>
                        </Box>

                        {/* Employee Select */}
                        {appointment.status !== "canceled" &&
                          appointment.status !== "no_show" && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                alignItems: { xs: "flex-start", sm: "center" },
                                gap: { xs: 0.5, sm: 1 },
                                flex: 1,
                                ml: { xs: 0, sm: 1 },
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ minWidth: { xs: "unset", sm: "80px" }, mt: { xs: 0, sm: 0.5 } }}
                              >
                                Profissional{selectedEmployees.length > 1 ? "s" : ""}:
                              </Typography>
                              <Box
                                sx={{
                                  flex: 1,
                                  width: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Autocomplete
                                  multiple
                                  size="small"
                                  sx={{ width: "100%" }}
                                  options={activeEmployees}
                                  filterOptions={(options, state) => {
                                    const input = state.inputValue.toLowerCase();
                                    return options.filter((option) =>
                                      option.name.toLowerCase().includes(input)
                                    ).slice(0, employeeLimit);
                                  }}
                                  onInputChange={(_, __, reason) => {
                                    if (reason === "input") setEmployeeLimit(20);
                                  }}
                                  ListboxProps={{
                                    onScroll: (event: React.SyntheticEvent) => {
                                      const listboxNode = event.currentTarget;
                                      if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
                                        setEmployeeLimit((prev) => prev + 20);
                                      }
                                    }
                                  }}
                                  getOptionLabel={(option) => option.name}
                                  isOptionEqualToValue={(option, value) =>
                                    String(option.id) === String(value.id)
                                  }
                                  value={selectedEmployees}
                                  onChange={(_: any, val: any) => {
                                    const newEmpIds: number[] = (val || []).map((e: any) => Number(e.id));
                                    const newAssignments = {
                                      ...localAssignments,
                                      [key]: newEmpIds,
                                    };
                                    setLocalAssignments(newAssignments);

                                    const payload = Object.entries(
                                      newAssignments,
                                    ).map(([k, empIds]) => {
                                      const [itemId, svcId] = k
                                        .split("-")
                                        .map(Number);
                                      return {
                                        appointment_item_id: itemId,
                                        service_id: svcId,
                                        employee_id: empIds.length > 0 ? empIds[0] : null,
                                        employee_ids: empIds,
                                      };
                                    });

                                    assignMutation.mutate(payload);
                                  }}
                                  renderTags={(tagValue, getTagProps) => {
                                    const maxVisible = 2;
                                    const visibleTags = tagValue.slice(0, maxVisible);
                                    const hiddenCount = tagValue.length - maxVisible;
                                    return (
                                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {visibleTags.map((option, index) => {
                                          const hasComm = checkHasCommission(option.id, s.id);
                                          return (
                                            <Chip
                                              {...getTagProps({ index })}
                                              key={option.id}
                                              label={option.name}
                                              size="small"
                                              color={!hasComm ? "warning" : "default"}
                                              sx={{
                                                maxWidth: 160,
                                                height: 24,
                                                fontSize: "0.75rem",
                                                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" }
                                              }}
                                            />
                                          );
                                        })}
                                        {hiddenCount > 0 && (
                                          <Tooltip title={tagValue.slice(maxVisible).map((o) => o.name).join(", ")}>
                                            <Chip
                                              label={`+${hiddenCount}`}
                                              size="small"
                                              sx={{ height: 24, fontSize: "0.75rem", bgcolor: "grey.200", fontWeight: 600 }}
                                            />
                                          </Tooltip>
                                        )}
                                      </Box>
                                    );
                                  }}
                                  renderOption={(props: any, option: any, { selected }: any) => {
                                    const hasComm = checkHasCommission(
                                      option.id,
                                      s.id,
                                    );
                                    const { key: optKey, ...otherProps } = props;
                                    return (
                                      <li key={option.id} {...otherProps}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            width: "100%",
                                            gap: 1,
                                          }}
                                        >
                                          <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexDirection: "column",
                                              flex: 1,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight={500}
                                            >
                                              {option.name}
                                            </Typography>
                                            {!hasComm && (
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 0.5,
                                                  mt: -0.25,
                                                }}
                                              >
                                                <AlertTriangle
                                                  size={12}
                                                  color={
                                                    theme.palette.warning.main
                                                  }
                                                />
                                                <Typography
                                                  variant="caption"
                                                  color="warning.main"
                                                  sx={{
                                                    fontSize: "10px",
                                                    fontStyle: "italic",
                                                  }}
                                                >
                                                  Sem regra de comissão compatível
                                                  cadastrada.
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>
                                      </li>
                                    );
                                  }}
                                  renderInput={(params: any) => (
                                    <TextField
                                      {...params}
                                      placeholder={selectedEmployees.length === 0 ? "Selecionar profissional(is)..." : ""}
                                      error={uncommissionedEmps.length > 0}
                                      sx={{
                                        "& .MuiInputBase-root": {
                                          flexWrap: "wrap",
                                          gap: 0.5,
                                          p: "4px 8px !important",
                                          minHeight: 40,
                                        },
                                      }}
                                    />
                                  )}
                                />
                                {uncommissionedEmps.length > 0 && (
                                  <Box
                                    sx={{
                                      mt: 0.5,
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 0.5,
                                    }}
                                  >
                                    <AlertTriangle
                                      size={12}
                                      color={theme.palette.warning.main}
                                      style={{ marginTop: "2px", flexShrink: 0 }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="warning.main"
                                      fontWeight={600}
                                      sx={{ lineHeight: 1.2 }}
                                    >
                                      Aviso: {uncommissionedEmps.map((e) => e.name).join(", ")} não possui regra de comissão cadastrada para este serviço.
                                    </Typography>
                                  </Box>
                                )}
                                {selectedEmployees.length > 1 && (
                                  <Box
                                    sx={{
                                      mt: 0.5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Users
                                      size={12}
                                      color={theme.palette.info.main}
                                      style={{ flexShrink: 0 }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="info.main"
                                      fontWeight={600}
                                      sx={{ lineHeight: 1.2 }}
                                    >
                                      {selectedEmployees.length} profissionais vinculados: a comissão deste serviço será dividida igualmente ({(100 / selectedEmployees.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% para cada).
                                    </Typography>
                                  </Box>
                                )}
                                {selectedEmployees.length === 0 &&
                                  coveredServiceKeys.has(key) && (
                                    <Box
                                      sx={{
                                        mt: 0.5,
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 0.5,
                                      }}
                                    >
                                      <AlertTriangle
                                        size={12}
                                        color={theme.palette.warning.main}
                                        style={{ marginTop: "2px", flexShrink: 0 }}
                                      />
                                      <Typography
                                        variant="caption"
                                        color="warning.main"
                                        fontWeight={600}
                                        sx={{ lineHeight: 1.2 }}
                                      >
                                        Serviço coberto por pacote sem
                                        funcionário vinculado. Comissão não será
                                        gerada.
                                      </Typography>
                                    </Box>
                                  )}
                              </Box>
                            </Box>
                          )}
                      </Box>
                    );
                  })}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 600,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.services
                        .reduce((acc, s) => {
                          const key = `${item.id}-${s.id}`;
                          return (coveredServiceKeys.has(key) || s.is_removed)
                            ? acc
                            : acc + s.price_cents / 100;
                        }, 0)
                        .toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                    </Typography>
                  </Box>
                </Box>
              </CustomCard>
            ))}
          </Box>
        </Box>
      </DialogContent>

      {isMobile && (
        <Box
          sx={{
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 10,
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ minHeight: 44, borderRadius: 2, fontWeight: 600 }}
          >
            Fechar
          </Button>
        </Box>
      )}

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
      >
        <DialogTitle>Cancelar Agendamento</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode
            ser desfeita.
          </Typography>
          {appointment?.recurrence_id && (
            <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
              Este agendamento faz parte de uma recorrência. Você pode cancelar
              apenas este ou todos os futuros.
            </Alert>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: appointment?.recurrence_id ? "column" : "row",
            alignItems: "stretch",
            p: 2,
            gap: 1,
          }}
        >
          {!appointment?.recurrence_id ? (
            <>
              <Button
                variant="text"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={!!loadingAction}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  handleAction(appointment, "cancel");
                  setCancelConfirmOpen(false);
                }}
                loading={loadingAction === "cancel"}
                disabled={!!loadingAction}
              >
                Sim, cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  handleAction(appointment, "cancel", false);
                  setCancelConfirmOpen(false);
                }}
                loading={loadingAction === "cancel"}
                disabled={!!loadingAction}
              >
                Cancelar apenas este
              </Button>

              <Button
                variant="outlined"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={!!loadingAction}
              >
                Voltar
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  handleAction(appointment, "cancel", true);
                  setCancelConfirmOpen(false);
                }}
                loading={loadingAction === "cancel"}
                disabled={!!loadingAction}
              >
                Cancelar este e TODOS os futuros
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {addServicePet && (
        <Dialog
          open={Boolean(addServicePet)}
          onClose={() => !addServiceMutation.isPending && setAddServicePet(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            Adicionar Serviço para {addServicePet.petName}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Selecione o Serviço *
              </Typography>
              <Autocomplete
                size="small"
                options={(() => {
                  const petObj = appointment.items.find((it) => it.pet.id === addServicePet.petId)?.pet;
                  const active = tenantServices.filter((s) => s.is_active);
                  return petObj ? getServicesForPet(active, petObj as any) : active;
                })()}
                getOptionLabel={(option) => formatServiceLabel(option)}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                onChange={(_, val) => setSelectedNewServiceId(val?.id || null)}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Pesquisar serviço..." autoFocus />
                )}
                renderOption={(props, option) => {
                  const { ...rest } = props;
                  const hasCredit = clientPackages.some(
                    (pkg) =>
                      pkg.is_active &&
                      (!pkg.pets || pkg.pets.length === 0 || pkg.pets.some((p) => p.id === addServicePet.petId)) &&
                      pkg.credits?.some((c) => c.service_id === option.id && c.remaining_qty > 0)
                  );
                  return (
                    <li {...rest} key={option.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {formatServiceLabel(option)}
                        </Typography>
                        {hasCredit && (
                          <Chip
                            label="pacote"
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<ShoppingBag size={10} />}
                            sx={{ height: 18, fontSize: 10, px: 0.5 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {(option.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </Typography>
                    </li>
                  );
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Profissional(is) (opcional)
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={activeEmployees}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                value={activeEmployees.filter((e) => selectedNewEmployeeIds.includes(e.id))}
                onChange={(_, val) => setSelectedNewEmployeeIds((val || []).map((e: any) => e.id))}
                renderTags={(tagValue, getTagProps) => {
                  const maxVisible = 2;
                  const visibleTags = tagValue.slice(0, maxVisible);
                  const hiddenCount = tagValue.length - maxVisible;
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {visibleTags.map((option, index) => {
                        const hasComm = selectedNewServiceId
                          ? checkHasCommission(option.id, selectedNewServiceId)
                          : true;
                        return (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            label={option.name}
                            size="small"
                            color={!hasComm ? "warning" : "default"}
                            sx={{ maxWidth: 140, height: 22, fontSize: "0.75rem" }}
                          />
                        );
                      })}
                      {hiddenCount > 0 && (
                        <Tooltip title={tagValue.slice(maxVisible).map((o) => o.name).join(", ")}>
                          <Chip
                            label={`+${hiddenCount}`}
                            size="small"
                            sx={{ height: 22, fontSize: "0.75rem", bgcolor: "grey.200", fontWeight: 600 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  );
                }}
                renderOption={(props: any, option: any, { selected }: any) => {
                  const hasComm = selectedNewServiceId
                    ? checkHasCommission(option.id, selectedNewServiceId)
                    : true;
                  const { key, ...otherProps } = props;
                  return (
                    <li key={option.id} {...otherProps}>
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                        <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {option.name}
                          </Typography>
                          {selectedNewServiceId && !hasComm && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: -0.25 }}>
                              <AlertTriangle size={12} color={theme.palette.warning.main} />
                              <Typography
                                variant="caption"
                                color="warning.main"
                                sx={{ fontSize: "10px", fontStyle: "italic" }}
                              >
                                Sem regra de comissão compatível cadastrada.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={selectedNewEmployeeIds.length === 0 ? "Selecione o(s) profissional(is)..." : ""}
                    sx={{
                      "& .MuiInputBase-root": {
                        flexWrap: "wrap",
                        gap: 0.5,
                        p: "4px 8px !important",
                        minHeight: 40,
                      },
                    }}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setAddServicePet(null)}
              disabled={addServiceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedNewServiceId || addServiceMutation.isPending}
              loading={addServiceMutation.isPending}
              onClick={() => {
                if (selectedNewServiceId) {
                  addServiceMutation.mutate({
                    petId: addServicePet.petId,
                    serviceId: selectedNewServiceId,
                    employeeId: selectedNewEmployeeIds.length > 0 ? selectedNewEmployeeIds[0] : undefined,
                    employeeIds: selectedNewEmployeeIds,
                  });
                }
              }}
              sx={{ fontWeight: 700 }}
            >
              Adicionar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {serviceToRemove && (
        <Dialog
          open={Boolean(serviceToRemove)}
          onClose={() =>
            !removeServiceMutation.isPending && setServiceToRemove(null)
          }
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Remover Serviço do Agendamento?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Tem certeza de que deseja remover{" "}
              <strong>{serviceToRemove.name}</strong> deste agendamento
              {appointment.status === "completed" ? " e da comanda em aberto no caixa" : ""}?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setServiceToRemove(null)}
              disabled={removeServiceMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() =>
                removeServiceMutation.mutate({
                  serviceId: serviceToRemove.id,
                  petId: serviceToRemove.petId,
                })
              }
              loading={removeServiceMutation.isPending}
              disabled={removeServiceMutation.isPending}
            >
              Remover Serviço
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {cancelCompletedOpen && (
        <Dialog
          open={cancelCompletedOpen}
          onClose={() => !cancelCompletedMutation.isPending && setCancelCompletedOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
            <AlertTriangle size={22} color="#DC2626" />
            Cancelar Agendamento Finalizado?
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Atenção:</strong> Este agendamento já foi finalizado
              {appointment.is_paid ? " e pago no caixa" : ""}. Ao cancelar:
              <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: "0.82rem" }}>
                {appointment.is_paid && (
                  <li>A venda no caixa será cancelada e o valor estornado (para dinheiro, saída no caixa).</li>
                )}
                <li>Créditos de pacotes utilizados serão devolvidos ao cliente.</li>
                <li>Comissões dos profissionais serão canceladas para não poluir relatórios e o DRE.</li>
                <li>O agendamento passará para o status <strong>Cancelado</strong>.</li>
              </ul>
            </Alert>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Motivo do cancelamento (opcional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Ex: Cliente desistiu após o serviço, cobrança incorreta estornada..."
                value={cancelCompletedReason}
                onChange={(e) => setCancelCompletedReason(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setCancelCompletedOpen(false)}
              disabled={cancelCompletedMutation.isPending}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              color="error"
              loading={cancelCompletedMutation.isPending}
              disabled={cancelCompletedMutation.isPending}
              onClick={() => cancelCompletedMutation.mutate(cancelCompletedReason.trim() || undefined)}
              sx={{ fontWeight: 700 }}
            >
              Sim, Cancelar e Estornar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {manageRecurrenceOpen && selectedRecurrenceAppt && (
        <ManageRecurrenceModal
          open={manageRecurrenceOpen}
          appointment={selectedRecurrenceAppt}
          onClose={() => {
            setManageRecurrenceOpen(false);
            setSelectedRecurrenceAppt(null);
          }}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ["appointments"] });
            await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
          }}
        />
      )}
    </Dialog>
  );
};

export default AppointmentDetailsModal;
