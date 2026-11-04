import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Collapse,
  alpha,
  IconButton,
} from "@mui/material";
import {
  FileDown,
  CheckCircle2,
  PieChart,
  AlertTriangle,
  XCircle,
  MinusCircle,
  CircleDot,
  Utensils,
  Pill,
  FileText,
  Smile,
  ChevronDown,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import { updateDaycareStayReport } from "../../api/services/daycare";
import { generateDaycareReportPDF } from "./generateDaycareReportPDF";
import type {
  DaycareStay,
  DaycareReportData,
  DaycareFeedingStatus,
  DaycareMedicationStatus,
  DaycarePeeStatus,
  DaycarePoopStatus,
} from "./types";
import type { Appointment } from "../appointments/types";

interface Props {
  stay: DaycareStay;
  appointment?: Appointment | null;
  onReportUpdated?: (updatedStay: DaycareStay) => void;
}

const FEEDING_OPTIONS: {
  value: DaycareFeedingStatus;
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  { value: "ate_all", label: "Comeu tudo", icon: CheckCircle2, color: "#16a34a" }, // Verde
  { value: "ate_half", label: "Metade", icon: PieChart, color: "#ca8a04" }, // Amarelo
  { value: "ate_little", label: "Pouco", icon: AlertTriangle, color: "#ea580c" }, // Laranja
  { value: "did_not_eat", label: "Não comeu", icon: XCircle, color: "#dc2626" }, // Vermelho
];

const MEDICATION_OPTIONS: {
  value: DaycareMedicationStatus;
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  { value: "took_all", label: "Tomou tudo", icon: CheckCircle2, color: "#16a34a" }, // Verde
  { value: "with_food", label: "Com petisco", icon: CircleDot, color: "#ca8a04" }, // Amarelo
  { value: "refused", label: "Recusou", icon: XCircle, color: "#dc2626" }, // Vermelho
  { value: "not_needed", label: "Não precisou", icon: MinusCircle, color: "#64748b" }, // Cinza
];

const PEE_OPTIONS: { value: DaycarePeeStatus; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "little", label: "Pouco" },
  { value: "none", label: "Não fez" },
];

const POOP_OPTIONS: { value: DaycarePoopStatus; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "loose", label: "Pastoso" },
  { value: "none", label: "Não fez" },
];

const MOOD_OPTIONS: string[] = [
  "Brincalhão",
  "Calmo / Zen",
  "Dorminhoco",
  "Sociável",
  "Cheio de energia",
  "Carinhoso",
  "Cauteloso",
];

export default function DaycareReportSection({
  stay,
  appointment,
  onReportUpdated,
}: Props) {
  const { tenant } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Inicia colapsado/fechado por padrão
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<DaycareReportData>(() => stay.report_data || {});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza estado quando a estadia mudar
  useEffect(() => {
    setReport(stay.report_data || {});
  }, [stay.id, stay.report_data]);

  const updateMutation = useMutation({
    mutationFn: (newReport: DaycareReportData) =>
      updateDaycareStayReport(stay.id, newReport),
    onSuccess: (updated) => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["daycareStays"] });
      queryClient.invalidateQueries({ queryKey: ["daycareDaySummary"] });
      if (onReportUpdated) {
        onReportUpdated(updated);
      }
      setTimeout(() => setSaveStatus("idle"), 2500);
    },
    onError: () => {
      setSaveStatus("idle");
      toast.error("Erro ao salvar alterações no boletim");
    },
  });

  const triggerSave = (newData: DaycareReportData) => {
    setReport(newData);
    setSaveStatus("saving");
    updateMutation.mutate(newData);
  };

  const handleFeedingClick = (status: DaycareFeedingStatus) => {
    const nextStatus = report.feeding_status === status ? null : status;
    triggerSave({ ...report, feeding_status: nextStatus });
  };

  const handleMedicationClick = (status: DaycareMedicationStatus) => {
    const nextStatus = report.medication_status === status ? null : status;
    triggerSave({ ...report, medication_status: nextStatus });
  };

  const handlePeeClick = (status: DaycarePeeStatus) => {
    const nextStatus = report.pee_status === status ? null : status;
    triggerSave({ ...report, pee_status: nextStatus });
  };

  const handlePoopClick = (status: DaycarePoopStatus) => {
    const nextStatus = report.poop_status === status ? null : status;
    triggerSave({ ...report, poop_status: nextStatus });
  };

  const handleMoodToggle = (tag: string) => {
    const current = report.mood_tags || [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    triggerSave({ ...report, mood_tags: next });
  };

  const handleTextChange = (field: keyof DaycareReportData, value: string) => {
    const updated = { ...report, [field]: value };
    setReport(updated);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate(updated);
    }, 800);
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloadingPDF(true);
      const { pdf, fileName } = await generateDaycareReportPDF({
        tenant,
        stay: { ...stay, report_data: report },
        client: stay.client,
        pet: stay.pet,
        appointment,
      });
      pdf.save(fileName);
      toast.success("Boletim em PDF baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do boletim");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Identifica se há medicação registrada nas tarefas da estadia
  const medTasks = (stay.tasks || []).filter((t) => t.task_type === "medication");

  return (
    <Box
      sx={{
        mt: 2,
        pt: 1.5,
        borderTop: "1px dashed",
        borderColor: "divider",
      }}
    >
      {/* CABEÇALHO COLAPSÁVEL (VEM FECHADO POR PADRÃO) */}
      <Box
        onClick={() => setIsOpen((prev) => !prev)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: 1,
          cursor: "pointer",
          py: 0.75,
          px: 1,
          borderRadius: 1.5,
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
          <IconButton
            size="small"
            sx={{
              p: 0.25,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              color: "text.secondary",
              flexShrink: 0,
            }}
          >
            <ChevronDown size={18} />
          </IconButton>
          <FileText size={18} color="#f97316" style={{ flexShrink: 0 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Boletim Diário
          </Typography>

          {saveStatus === "saving" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.75, flexShrink: 0 }}>
              <CircularProgress size={11} color="primary" />
              <Typography variant="caption" color="text.secondary" fontSize="0.72rem" sx={{ whiteSpace: "nowrap" }}>
                Salvando...
              </Typography>
            </Box>
          )}
          {saveStatus === "saved" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.75, color: "#16a34a", flexShrink: 0 }}>
              <CheckCircle2 size={13} />
              <Typography variant="caption" fontWeight={600} fontSize="0.72rem" sx={{ whiteSpace: "nowrap" }}>
                Salvo
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={
              isDownloadingPDF ? (
                <CircularProgress size={12} color="inherit" />
              ) : (
                <FileDown size={14} />
              )
            }
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              py: 0.4,
              px: 1.2,
              borderRadius: 1.5,
              borderColor: "#fed7aa",
              color: "#ea580c",
              bgcolor: "#fff7ed",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "#ffedd5",
                borderColor: "#fdba74",
              },
            }}
          >
            Baixar PDF
          </Button>
        </Box>
      </Box>

      {/* CORPO EXPANSÍVEL DO BOLETIM */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, mt: 1.5, px: 0.5 }}>
          {/* 1. ALIMENTAÇÃO RÁPIDA (ÍCONES LUCIDE COLORIDOS) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Utensils size={15} color="#ea580c" />
                <Typography variant="body2" fontWeight={700} fontSize="0.8rem">
                  Alimentação Rápida
                </Typography>
              </Box>
              {stay.food_info && (
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Refeição: {stay.food_info}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
              {FEEDING_OPTIONS.map((opt) => {
                const isSelected = report.feeding_status === opt.value;
                const IconComponent = opt.icon;
                return (
                  <Box
                    key={opt.value}
                    onClick={() => handleFeedingClick(opt.value)}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: "1.5px solid",
                      borderColor: isSelected ? opt.color : "#E2E8F0",
                      bgcolor: isSelected ? alpha(opt.color, 0.1) : "white",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: opt.color,
                        bgcolor: alpha(opt.color, 0.05),
                      },
                    }}
                  >
                    <IconComponent size={18} color={opt.color} />
                    <Typography
                      variant="caption"
                      fontSize="0.72rem"
                      fontWeight={isSelected ? 700 : 500}
                      color={isSelected ? opt.color : "text.secondary"}
                      textAlign="center"
                      lineHeight={1.1}
                    >
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <TextField
              size="small"
              placeholder="Obs. rápida da alimentação (opcional)..."
              value={report.feeding_obs || ""}
              onChange={(e) => handleTextChange("feeding_obs", e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: {
                    fontSize: "0.8rem",
                    bgcolor: "white",
                    borderRadius: 1.5,
                  },
                },
              }}
            />
          </Box>

          {/* 2. MEDICAÇÃO RÁPIDA (ÍCONES LUCIDE COLORIDOS) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Pill size={15} color="#7C3AED" />
                <Typography variant="body2" fontWeight={700} fontSize="0.8rem">
                  Medicação
                </Typography>
              </Box>
              {medTasks.length > 0 && (
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {medTasks.map((t) => `${t.scheduled_time} - ${t.title}`).join(", ")}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
              {MEDICATION_OPTIONS.map((opt) => {
                const isSelected = report.medication_status === opt.value;
                const IconComponent = opt.icon;
                return (
                  <Box
                    key={opt.value}
                    onClick={() => handleMedicationClick(opt.value)}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: "1.5px solid",
                      borderColor: isSelected ? opt.color : "#E2E8F0",
                      bgcolor: isSelected ? alpha(opt.color, 0.1) : "white",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: opt.color,
                        bgcolor: alpha(opt.color, 0.05),
                      },
                    }}
                  >
                    <IconComponent size={18} color={opt.color} />
                    <Typography
                      variant="caption"
                      fontSize="0.72rem"
                      fontWeight={isSelected ? 700 : 500}
                      color={isSelected ? opt.color : "text.secondary"}
                      textAlign="center"
                      lineHeight={1.1}
                    >
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <TextField
              size="small"
              placeholder="Obs. da medicação (opcional)..."
              value={report.medication_obs || ""}
              onChange={(e) => handleTextChange("medication_obs", e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: {
                    fontSize: "0.8rem",
                    bgcolor: "white",
                    borderRadius: 1.5,
                  },
                },
              }}
            />
          </Box>

          {/* 3. NECESSIDADES FISIOLÓGICAS (XIXI & COCÔ SEM EMOJIS) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            {/* Card Xixi */}
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="body2" fontWeight={700} fontSize="0.78rem" color="text.secondary">
                XIXI
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75 }}>
                {PEE_OPTIONS.map((opt) => {
                  const isSelected = report.pee_status === opt.value;
                  return (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      size="small"
                      onClick={() => handlePeeClick(opt.value)}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        flex: 1,
                        fontSize: "0.72rem",
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected ? "#3b82f6" : "white",
                        color: isSelected ? "white" : "text.primary",
                        borderColor: isSelected ? "#3b82f6" : "#E2E8F0",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isSelected ? "#2563eb" : "#f1f5f9",
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Card Cocô */}
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography variant="body2" fontWeight={700} fontSize="0.78rem" color="text.secondary">
                COCÔ
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75 }}>
                {POOP_OPTIONS.map((opt) => {
                  const isSelected = report.poop_status === opt.value;
                  return (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      size="small"
                      onClick={() => handlePoopClick(opt.value)}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        flex: 1,
                        fontSize: "0.72rem",
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected ? "#92400e" : "white",
                        color: isSelected ? "white" : "text.primary",
                        borderColor: isSelected ? "#92400e" : "#E2E8F0",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isSelected ? "#78350f" : "#f1f5f9",
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* 4. HUMOR & COMPORTAMENTO (SEM EMOJIS) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Smile size={15} color="#db2777" />
              <Typography variant="body2" fontWeight={700} fontSize="0.8rem">
                Humor & Comportamento
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {MOOD_OPTIONS.map((tag) => {
                const isSelected = (report.mood_tags || []).includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => handleMoodToggle(tag)}
                    variant={isSelected ? "filled" : "outlined"}
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: isSelected ? 700 : 500,
                      bgcolor: isSelected ? "#f43f5e" : "white",
                      color: isSelected ? "white" : "text.primary",
                      borderColor: isSelected ? "#f43f5e" : "#E2E8F0",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: isSelected ? "#e11d48" : "#fdf2f8",
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* 5. RECADINHO DOS TIOS DA CRECHE */}
          <TextField
            size="small"
            label="Recadinho dos Tios da Creche"
            placeholder="Como foi o dia do pet, brincadeiras, carinhos, recado para o tutor..."
            multiline
            rows={2}
            value={report.caretaker_notes || ""}
            onChange={(e) => handleTextChange("caretaker_notes", e.target.value)}
            fullWidth
            slotProps={{
              input: {
                sx: { fontSize: "0.82rem", borderRadius: 1.5 },
              },
              inputLabel: {
                sx: { fontSize: "0.82rem" },
              },
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
