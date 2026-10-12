import {
  Box,
  Divider,
  Paper,
  Stack,
  Switch,
  Typography,
  Grid,
  Chip,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { updateWorkingHours } from "../../api/services/tenants";
import { Button } from "../../components/Button/Button";
import type { WorkingHours } from "./types";

dayjs.locale("pt-br");

const DEFAULT_WORKING_HOURS: WorkingHours = {
  "0": { is_open: false, open: "08:00", close: "12:00" }, // Dom
  "1": { is_open: true,  open: "08:00", close: "18:00" }, // Seg
  "2": { is_open: true,  open: "08:00", close: "18:00" }, // Ter
  "3": { is_open: true,  open: "08:00", close: "18:00" }, // Qua
  "4": { is_open: true,  open: "08:00", close: "18:00" }, // Qui
  "5": { is_open: true,  open: "08:00", close: "18:00" }, // Sex
  "6": { is_open: true,  open: "08:00", close: "18:00" }, // Sáb
};

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const parseTime = (timeStr: string): dayjs.Dayjs =>
  dayjs()
    .hour(parseInt(timeStr.split(":")[0]))
    .minute(parseInt(timeStr.split(":")[1]))
    .second(0);

const formatTime = (d: dayjs.Dayjs): string =>
  `${String(d.hour()).padStart(2, "0")}:${String(d.minute()).padStart(2, "0")}`;

const popperSx = {
  "& .MuiMultiSectionDigitalClock-root": { maxHeight: 240 },
  "& .MuiMultiSectionDigitalClockSection-root": {
    maxHeight: 240,
    scrollbarWidth: "none" as const,
    "&::-webkit-scrollbar": { display: "none" },
  },
  "& .MuiMultiSectionDigitalClockSection-item": {
    minHeight: "unset",
    py: "4px",
    fontSize: "0.85rem",
  },
};

export default function WorkingHoursSettings() {
  const { tenant, setTenant } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [hours, setHours] = useState<WorkingHours>(
    tenant?.working_hours ?? DEFAULT_WORKING_HOURS,
  );

  const handleToggle = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], is_open: !prev[day].is_open },
    }));
  };

  const handleTimeChange = (
    day: string,
    field: "open" | "close",
    value: dayjs.Dayjs | null,
  ) => {
    if (!value?.isValid()) return;
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: formatTime(value) },
    }));
  };

  const handleSave = async () => {
    if (!tenant) return;
    try {
      setSaving(true);
      await updateWorkingHours(tenant.id, hours);
      setTenant({ ...tenant, working_hours: hours });
      toast.success("Horários de funcionamento atualizados!");
    } catch {
      toast.error("Erro ao salvar horários.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1.5px solid", borderColor: "divider" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
        Horários de Funcionamento
      </Typography>
      <Typography variant="body2" color="text.primary" mb={2}>
        Agendamentos fora dos dias e horários configurados serão bloqueados.
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={{ xs: 3, md: 4 }}>
        {/* Left Column: Vertical Stack of Days */}
        <Grid size={{ xs: 12, md: 7 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Stack divider={<Divider />} spacing={0}>
              {(["0", "1", "2", "3", "4", "5", "6"] as const).map((day) => {
                const schedule = hours[day] ?? DEFAULT_WORKING_HOURS[day];
                const closed = !schedule.is_open;
                return (
                  <Box
                    key={day}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      gap: { xs: 1.25, sm: 2 },
                      py: 1.5,
                      opacity: closed ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {/* Top Row / Left: Day Name & Switch & Status */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minWidth: { sm: 170 },
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Switch
                          size="small"
                          checked={schedule.is_open}
                          onChange={() => handleToggle(day)}
                          color="success"
                        />
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {DAY_NAMES[parseInt(day)]}
                        </Typography>
                      </Box>

                      <Chip
                        label={schedule.is_open ? "Aberto" : "Fechado"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          bgcolor: schedule.is_open ? "#DCFCE7" : "#F3F4F6",
                          color: schedule.is_open ? "#166534" : "#64748B",
                        }}
                      />
                    </Box>

                    {/* Bottom Row / Right: Time Pickers */}
                    {schedule.is_open ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr",
                          alignItems: "center",
                          gap: 1,
                          width: { xs: "100%", sm: "auto" },
                          ml: { sm: "auto" },
                        }}
                      >
                        <TimePicker
                          value={parseTime(schedule.open)}
                          onChange={(v) => handleTimeChange(day, "open", v)}
                          ampm={false}
                          minutesStep={5}
                          disabled={closed}
                          slotProps={{
                            textField: { size: "small", sx: { width: { xs: "100%", sm: 110 } } },
                            actionBar: { actions: [] },
                            popper: { sx: popperSx },
                          }}
                        />

                        <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ textAlign: "center" }}>
                          às
                        </Typography>

                        <TimePicker
                          value={parseTime(schedule.close)}
                          onChange={(v) => handleTimeChange(day, "close", v)}
                          ampm={false}
                          minutesStep={5}
                          disabled={closed}
                          slotProps={{
                            textField: { size: "small", sx: { width: { xs: "100%", sm: 110 } } },
                            actionBar: { actions: [] },
                            popper: { sx: popperSx },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ ml: { sm: "auto" }, display: { xs: "none", sm: "block" } }}>
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          Fechado o dia todo
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </LocalizationProvider>

          <Box sx={{ mt: 3, display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {saving ? "Salvando..." : "Salvar Horários"}
            </Button>
          </Box>
        </Grid>

        {/* Right Column: Weekly Summary & Guidelines */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
              Resumo da Semana
            </Typography>
            
            <Stack spacing={2.5} sx={{ bgcolor: "action.hover", p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", flexGrow: 1, justifyContent: "space-between" }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                    Dias Ativos
                  </Typography>
                  <Typography variant="body2" fontWeight={700} mt={0.5} color="success.main">
                    {Object.entries(hours)
                      .filter(([_, h]) => h.is_open)
                      .map(([d]) => DAY_NAMES[parseInt(d)].substring(0, 3))
                      .join(", ") || "Nenhum dia aberto"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                    Carga Horária Semanal
                  </Typography>
                  <Typography variant="body2" fontWeight={700} mt={0.5} color="text.primary">
                    {(() => {
                      let totalMinutes = 0;
                      Object.values(hours).forEach((h) => {
                        if (h.is_open && h.open && h.close) {
                          const [oh, om] = h.open.split(":").map(Number);
                          const [ch, cm] = h.close.split(":").map(Number);
                          totalMinutes += (ch * 60 + cm) - (oh * 60 + om);
                        }
                      });
                      const hoursCount = Math.floor(totalMinutes / 60);
                      const minsCount = totalMinutes % 60;
                      return `${hoursCount}h${minsCount > 0 ? ` ${minsCount}min` : ""} de atendimento por semana`;
                    })()}
                  </Typography>
                </Box>

                <Divider sx={{ borderStyle: "dashed" }} />

                <Box>
                  <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
                    Regras de Funcionamento
                  </Typography>
                  <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500 }}>
                    • Os agendamentos devem estar dentro do intervalo configurado como <strong>Aberto</strong>.
                  </Typography>
                  <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500, mt: 1 }}>
                    • Horários fora desse período ou marcados como <strong>Fechado</strong> ficarão indisponíveis na agenda.
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500, fontStyle: "italic" }}>
                  * Lembre-se de clicar no botão "Salvar Horários" para aplicar as alterações na agenda.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
