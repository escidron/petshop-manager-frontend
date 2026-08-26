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
} from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { getEmployees } from "../../api/services/employees";
import { assignAppointmentEmployees } from "../../api/services/appointments";
import { getCommissionRules } from "../../api/services/commissions";
import {
  listClientPackagesByPet,
  listClientPackagesByClient,
} from "../../api/services/client_packages";
import { useToast } from "../../hooks/useToast";
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
} from "lucide-react";
import type { Appointment, AppointmentAction } from "./types";
import ClientePersonalInfo from "../clients/ClientePersonalInfo";
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
  const queryClient = useQueryClient();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: open,
  });

  const activeEmployees = employees.filter((e) => e.is_active);

  // Fetch commission rules
  const { data: commissionRules = [] } = useQuery({
    queryKey: ["commissionRules"],
    queryFn: getCommissionRules,
    enabled: open,
  });

  const checkHasCommission = (employeeId: number, serviceId: number) => {
    return commissionRules.some((rule) => {
      if (!rule.is_active) return false;
      if (rule.applies_to === "product") return false;

      // Check employee
      const employeeMatch =
        !rule.employee_id || rule.employee_id === employeeId;
      // Check service
      const serviceMatch =
        rule.service_ids.length === 0 || rule.service_ids.includes(serviceId);

      return employeeMatch && serviceMatch;
    });
  };

  // Fetch Active Packages for Client
  const { data: clientPackages = [] } = useQuery({
    queryKey: ["clientPackages", "client", appointment?.client?.id],
    queryFn: () => listClientPackagesByClient(appointment.client.id),
    enabled: open && !!appointment?.client?.id,
  });

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

  // Fetch Active Packages for all Pets in Appointment
  const packageQueries = useQueries({
    queries: (appointment?.items || []).map((item) => ({
      queryKey: ["clientPackages", "pet", item.pet.id],
      queryFn: () => listClientPackagesByPet(item.pet.id),
      enabled: open,
    })),
  });

  // Dynamically map which services will be covered by packages
  const coveredServiceKeys = useMemo(() => {
    const coveredIds = new Set<string>();

    // Build a global map of available credits to avoid double-counting shared packages
    const globalCredits = new Map<number, number>(); // credit.id -> remaining_qty
    const serviceToCredits = new Map<number, number[]>(); // service.id -> array of credit.ids

    packageQueries.forEach((q) => {
      const pkgs = q.data || [];
      pkgs.forEach((pkg) => {
        if (!pkg.is_active) return;
        pkg.credits.forEach((credit) => {
          if (credit.service_id && credit.remaining_qty > 0) {
            if (!globalCredits.has(credit.id)) {
              globalCredits.set(credit.id, credit.remaining_qty);

              const cList = serviceToCredits.get(credit.service_id) || [];
              cList.push(credit.id);
              serviceToCredits.set(credit.service_id, cList);
            }
          }
        });
      });
    });

    appointment.items.forEach((item) => {
      item.services.forEach((s) => {
        const key = `${item.id}-${s.id}`;
        if (s.is_package_covered) {
          coveredIds.add(key);
        } else if (appointment.status !== "completed") {
          // Try to find an available credit for this service
          const cList = serviceToCredits.get(s.id) || [];
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
  }, [appointment, packageQueries]);

  // Compute precise appointment total excluding currently-covered or future-covered
  const totalCents = useMemo(() => {
    return appointment.items.reduce((itemsAcc, item) => {
      const itemTotal = item.services.reduce((servicesAcc, s) => {
        const key = `${item.id}-${s.id}`;
        return coveredServiceKeys.has(key)
          ? servicesAcc
          : servicesAcc + s.price_cents;
      }, 0);
      return itemsAcc + itemTotal;
    }, 0);
  }, [appointment, coveredServiceKeys]);

  const allServices = appointment.items.flatMap((i) => i.services);
  const coveredServices = allServices.filter((s) => s.is_package_covered);
  const billableServices = allServices.filter((s) => !s.is_package_covered);
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

      packageQueries.forEach((q) => {
        const pkgs = q.data || [];
        pkgs.forEach((pkg) => {
          if (!pkg.is_active) return;
          pkg.credits.forEach((c) => {
            if (c.service_id === serviceId) {
              if (!seenCreditIds.has(c.id)) {
                seenCreditIds.add(c.id);
                totalRemaining += c.remaining_qty;
                if (!serviceName) serviceName = c.service_name || "Serviço";
              }
            }
          });
        });
      });
      if (totalRemaining > 0 || seenCreditIds.size > 0) {
        balances.push(`${totalRemaining}x ${serviceName}`);
      }
    });
    return balances;
  }, [appointment, packageQueries]);

  const [localAssignments, setLocalAssignments] = useState<
    Record<string, number | null>
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
      const initial: Record<string, number | null> = {};
      appointment.items.forEach((item) => {
        item.services.forEach((svc) => {
          const key = `${item.id}-${svc.id}`;
          initial[key] = svc.employee_id || null;
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
      }[],
    ) => assignAppointmentEmployees(appointment.id, assignments),
    onSuccess: () => {
      toast.success("Profissional salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: () => {
      toast.error("Erro ao salvar profissional");
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
      slotProps={{
        paper: {
          sx: {
            width: "60%",
            maxWidth: "1400px",
            minWidth: "1250px",
          },
        },
        backdrop: {
          sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4, pb: 0 }}
      >
        <Typography variant="h5">Detalhes do agendamento</Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <Divider />
      <DialogContent sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          className="coluna-1"
          sx={{
            width: "45%",
            display: "flex",
            gap: 2,
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Agendamento
            </Typography>
            <CustomCard sx={{ mt: 1, px: 2, py: 1, minWidth: "580px" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={500}>
                  {formatAppointmentDate(appointment.scheduled_at)}
                </Typography>
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

              <Box sx={{ p: 2 }}>
                {appointment.status === "pending" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<X size={16} />}
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          disabled={!!loadingAction}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          onClick={() => handleAction(appointment, "confirm")}
                          startIcon={<CalendarCheck size={16} />}
                          loading={loadingAction === "confirm"}
                          disabled={!!loadingAction}
                          size="small"
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
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<X size={16} />}
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          disabled={!!loadingAction}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Play size={16} />}
                          loading={loadingAction === "start"}
                          disabled={!!loadingAction}
                          onClick={() => handleAction(appointment, "start")}
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
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<Check size={16} />}
                        loading={loadingAction === "complete"}
                        disabled={!!loadingAction}
                        onClick={() => handleAction(appointment, "complete")}
                      >
                        Finalizar
                      </Button>
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
                            gap: 1,
                            mb: 0.5,
                            color: appointment.is_paid
                              ? "success.main"
                              : "warning.main",
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
                      ))}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      {appointment.is_paid ? (
                        <Chip
                          label="PAGO"
                          color="success"
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 900, px: 1 }}
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
                        >
                          Cobrar no Caixa
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </CustomCard>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              Tutor
            </Typography>
            <Box sx={{ mt: 1, minWidth: "580px" }}>
              <ClientePersonalInfo client={appointment.client} />
            </Box>
          </Box>

          {/* PACOTES DISPONÍVEIS */}
          {availablePackages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" fontWeight={600}>
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

              <Box sx={{ mt: 1, minWidth: "580px", display: "flex", flexDirection: "column", gap: 1.5 }}>
                {availablePackages.map((pkg) => (
                  <CustomCard
                    key={pkg.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      px: 2,
                      py: 1.5,
                      minWidth: "580px",
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

        <Box className="coluna-2" sx={{ width: "50%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600}>
              Pets & Serviços
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {formattedTotal}
            </Typography>
          </Box>
          <Box sx={{ mt: 1, display: "flex", gap: 2, flexDirection: "column" }}>
            {appointment.items.map((item) => (
              <CustomCard sx={{ px: 2, py: 1, minWidth: "600px" }}>
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
                <Typography variant="h6" fontWeight={500}>
                  Serviços do pet
                </Typography>
                <Box>
                  {item.services.map((s) => {
                    const key = `${item.id}-${s.id}`;
                    const currentEmpId = localAssignments[key];

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
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              textDecoration: coveredServiceKeys.has(key)
                                ? "line-through"
                                : "none",
                              color: coveredServiceKeys.has(key)
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
                        </Box>

                        {/* Employee Select */}
                        {appointment.status !== "canceled" &&
                          appointment.status !== "no_show" && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                flex: 1,
                                ml: 1,
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ minWidth: "80px", mt: 1 }}
                              >
                                Profissional:
                              </Typography>
                              <Box
                                sx={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <Autocomplete
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
                                  value={
                                    activeEmployees.find(
                                      (e) =>
                                        String(e.id) === String(currentEmpId),
                                    ) || null
                                  }
                                  onChange={(_: any, val: any) => {
                                    const newAssignments = {
                                      ...localAssignments,
                                      [key]: val ? val.id : null,
                                    };
                                    setLocalAssignments(newAssignments);

                                    const payload = Object.entries(
                                      newAssignments,
                                    ).map(([k, empId]) => {
                                      const [itemId, svcId] = k
                                        .split("-")
                                        .map(Number);
                                      return {
                                        appointment_item_id: itemId,
                                        service_id: svcId,
                                        employee_id: empId as number | null,
                                      };
                                    });

                                    assignMutation.mutate(payload);
                                  }}
                                  renderOption={(props: any, option: any) => {
                                    const hasComm = checkHasCommission(
                                      option.id,
                                      s.id,
                                    );
                                    const { key, ...otherProps } = props;
                                    return (
                                      <li key={option.id} {...otherProps}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "100%",
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
                                      </li>
                                    );
                                  }}
                                  renderInput={(params: any) => (
                                    <TextField
                                      {...params}
                                      placeholder="Selecionar..."
                                      error={
                                        currentEmpId
                                          ? !checkHasCommission(
                                              Number(currentEmpId),
                                              s.id,
                                            )
                                          : false
                                      }
                                    />
                                  )}
                                />
                                {currentEmpId &&
                                  !checkHasCommission(
                                    Number(currentEmpId),
                                    s.id,
                                  ) && (
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
                                        style={{ marginTop: "2px" }}
                                      />
                                      <Typography
                                        variant="caption"
                                        color="warning.main"
                                        fontWeight={600}
                                        sx={{ lineHeight: 1.2 }}
                                      >
                                        Aviso: Não há uma regra de comissão para
                                        este caso. Para gerar comissionamento,
                                        verifique as regras cadastradas.
                                      </Typography>
                                    </Box>
                                  )}
                                {!currentEmpId &&
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
                                        style={{ marginTop: "2px" }}
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
                          return coveredServiceKeys.has(key)
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
    </Dialog>
  );
};

export default AppointmentDetailsModal;
