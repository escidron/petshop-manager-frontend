import { useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ptBR as ptBRPickers } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Plus, Syringe, Trash2, X, AlertTriangle } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPetHealthRecord,
  deletePetHealthRecord,
  listPetHealthRecords,
} from "../../api/services/daycare";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import { CustomDay } from "../dashboard/DashboardCalendar";
import type { PetHealthRecord } from "./types";

dayjs.locale("pt-br");

function CustomDatePickerToolbar() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pt: 1.5,
        pb: 0.5,
        px: 2,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        Selecionar Data
      </Typography>
    </Box>
  );
}

type Props = {
  open: boolean;
  petId: number;
  petName: string;
  onClose: () => void;
};

const CATEGORY_LABELS: Record<PetHealthRecord["category"], string> = {
  vaccine: "Vacina",
  antiparasitic: "Antipulgas / Carrapatos",
  dewormer: "Vermífugo",
  exam: "Exame / Atestado",
};

export default function PetHealthModal({ open, petId, petName, onClose }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<PetHealthRecord["category"]>("vaccine");
  const [name, setName] = useState("");
  const [appliedAt, setAppliedAt] = useState<Dayjs | null>(dayjs());
  const [expiresAt, setExpiresAt] = useState<Dayjs | null>(dayjs().add(1, "year"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["pet-health", petId],
    queryFn: () => listPetHealthRecords(petId),
    enabled: open && !!petId,
  });

  const sharedDatePickerSlotProps = {
    layout: {
      sx: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      },
    },
    dialog: {
      sx: {
        "& .MuiDialog-paper": {
          borderRadius: 3,
          overflow: "hidden",
          maxWidth: "calc(100vw - 32px)",
          m: "auto",
        },
        "& .MuiDateCalendar-root": {
          width: "100%",
          maxWidth: 320,
          margin: "0 auto",
        },
      },
    },
    popper: {
      sx: {
        zIndex: 1400,
        "& .MuiDayCalendar-weekDayLabel": {
          color: "#3d4048 !important",
          fontWeight: 700,
          fontSize: "0.75rem",
        },
        "& .MuiPickersDay-root": {
          color: "#3d4048 !important",
          "&.Mui-selected": {
            color: "white !important",
          },
          "&.Mui-disabled": {
            color: "#b8bbc2 !important",
            opacity: 0.4,
          },
        },
        "& .MuiPickersCalendarHeader-label": {
          color: "#3d4048 !important",
        },
        "& .MuiPickersArrowSwitcher-button": {
          color: "#3d4048 !important",
        },
      },
    },
    textField: {
      size: "small" as const,
      fullWidth: true,
      placeholder: "DD/MM/AAAA",
      inputMode: "numeric" as const,
      sx: { backgroundColor: "#FFFFFF", width: "100%" },
    },
    actionBar: { actions: [] as any },
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome da vacina, antipulgas ou exame.");
      return;
    }
    if (!appliedAt?.isValid()) {
      toast.error("Informe a data de aplicação.");
      return;
    }
    try {
      setSaving(true);
      await createPetHealthRecord({
        pet_id: petId,
        category,
        name: name.trim(),
        applied_at: appliedAt.format("YYYY-MM-DD"),
        expires_at: expiresAt?.isValid() ? expiresAt.format("YYYY-MM-DD") : null,
        notes: notes.trim() || null,
      });
      toast.success("Registro de saúde adicionado!");
      setName("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["pet-health", petId] });
    } catch {
      toast.error("Erro ao salvar registro de saúde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    try {
      await deletePetHealthRecord(recordId);
      toast.success("Registro removido.");
      queryClient.invalidateQueries({ queryKey: ["pet-health", petId] });
    } catch {
      toast.error("Erro ao remover registro.");
    }
  };

  const today = dayjs().startOf("day");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Syringe size={20} color="#313485" />
          <Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Saúde e Vacinas — {petName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Controle de vacinas, antipulgas, vermífugos e exames
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="pt-br"
          localeText={
            ptBRPickers.components.MuiLocalizationProvider.defaultProps.localeText
          }
        >
          {/* FORMULÁRIO RÁPIDO */}
          <Box
            sx={{
              p: 2,
              bgcolor: "#f8fafc",
              borderRadius: 2.5,
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Novo Registro
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" },
                gap: 1.5,
              }}
            >
              <Select
                size="small"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as PetHealthRecord["category"];
                  setCategory(cat);
                  const base = appliedAt?.isValid() ? appliedAt : dayjs();
                  if (cat === "vaccine") {
                    setExpiresAt(base.add(1, "year"));
                  } else if (cat === "antiparasitic") {
                    setExpiresAt(base.add(3, "month"));
                  }
                }}
                sx={{ bgcolor: "#fff" }}
              >
                <MenuItem value="vaccine">Vacina</MenuItem>
                <MenuItem value="antiparasitic">Antipulgas</MenuItem>
                <MenuItem value="dewormer">Vermífugo</MenuItem>
                <MenuItem value="exam">Exame</MenuItem>
              </Select>

              <TextField
                size="small"
                placeholder="Ex: V10, Antirrábica, Gripe, Bravecto..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ bgcolor: "#fff" }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <FormLabel sx={{ display: "block", fontSize: "0.75rem", mb: 0.5 }}>
                  Data de Aplicação
                </FormLabel>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={appliedAt}
                  orientation="portrait"
                  onChange={(newDate) => setAppliedAt(newDate)}
                  dayOfWeekFormatter={(day: Dayjs) =>
                    ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][day.day()]
                  }
                  slots={{
                    day: CustomDay,
                    toolbar: CustomDatePickerToolbar,
                  }}
                  slotProps={sharedDatePickerSlotProps}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <FormLabel sx={{ display: "block", fontSize: "0.75rem", mb: 0.5 }}>
                  Vencimento / Próx. Dose
                </FormLabel>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={expiresAt}
                  orientation="portrait"
                  onChange={(newDate) => setExpiresAt(newDate)}
                  dayOfWeekFormatter={(day: Dayjs) =>
                    ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][day.day()]
                  }
                  slots={{
                    day: CustomDay,
                    toolbar: CustomDatePickerToolbar,
                  }}
                  slotProps={sharedDatePickerSlotProps}
                />
              </Box>
            </Box>

            <TextField
              size="small"
              placeholder="Observação (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ bgcolor: "#fff" }}
            />

            <Box display="flex" justifyContent="flex-end">
              <Button
                size="small"
                startIcon={<Plus size={16} />}
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Adicionar à Carteira"}
              </Button>
            </Box>
          </Box>
        </LocalizationProvider>

        <Divider />

        {/* HISTÓRICO */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Histórico Registrado ({records.length})
          </Typography>

          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Carregando...
            </Typography>
          ) : records.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma vacina ou antiparasitário registrado ainda para este pet.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {records.map((rec) => {
                const exp = rec.expires_at ? dayjs(rec.expires_at) : null;
                const isExpired = exp ? exp.isBefore(today) : false;
                const isExpiringSoon =
                  exp && !isExpired ? exp.diff(today, "day") <= 14 : false;

                return (
                  <Box
                    key={rec.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: isExpired
                        ? "#fecaca"
                        : isExpiringSoon
                        ? "#fde68a"
                        : "#e2e8f0",
                      bgcolor: isExpired
                        ? "#fef2f2"
                        : isExpiringSoon
                        ? "#fffbeb"
                        : "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="body2" fontWeight={800}>
                          {rec.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={CATEGORY_LABELS[rec.category] || rec.category}
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                        />
                        {isExpired && (
                          <Chip
                            size="small"
                            color="error"
                            icon={<AlertTriangle size={12} />}
                            label="Vencida"
                            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                          />
                        )}
                        {!isExpired && isExpiringSoon && (
                          <Chip
                            size="small"
                            color="warning"
                            label="Vence em breve"
                            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Aplicação: {dayjs(rec.applied_at).format("DD/MM/YYYY")}
                        {rec.expires_at
                          ? ` • Vencimento: ${dayjs(rec.expires_at).format("DD/MM/YYYY")}`
                          : ""}
                        {rec.notes ? ` • ${rec.notes}` : ""}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(rec.id)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
