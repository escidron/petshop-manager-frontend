import { useMemo } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hourglass,
  Info,
  LogIn,
  LogOut,
  Mars,
  Pencil,
  Pill,
  Play,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  ShowerHead,
  Trash2,
  UserX,
  Utensils,
  Venus,
  X,
} from "lucide-react";
import { amber, orange } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";

import { fetchClientById } from "../../api/services/clients";
import { getAppointmentsByDay } from "../../api/services/appointments";
import { Button } from "../../components/Button/Button";
import CustomCard from "../../components/Card/CustomCard";
import { useAuth } from "../../hooks/useAuth";
import theme from "../../theme";
import ClientePersonalInfo from "../clients/ClientePersonalInfo";
import { AppointmentStatusChip } from "../appointments/AppointmentStatusChip";
import DaycareReportSection from "./DaycareReportSection";

import type { Appointment } from "../appointments/types";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type {
  DaycareStay,
  DaycareStayAction,
  DaycareStayStatus,
  DaycareTask,
} from "./types";

const CHIP_TEXT_COLOR = "#263238";

export function getDaycareStatusUI(status: DaycareStayStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pendente",
        icon: Hourglass,
        color: amber[600],
        bg: amber[300],
        textColor: CHIP_TEXT_COLOR,
      };
    case "checked_in":
      return {
        label: "Em andamento",
        icon: Play,
        color: "#ff751f",
        bg: orange[300],
        textColor: CHIP_TEXT_COLOR,
      };
    case "checked_out":
      return {
        label: "Finalizado",
        icon: Check,
        color: theme.palette.success.main,
        bg: theme.palette.success.light,
        textColor: CHIP_TEXT_COLOR,
      };
    case "absent":
      return {
        label: "Não compareceu",
        icon: Ban,
        color: theme.palette.error.main,
        bg: theme.palette.error.light,
        textColor: CHIP_TEXT_COLOR,
      };
    case "canceled":
    default:
      return {
        label: "Cancelado",
        icon: X,
        color: theme.palette.error.main,
        bg: theme.palette.error.light,
        textColor: CHIP_TEXT_COLOR,
      };
  }
}

export function DaycareStatusChip({
  status,
  size = "small",
}: {
  status: DaycareStayStatus;
  size?: "small" | "medium";
}) {
  const ui = getDaycareStatusUI(status);
  const isSmall = size === "small";
  const IconComp = ui.icon;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: ui.bg,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.5 : 0.75,
        borderRadius: 1,
        color: ui.textColor,
      }}
    >
      <IconComp size={isSmall ? 12 : 16} color={ui.textColor} />
      <Typography
        fontSize={isSmall ? "12px" : "14px"}
        fontWeight={600}
        color={ui.textColor}
      >
        {ui.label}
      </Typography>
    </Box>
  );
}

type Props = {
  open: boolean;
  stay: DaycareStay | null;
  groupStays?: DaycareStay[];
  onClose: () => void;
  onAction: (stay: DaycareStay, action: DaycareStayAction) => Promise<void>;
  onEdit: (stay: DaycareStay) => void;
  onDelete: (stay: DaycareStay) => Promise<void>;
  onToggleTask: (task: DaycareTask) => Promise<void>;
  onOpenHealth?: (pet: { id: number; name: string }) => void;
  onSendWhatsApp: (stay: DaycareStay) => void;
  onScheduleBath?: (client: Client, pet: Pet, stayDate: string) => void;
  isLoadingAction: boolean;
};

export default function DaycareDetailsModal({
  open,
  stay,
  groupStays,
  onClose,
  onAction,
  onEdit,
  onDelete,
  onToggleTask,
  onSendWhatsApp: _onSendWhatsApp,
  isLoadingAction,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const allStays = useMemo(() => {
    if (groupStays && groupStays.length > 0) return groupStays;
    return stay ? [stay] : [];
  }, [groupStays, stay]);

  const stayDateStr = stay?.scheduled_start_at
    ? dayjs(stay.scheduled_start_at).format("YYYY-MM-DD")
    : "";

  const { data: dayAppointmentsData } = useQuery({
    queryKey: ["appointments", "day", stayDateStr],
    queryFn: () => getAppointmentsByDay(stayDateStr),
    enabled: open && !!stay && !!stayDateStr,
  });

  const dayAppointments: Appointment[] = useMemo(() => {
    if (Array.isArray(dayAppointmentsData)) return dayAppointmentsData;
    if (Array.isArray((dayAppointmentsData as any)?.appointments)) {
      return (dayAppointmentsData as any).appointments;
    }
    return [];
  }, [dayAppointmentsData]);

  const { data: fullClient } = useQuery({
    queryKey: ["client", stay?.client?.id],
    queryFn: () => fetchClientById(stay!.client!.id),
    enabled: open && !!stay?.client?.id,
    initialData: stay?.client as any,
    staleTime: 1000 * 60 * 5,
  });

  const totalCents = useMemo(() => {
    return allStays.reduce((acc, s) => {
      const sCents =
        s.total_price_cents > 0
          ? s.total_price_cents
          : !s.is_package_covered && s.service
          ? (s.service.price_cents || 0) * (s.quantity || 1)
          : !s.is_package_covered && s.modality
          ? (s.modality.price_cents || 0) * (s.quantity || 1)
          : 0;
      return acc + sCents;
    }, 0);
  }, [allStays]);

  if (!stay) return null;

  const client = fullClient || stay.client;
  const startMoment = dayjs(stay.scheduled_start_at);
  const endMoment = dayjs(stay.scheduled_end_at);

  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const handleClientClick = () => {
    if (client?.id) {
      onClose();
      navigate(`/registration/clients/${client.id}`);
    }
  };

  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth={false}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: "90%", lg: "1100px" },
            maxWidth: "1150px",
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
        <Typography
          variant="h5"
          sx={{ fontSize: { xs: "1.15rem", sm: "1.4rem" }, fontWeight: 700 }}
        >
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
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
          overflowX: "hidden",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {/* COLUNA 1: AGENDAMENTO + TUTOR */}
        <Box
          sx={{
            width: { xs: "100%", md: "48%" },
            minWidth: 0,
            display: "flex",
            gap: 2,
            flexDirection: "column",
            mt: { xs: 1, sm: 1.5 },
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={600}
              sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}
            >
              Agendamento
            </Typography>
            <CustomCard
              sx={{
                mt: 1,
                px: { xs: 1.5, sm: 2 },
                py: 1.5,
                width: "100%",
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ textTransform: "capitalize", fontSize: "1.05rem" }}
                  >
                    {stay.stay_type === "multi_day"
                      ? `${startMoment.format("DD/MM/YYYY HH:mm")} até ${endMoment.format("DD/MM/YYYY HH:mm")}`
                      : `${startMoment.format("dddd, DD/MM/YYYY")} • ${startMoment.format("HH:mm")} às ${endMoment.format("HH:mm")}`}
                  </Typography>
                </Box>
                <DaycareStatusChip status={stay.status} />
              </Box>

              {/* Horários reais de Check-in / Check-out */}
              {(stay.check_in_at || stay.check_out_at) && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    gap: 3,
                    flexWrap: "wrap",
                  }}
                >
                  {stay.check_in_at && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="info.main"
                        fontWeight={700}
                        display="block"
                      >
                        Horário de Entrada (Check-in)
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {dayjs(stay.check_in_at).format("DD/MM/YYYY [às] HH:mm")}
                      </Typography>
                    </Box>
                  )}
                  {stay.check_out_at && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight={700}
                        display="block"
                      >
                        Horário de Saída (Check-out)
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {dayjs(stay.check_out_at).format("DD/MM/YYYY [às] HH:mm")}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Pertences e Observações */}
              {(stay.belongings || stay.notes) && (
                <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                  {stay.belongings && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        🎒 Pertences deixados
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {stay.belongings}
                      </Typography>
                    </Box>
                  )}
                  {stay.notes && (
                    <Box>
                      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                        <Info size={14} color={theme.palette.error.main} />
                        <Typography variant="body2" color="error.main" fontWeight={600}>
                          Observações
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          ml: 2.75,
                          wordBreak: "break-word",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {stay.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Botões de Ação por Status */}
              {stay.status === "pending" && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column-reverse", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<X size={15} />}
                      disabled={isLoadingAction}
                      onClick={() => onAction(stay, "cancel")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UserX size={15} />}
                      disabled={isLoadingAction}
                      onClick={() => onAction(stay, "mark_absent")}
                    >
                      Faltou
                    </Button>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Pencil size={15} />}
                      disabled={isLoadingAction}
                      onClick={() => {
                        onClose();
                        onEdit(stay);
                      }}
                    >
                      Alterar
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<LogIn size={16} />}
                      disabled={isLoadingAction}
                      onClick={() => onAction(stay, "check_in")}
                      sx={{ fontWeight: 700 }}
                    >
                      Fazer Check-in
                    </Button>
                  </Box>
                </Box>
              )}

              {stay.status === "checked_in" && (
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
                    disabled={isLoadingAction}
                    onClick={() => onAction(stay, "cancel")}
                  >
                    Cancelar
                  </Button>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Pencil size={15} />}
                      disabled={isLoadingAction}
                      onClick={() => {
                        onClose();
                        onEdit(stay);
                      }}
                    >
                      Alterar
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<LogOut size={16} />}
                      disabled={isLoadingAction}
                      onClick={() => onAction(stay, "check_out")}
                      sx={{ fontWeight: 700 }}
                    >
                      Finalizar (Check-out)
                    </Button>
                  </Box>
                </Box>
              )}

              {stay.status === "checked_out" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Resumo da Finalização
                    </Typography>

                    {allStays.map((s) => {
                      const serviceName =
                        s.service?.name ||
                        s.modality?.name ||
                        (s.stay_type === "daily" ? "Diária Creche" : "Creche");
                      const petLabel =
                        allStays.length > 1 && s.pet?.name ? ` — ${s.pet.name}` : "";
                      const sPriceCents =
                        s.total_price_cents > 0
                          ? s.total_price_cents
                          : s.service?.price_cents
                          ? (s.service.price_cents || 0) * (s.quantity || 1)
                          : s.modality?.price_cents
                          ? (s.modality.price_cents || 0) * (s.quantity || 1)
                          : 0;
                      const sFormattedPrice = (sPriceCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });

                      if (s.is_package_covered || s.covered_quantity > 0) {
                        return (
                          <Box
                            key={`cov-${s.id}`}
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
                              <strong>
                                {serviceName}
                                {petLabel}
                              </strong>{" "}
                              debitado do pacote.
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box
                          key={`bil-${s.id}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            color: "warning.main",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <AlertCircle size={18} />
                            <Typography variant="body2">
                              <strong>
                                {serviceName}
                                {petLabel}
                              </strong>{" "}
                              pendente de pagamento no caixa.
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {sFormattedPrice}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: isOwnerOrAdmin ? "space-between" : "flex-end",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    {isOwnerOrAdmin && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RotateCcw size={14} />}
                        disabled={isLoadingAction}
                        onClick={() => onAction(stay, "reopen")}
                      >
                        Reabrir
                      </Button>
                    )}

                    {!stay.is_package_covered && totalCents > 0 ? (
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<ShoppingCart size={15} />}
                        onClick={() => {
                          onClose();
                          navigate("/pos");
                        }}
                      >
                        Ir para o Caixa
                      </Button>
                    ) : (
                      <Chip
                        label="PAGO"
                        color="success"
                        size="small"
                        variant="filled"
                        icon={<ShoppingBag size={13} />}
                        sx={{ fontWeight: 900, px: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {(stay.status === "absent" || stay.status === "canceled") && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Trash2 size={15} />}
                    disabled={isLoadingAction}
                    onClick={async () => {
                      await onDelete(stay);
                      onClose();
                    }}
                  >
                    Excluir
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LogIn size={15} />}
                    disabled={isLoadingAction}
                    onClick={() => onAction(stay, "check_in")}
                  >
                    Fazer Check-in Agora
                  </Button>
                </Box>
              )}
            </CustomCard>
          </Box>

          {/* SEÇÃO TUTOR (Reutilizando ClientePersonalInfo idêntico ao Banho e Tosa) */}
          {client && (
            <Box sx={{ mt: 1 }}>
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
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    },
                  }}
                >
                  Ver perfil completo
                </Button>
              </Box>
              <ClientePersonalInfo
                client={client as any}
                variant="appointment"
                onClientClick={handleClientClick}
              />
            </Box>
          )}
        </Box>

        {/* COLUNA 2: PET, MODALIDADE & SERVIÇOS + ROTINA DE RAÇÃO/REMÉDIOS */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            mt: { xs: 1, sm: 1.5 },
          }}
        >
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}
              >
                Pets & Serviços
              </Typography>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: "1.1rem", sm: "1.3rem" } }}
              >
                {formattedTotal}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, mt: 1.25 }}>
              {allStays.map((curStay) => {
                const curModalityUnitCents =
                  curStay.unit_price_cents > 0
                    ? curStay.unit_price_cents
                    : curStay.modality?.price_cents || 0;
                const curModalitySubtotalCents =
                  curModalityUnitCents * Math.max(1, curStay.quantity || 1);
                const curPetAppointment = dayAppointments.find(
                  (a) =>
                    a.status !== "canceled" &&
                    a.items?.some((it) => it.pet?.id === curStay.pet_id)
                );

                return (
                  <CustomCard
                    key={curStay.id}
                    sx={{
                      px: { xs: 1.75, sm: 2.25 },
                      py: 1.75,
                      width: "100%",
                      borderRadius: 2.5,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    {/* CABEÇALHO DO PET (Nome à esquerda | Características e Sexo à direita na mesma linha) */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography variant="h6" fontWeight={700}>
                          {curStay.pet?.name}
                        </Typography>
                        {curStay.pet?.breed && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            • {curStay.pet.breed}
                          </Typography>
                        )}
                      </Box>

                      {/* Informações na direita: Espécie, Porte e Sexo na mesma linha horizontal */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        {curStay.pet?.species && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              bgcolor: "#F1F5F9",
                              px: 0.85,
                              py: 0.25,
                              borderRadius: 1,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          >
                            {curStay.pet.species}
                          </Typography>
                        )}
                        {curStay.pet?.size && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              bgcolor: "#F1F5F9",
                              px: 0.85,
                              py: 0.25,
                              borderRadius: 1,
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          >
                            Porte {curStay.pet.size}
                          </Typography>
                        )}
                        {curStay.pet?.gender &&
                          (curStay.pet.gender.includes("male") ||
                            curStay.pet.gender.includes("female")) && (
                            <Chip
                              size="small"
                              label={curStay.pet.gender === "male" ? "Macho" : "Fêmea"}
                              icon={
                                curStay.pet.gender === "male" ? (
                                  <Mars color={theme.palette.text.primary} size={13} />
                                ) : (
                                  <Venus color={theme.palette.text.primary} size={13} />
                                )
                              }
                              sx={{
                                bgcolor:
                                  curStay.pet.gender === "male"
                                    ? "rgba(33, 150, 243, 0.15)"
                                    : "rgba(233, 30, 99, 0.15)",
                                color: "text.primary",
                                px: 0.5,
                                height: "22px",
                                fontSize: "0.72rem",
                                fontWeight: 500,
                                borderRadius: 1,
                              }}
                            />
                          )}
                      </Box>
                    </Box>

                    {curStay.pet?.notes && (
                      <Box sx={{ mt: 0.75, display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                        <Info size={14} color={theme.palette.error.main} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Typography variant="caption" color="error.main" fontWeight={500}>
                          {curStay.pet.notes}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1.25, borderColor: "#F1F5F9" }} />

                    {/* SERVIÇO / MODALIDADE */}
                    {curStay.modality && (
                      <Box sx={{ mb: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontSize: "0.7rem",
                            mb: 0.5,
                          }}
                        >
                          Serviço
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 0.25,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {curStay.modality.name}
                            {curStay.quantity > 1
                              ? curStay.modality.billing_type === "hourly"
                                ? ` (${curStay.quantity}h)`
                                : ` (${curStay.quantity} diárias)`
                              : ""}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {(curModalitySubtotalCents / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* SERVIÇO ADICIONAL SE HOUVER */}
                    {curStay.service && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.35,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">
                            Serviço extra:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {curStay.service.name}
                          </Typography>
                          {curStay.is_package_covered && (
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
                            fontWeight: 700,
                            textDecoration: curStay.is_package_covered
                              ? "line-through"
                              : "none",
                            color: curStay.is_package_covered
                              ? "text.disabled"
                              : "text.primary",
                          }}
                        >
                          {(curStay.service.price_cents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </Typography>
                      </Box>
                    )}

                    {/* BLOCO DE BANHO & TOSA (Apenas quando houver agendamento) */}
                    {curPetAppointment && (
                      <Box
                        sx={{
                          mt: 1.25,
                          p: 1.25,
                          borderRadius: 1.5,
                          bgcolor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ShowerHead size={16} color={theme.palette.primary.main} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              Banho às {dayjs(curPetAppointment.scheduled_at).format("HH:mm")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {curPetAppointment.items
                                .flatMap((it) => it.services.map((s) => s.name))
                                .join(", ")}
                            </Typography>
                          </Box>
                        </Box>
                        <AppointmentStatusChip
                          status={curPetAppointment.status}
                          size="small"
                        />
                      </Box>
                    )}

                    {/* BLOCO DE ROTINA (ALIMENTAÇÃO E MEDICAÇÃO) */}
                    {curStay.tasks && curStay.tasks.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: 700,
                            color: "text.secondary",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontSize: "0.7rem",
                            mb: 0.75,
                          }}
                        >
                          Rotina do Pet
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
                          {curStay.tasks.map((task) => (
                            <Box
                              key={task.id}
                              onClick={() => onToggleTask(task)}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 1.25,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: task.is_completed ? "#BBF7D0" : "#E2E8F0",
                                bgcolor: task.is_completed ? "#F0FDF4" : "#F8FAFC",
                                cursor: "pointer",
                                transition: "all 0.15s ease-in-out",
                                "&:hover": {
                                  borderColor: task.is_completed ? "#86EFAC" : "#CBD5E1",
                                  bgcolor: task.is_completed ? "#DCFCE7" : "#F1F5F9",
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 1.25,
                                  minWidth: 0,
                                  mr: 1,
                                }}
                              >
                                <Box sx={{ mt: 0.25 }}>
                                  {task.is_completed ? (
                                    <CheckCircle2
                                      size={17}
                                      color="#16A34A"
                                    />
                                  ) : task.task_type === "feeding" ? (
                                    <Utensils
                                      size={16}
                                      color="#D97706"
                                    />
                                  ) : (
                                    <Pill
                                      size={16}
                                      color="#7C3AED"
                                    />
                                  )}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{
                                      textDecoration: task.is_completed
                                        ? "line-through"
                                        : "none",
                                      color: task.is_completed
                                        ? "text.secondary"
                                        : "text.primary",
                                    }}
                                  >
                                    {task.scheduled_time} — {task.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {task.task_type === "feeding"
                                      ? "Alimentação"
                                      : "Medicação"}
                                    {task.notes && ` • ${task.notes}`}
                                  </Typography>
                                </Box>
                              </Box>

                              <Chip
                                size="small"
                                label={
                                  task.is_completed ? "Concluído" : "Marcar feito"
                                }
                                color={task.is_completed ? "success" : "default"}
                                variant={
                                  task.is_completed ? "filled" : "outlined"
                                }
                                icon={
                                  !task.is_completed ? (
                                    <Clock size={12} />
                                  ) : undefined
                                }
                                sx={{
                                  height: 24,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  borderColor: task.is_completed ? "transparent" : "#CBD5E1",
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* BOLETIM DIÁRIO DA CRECHE (Acompanhamento em Tempo Real) */}
                    <DaycareReportSection
                      stay={curStay}
                      appointment={curPetAppointment}
                    />
                  </CustomCard>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

