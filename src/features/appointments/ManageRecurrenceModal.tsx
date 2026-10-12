import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button as MuiButton,
  Chip,
  Paper,
  TextField,
  CircularProgress,
  alpha,
  DialogContentText,
} from "@mui/material";
import {
  X,
  Repeat,
  Calendar,
  Trash2,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ptBR as ptBRPickers } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import type { Appointment } from "./types";
import { updateAppointment } from "../../api/services/appointments";
import { useToast } from "../../hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/Button/Button";

dayjs.locale("pt-br");

type Props = {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const getMaxOccurrences = (freq: "weekly" | "biweekly" | "monthly") => {
  if (freq === "weekly") return 52;
  if (freq === "biweekly") return 26;
  return 12;
};

const getPresetOccurrences = (freq: "weekly" | "biweekly" | "monthly") => {
  if (freq === "weekly") return [4, 8, 12, 16, 24, 52];
  if (freq === "biweekly") return [4, 8, 12, 16, 26];
  return [2, 4, 6, 8, 12];
};

export default function ManageRecurrenceModal({
  open,
  appointment,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const initialFrequency = (
    appointment?.recurrence_frequency === "monthly"
      ? "monthly"
      : appointment?.recurrence_frequency === "biweekly"
      ? "biweekly"
      : "weekly"
  ) as "weekly" | "biweekly" | "monthly";

  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">(initialFrequency);
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(
    appointment ? dayjs(appointment.scheduled_at) : dayjs()
  );
  const [scheduledTime, setScheduledTime] = useState<Dayjs | null>(
    appointment ? dayjs(appointment.scheduled_at) : dayjs().hour(9).minute(0)
  );
  const [occurrences, setOccurrences] = useState<number>(
    Math.min(
      appointment?.recurrence?.occurrences || (initialFrequency === "monthly" ? 6 : 8),
      getMaxOccurrences(initialFrequency)
    )
  );
  const [saving, setSaving] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Sync state if modal opens or appointment changes
  useEffect(() => {
    if (open && appointment) {
      const freq = (
        appointment.recurrence_frequency === "monthly"
          ? "monthly"
          : appointment.recurrence_frequency === "biweekly"
          ? "biweekly"
          : "weekly"
      ) as "weekly" | "biweekly" | "monthly";

      const maxAllowed = getMaxOccurrences(freq);
      const initialOcc = appointment.recurrence?.occurrences || (freq === "monthly" ? 6 : 8);

      setFrequency(freq);
      setScheduledDate(dayjs(appointment.scheduled_at));
      setScheduledTime(dayjs(appointment.scheduled_at));
      setOccurrences(Math.min(Math.max(2, initialOcc), maxAllowed));
    }
  }, [open, appointment]);

  const handleFrequencyChange = (newFreq: "weekly" | "biweekly" | "monthly") => {
    setFrequency(newFreq);
    const maxAllowed = getMaxOccurrences(newFreq);
    setOccurrences((prev) => Math.min(Number(prev) || 2, maxAllowed));
  };

  // Calculate upcoming dates preview
  const upcomingPreviewDates = useMemo(() => {
    if (!scheduledDate || !scheduledDate.isValid() || !scheduledTime || !scheduledTime.isValid()) {
      return [];
    }
    const base = scheduledDate
      .hour(scheduledTime.hour())
      .minute(scheduledTime.minute())
      .second(0);

    const dates: Dayjs[] = [];
    const count = Math.min(occurrences, 4);

    for (let i = 0; i < count; i++) {
      if (frequency === "weekly") {
        dates.push(base.add(i, "week"));
      } else if (frequency === "biweekly") {
        dates.push(base.add(i * 2, "week"));
      } else if (frequency === "monthly") {
        dates.push(base.add(i, "month"));
      }
    }
    return dates;
  }, [scheduledDate, scheduledTime, frequency, occurrences]);

  if (!appointment) return null;

  const clientName = appointment.client?.name || "Cliente";
  const petNames = appointment.items?.map((it) => it.pet?.name).filter(Boolean).join(", ");
  const servicesList = appointment.items
    ?.flatMap((it) => it.services?.map((s) => s.name))
    .filter(Boolean)
    .join(", ");

  const handleSave = async () => {
    if (!scheduledDate?.isValid() || !scheduledTime?.isValid()) {
      toast.error("Por favor, selecione uma data e horário válidos.");
      return;
    }

    const finalDateTime = scheduledDate
      .hour(scheduledTime.hour())
      .minute(scheduledTime.minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    const maxAllowed = getMaxOccurrences(frequency);
    const finalOccurrences = Math.max(2, Math.min(Number(occurrences) || 2, maxAllowed));

    setSaving(true);
    try {
      await updateAppointment(appointment.id, {
        scheduled_at: finalDateTime,
        recurrence: {
          frequency,
          occurrences: finalOccurrences,
        },
        update_all_future: true,
      });

      toast.success("Recorrência atualizada com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Erro ao atualizar recorrência.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRecurrence = async () => {
    setCanceling(true);
    try {
      await updateAppointment(appointment.id, {
        remove_recurrence: true,
        update_all_future: true,
      });

      toast.success("Recorrência cancelada com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      setConfirmCancelOpen(false);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Erro ao cancelar recorrência.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={ptBRPickers.components.MuiLocalizationProvider.defaultProps.localeText}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Repeat size={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2} noWrap>
                Gerenciar Recorrência
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {clientName} {petNames ? `• Pet: ${petNames}` : ""}
              </Typography>
            </Box>
          </Box>

          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Card Resumo da Série Atual */}
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                Série Recorrente
              </Typography>
              <Chip
                size="small"
                label={
                  frequency === "monthly"
                    ? "Mensal"
                    : frequency === "biweekly"
                    ? "Quinzenal"
                    : "Semanal"
                }
                color="primary"
                sx={{ height: 22, fontWeight: 700, fontSize: "0.72rem" }}
              />
            </Box>
            {servicesList && (
              <Typography variant="caption" color="text.secondary">
                <b>Serviços inclusos:</b> {servicesList}
              </Typography>
            )}
          </Paper>

          {/* 1. Escolha de Frequência */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Frequência de Atendimento
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              {[
                { id: "weekly", label: "Semanal", desc: "A cada 7 dias" },
                { id: "biweekly", label: "Quinzenal", desc: "A cada 14 dias" },
                { id: "monthly", label: "Mensal", desc: "Mesmo dia ao mês" },
              ].map((opt) => {
                const isSelected = frequency === opt.id;
                return (
                  <Paper
                    key={opt.id}
                    elevation={0}
                    onClick={() => handleFrequencyChange(opt.id as any)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected
                        ? (theme) => alpha(theme.palette.primary.main, 0.08)
                        : "background.paper",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: isSelected ? "primary.main" : "primary.light",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color={isSelected ? "primary.main" : "text.primary"}>
                        {opt.label}
                      </Typography>
                      {isSelected && <CheckCircle2 size={16} color="#7c3aed" />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {opt.desc}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </Box>

          {/* 2. Próxima Sessão e Horário */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Data e Horário do Próximo Atendimento
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
              <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Data da Próxima Sessão"
                  value={scheduledDate}
                  onChange={(newDate) => setScheduledDate(newDate)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <DesktopTimePicker
                  label="Horário Padrão"
                  value={scheduledTime}
                  ampm={false}
                  minutesStep={5}
                  onChange={(newTime) => setScheduledTime(newTime)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* 3. Quantidade de Repetições */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Quantidade de Sessões Futuras
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              {getPresetOccurrences(frequency).map((num) => (
                <Chip
                  key={num}
                  label={`${num} sessões`}
                  clickable
                  color={occurrences === num ? "primary" : "default"}
                  variant={occurrences === num ? "filled" : "outlined"}
                  onClick={() => setOccurrences(num)}
                  sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                />
              ))}
            </Box>
            <TextField
              size="small"
              type="number"
              label="Número personalizado de repetições"
              value={occurrences}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setOccurrences("" as any);
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  setOccurrences(Math.min(num, getMaxOccurrences(frequency)));
                }
              }}
              onBlur={() => {
                const maxAllowed = getMaxOccurrences(frequency);
                const num = Number(occurrences);
                if (isNaN(num) || num < 2) {
                  setOccurrences(2);
                } else if (num > maxAllowed) {
                  setOccurrences(maxAllowed);
                }
              }}
              inputProps={{ min: 2, max: getMaxOccurrences(frequency) }}
              helperText={`Mínimo de 2 e máximo de ${getMaxOccurrences(frequency)} sessões (até 1 ano)`}
              sx={{ width: { xs: "100%", sm: "280px" } }}
            />
          </Box>

          {/* 4. Prévia das Próximas Sessões */}
          {upcomingPreviewDates.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                <CalendarDays size={16} color="#666" />
                Prévia das Próximas Sessões Calculadas:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 1,
                }}
              >
                {upcomingPreviewDates.map((d, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Calendar size={15} color="#7c3aed" />
                      <Typography variant="body2" fontWeight={600}>
                        {d.format("DD/MM/YYYY (ddd)")}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {d.format("HH:mm")} • {idx + 1}ª sessão
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        {/* Rodapé com Ações */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <MuiButton
            color="error"
            variant="outlined"
            startIcon={<Trash2 size={16} />}
            onClick={() => setConfirmCancelOpen(true)}
            disabled={saving || canceling}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "error.light",
              "&:hover": { borderColor: "error.main", bgcolor: "error.lighter" },
            }}
          >
            Cancelar Recorrência
          </MuiButton>

          <Box sx={{ display: "flex", gap: 1 }}>
            <MuiButton
              variant="outlined"
              onClick={onClose}
              disabled={saving || canceling}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Fechar
            </MuiButton>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving || canceling}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Salvar Alterações na Série
            </Button>
          </Box>
        </DialogActions>

        {/* Diálogo de Confirmação para Cancelamento de Recorrência */}
        <Dialog
          open={confirmCancelOpen}
          onClose={() => setConfirmCancelOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cancelar Recorrência?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "text.secondary" }}>
              Todos os agendamentos futuros não realizados desta série serão excluídos do sistema.
              Os agendamentos passados ou já finalizados permanecerão salvos no histórico.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2 }}>
            <MuiButton
              onClick={() => setConfirmCancelOpen(false)}
              disabled={canceling}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Voltar
            </MuiButton>
            <MuiButton
              color="error"
              variant="contained"
              onClick={handleCancelRecurrence}
              disabled={canceling}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {canceling ? <CircularProgress size={18} color="inherit" /> : "Sim, Cancelar Recorrência"}
            </MuiButton>
          </DialogActions>
        </Dialog>
      </Dialog>
    </LocalizationProvider>
  );
}
