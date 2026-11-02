import {
  Box,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
} from "@mui/material";
import { Dot, List, X, Repeat, Utensils, Pill, ShowerHead } from "lucide-react";
import dayjs from "dayjs";
import theme from "../../theme";
import CustomCard from "../../components/Card/CustomCard";
import { COAT_TYPES, PET_SIZES } from "../pets/constants";
import type { Appointment } from "../appointments/types";
import type { DaycareStay, DaycareStayStatus } from "./types";

export type DaycareGroup = {
  key: string;
  primaryStay: DaycareStay;
  stays: DaycareStay[];
  client: DaycareStay["client"];
  scheduled_start_at: string;
  scheduled_end_at: string;
  status: DaycareStayStatus;
};

type Props = {
  open: boolean;
  handleClose: () => void;
  group: DaycareGroup;
  dayAppointments?: Appointment[];
};

const cleanServiceName = (name?: string | null) => {
  if (!name) return "";
  return name.replace(/^Creche\s*—\s*/i, "").replace(/^Creche\s*-\s*/i, "");
};

const getStayPriceCents = (stay: DaycareStay) => {
  if (stay.is_package_covered) return 0;
  if (stay.total_price_cents > 0) return stay.total_price_cents;
  if (stay.service?.price_cents) return stay.service.price_cents * (stay.quantity || 1);
  if (stay.modality?.price_cents) return stay.modality.price_cents * (stay.quantity || 1);
  return 0;
};

export default function DaycareServiceSummaryModal({
  open,
  handleClose,
  group,
  dayAppointments = [],
}: Props) {
  const isRecurrent = group.stays.some((s) => Boolean(s.recurrence_id));

  const totalCents = group.stays.reduce((acc, stay) => acc + getStayPriceCents(stay), 0);
  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
        backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" } },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <List size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight={600}>
              Serviços e Rotina
            </Typography>
            <Typography variant="h6" color="text.primary">
              {formattedTotal}
            </Typography>
            {isRecurrent && (
              <Chip
                icon={<Repeat size={13} color="#7c3aed" />}
                label="Recorrente"
                size="small"
                sx={{
                  bgcolor: "rgba(124, 58, 237, 0.08)",
                  color: "#7c3aed",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  height: 24,
                  "& .MuiChip-icon": { ml: 0.5 },
                }}
              />
            )}
          </Box>
          <Box sx={{ cursor: "pointer", display: "flex" }} onClick={handleClose}>
            <X size={24} />
          </Box>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {group.stays.map((stay) => {
          const coatLabel = COAT_TYPES.find((c) => c.value === stay.pet?.coat_type)?.label;
          const sizeLabel = PET_SIZES.find((s) => s.value === stay.pet?.size)?.label;
          const details = [
            stay.pet?.species,
            sizeLabel ? `Porte ${sizeLabel}` : null,
            coatLabel ? `Pelagem ${coatLabel}` : null,
          ]
            .filter(Boolean)
            .join(" • ");

          const feedingTasks = (stay.tasks || []).filter((t) => t.task_type === "feeding");
          const medTasks = (stay.tasks || []).filter((t) => t.task_type === "medication");

          const petBathAppt = dayAppointments.find(
            (a) =>
              a.status !== "canceled" &&
              a.items?.some((it) => it.pet?.id === stay.pet_id)
          );

          const rawServiceName =
            stay.service?.name ||
            stay.modality?.name ||
            (stay.stay_type === "hourly"
              ? `Creche por hora (${stay.quantity}h)`
              : stay.stay_type === "multi_day"
              ? `${stay.quantity} diárias`
              : "Diária");

          const serviceName = cleanServiceName(rawServiceName);
          const priceCents = getStayPriceCents(stay);

          return (
            <CustomCard key={stay.id} sx={{ p: 1.5 }}>
              {/* Pet Name & Details */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {stay.pet?.name}
                </Typography>
                {details && (
                  <Typography variant="caption" color="text.secondary">
                    {details}
                  </Typography>
                )}
              </Box>

              {/* Serviço Principal */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 0.5,
                }}
              >
                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", height: 20 }}>
                    <Dot color={theme.palette.text.disabled} size={16} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {serviceName}
                    </Typography>
                    {stay.is_package_covered && (
                      <Chip
                        label="Pacote"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: "success.main",
                          color: "white",
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {stay.is_package_covered
                    ? "R$ 0,00"
                    : (priceCents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                </Typography>
              </Box>

              {/* Rotina de Alimentação (se houver) */}
              {(feedingTasks.length > 0 || Boolean(stay.food_info)) && (
                <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <Utensils size={13} /> Alimentação
                  </Typography>
                  {feedingTasks.length > 0 ? (
                    feedingTasks.map((t) => (
                      <Box
                        key={t.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 0.25,
                          pl: 2.2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          • {t.scheduled_time} — {t.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={t.is_completed ? "Feito ✓" : "Pendente"}
                          color={t.is_completed ? "success" : "default"}
                          sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
                        />
                      </Box>
                    ))
                  ) : stay.food_info ? (
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ pl: 2.2 }}
                    >
                      {stay.food_info}
                    </Typography>
                  ) : null}
                </Box>
              )}

              {/* Rotina de Medicação (se houver) */}
              {medTasks.length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "error.main",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <Pill size={13} /> Medicação
                  </Typography>
                  {medTasks.map((t) => (
                    <Box
                      key={t.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 0.25,
                        pl: 2.2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        • {t.scheduled_time} — {t.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={t.is_completed ? "Administrado ✓" : "Pendente"}
                        color={t.is_completed ? "success" : "warning"}
                        sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Banho & Tosa no mesmo dia (se houver) */}
              {petBathAppt && (
                <Box
                  sx={{
                    mt: 1.25,
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: "rgba(49, 52, 133, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ShowerHead size={16} color={theme.palette.primary.main} />
                  <Typography variant="caption" fontWeight={600} color="primary.main">
                    Possui Banho & Tosa agendado hoje às{" "}
                    {dayjs(petBathAppt.scheduled_at).format("HH:mm")}
                  </Typography>
                </Box>
              )}
            </CustomCard>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}

