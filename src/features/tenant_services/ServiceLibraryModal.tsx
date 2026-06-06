import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { X, ChevronRight, ChevronLeft, Library, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createService } from "../../api/services/tenant_services";
import { PREDEFINED_SERVICES_MATRIX } from "./predefinedServices";
import { PET_SIZES, COAT_TYPES } from "../pets/constants";
import { formatBRLFromCents } from "../../utils/masks";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

interface GeneratedServiceItem {
  key: string;
  name: string;
  description: string;
  species: "Canino" | "Felino" | "Exotico";
  size: "PP" | "P" | "M" | "G" | "GG";
  coat_type: string;
  price_cents: number;
  duration_minutes: number;
  selected: boolean;
}

const SIZE_LABEL_MAP: Record<string, string> = {
  PP: "Muito pequeno (PP)",
  P: "Pequeno (P)",
  M: "Médio (M)",
  G: "Grande (G)",
  GG: "Gigante (GG)",
};

const SIZE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  PP: { bg: "#f1f5f9", text: "#475569" }, // Slate/Grey
  P: { bg: "#dcfce7", text: "#166534" },  // Green
  M: { bg: "#dbeafe", text: "#1e40af" },  // Blue
  G: { bg: "#fef3c7", text: "#92400e" },  // Amber/Orange
  GG: { bg: "#f3e8ff", text: "#6b21a8" }, // Purple
};

const SPECIES_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Canino: { bg: "#ffedd5", text: "#9a3412" }, // Orange/Brown
  Felino: { bg: "#fae8ff", text: "#86198f" },  // Pink/Magenta
};

export default function ServiceLibraryModal({ open, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Selections
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "banho",
    "banho_tosa",
    "tosa_higienca",
  ]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(["Canino", "Felino"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["PP", "P", "M", "G", "GG"]);
  const [selectedCoatTypes, setSelectedCoatTypes] = useState<string[]>([]);

  // Step 2 Rows
  const [generatedRows, setGeneratedRows] = useState<GeneratedServiceItem[]>([]);

  // Toggle helpers
  const handleToggleService = (key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleToggleSpecies = (val: string) => {
    setSelectedSpecies((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleToggleSize = (val: string) => {
    setSelectedSizes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleToggleCoatType = (val: string) => {
    setSelectedCoatTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  // Generate matrix
  const handleNext = () => {
    if (selectedServices.length === 0) {
      toast.error("Selecione pelo menos um serviço base.");
      return;
    }
    if (selectedSpecies.length === 0) {
      toast.error("Selecione pelo menos uma espécie.");
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error("Selecione pelo menos um porte.");
      return;
    }

    const rows: GeneratedServiceItem[] = [];

    selectedServices.forEach((serviceKey) => {
      const template = PREDEFINED_SERVICES_MATRIX[serviceKey];
      if (!template) return;

      selectedSpecies.forEach((species) => {
        selectedSizes.forEach((size) => {
          // Check if default values exist in matrix for this combination
          const speciesData = template.defaults[species];
          if (!speciesData) return;
          const sizeData = speciesData[size];
          if (!sizeData) return;

          // If coat types are selected, generate combinations for each
          if (selectedCoatTypes.length > 0) {
            selectedCoatTypes.forEach((coatValue) => {
              const coatOption = COAT_TYPES.find((c) => c.value === coatValue);
              const coatLabel = coatOption ? coatOption.label : "";

              // Apply multipliers/offsets for coat types (price defaults to 0)
              let price_cents = 0;
              let duration_minutes = sizeData.duration_minutes;

              if (coatValue === "medium") {
                duration_minutes += 10;
              } else if (coatValue === "long") {
                duration_minutes += 15;
              } else if (coatValue === "double") {
                duration_minutes += 20;
              } else if (coatValue === "hairless") {
                duration_minutes = Math.max(15, duration_minutes - 10);
              }

              const displayName = `${template.name} - ${species} ${size} [Pelo ${coatLabel}]`;
              const sizeLabel = SIZE_LABEL_MAP[size] || size;
              const generatedDesc = `${template.name} para ${species} de porte ${sizeLabel} com pelagem ${coatLabel.toLowerCase()}`;

              rows.push({
                key: `${serviceKey}-${species}-${size}-${coatValue}`,
                name: displayName,
                description: generatedDesc,
                species: species as "Canino" | "Felino" | "Exotico",
                size: size as "PP" | "P" | "M" | "G" | "GG",
                coat_type: coatValue,
                price_cents,
                duration_minutes,
                selected: true,
              });
            });
          } else {
            // Generate standard combinations without coat type specifier
            const displayName = `${template.name} - ${species} ${size}`;
            const sizeLabel = SIZE_LABEL_MAP[size] || size;
            const generatedDesc = `${template.name} para ${species} de porte ${sizeLabel}`;

            rows.push({
              key: `${serviceKey}-${species}-${size}-none`,
              name: displayName,
              description: generatedDesc,
              species: species as "Canino" | "Felino" | "Exotico",
              size: size as "PP" | "P" | "M" | "G" | "GG",
              coat_type: "",
              price_cents: 0,
              duration_minutes: sizeData.duration_minutes,
              selected: true,
            });
          }
        });
      });
    });

    if (rows.length === 0) {
      toast.warning("Nenhuma combinação encontrada para os filtros selecionados.");
      return;
    }

    setGeneratedRows(rows);
    setStep(2);
  };

  const handleRowChange = (index: number, field: keyof GeneratedServiceItem, value: any) => {
    setGeneratedRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value } as GeneratedServiceItem;
      return copy;
    });
  };

  const handleToggleAllRows = (checked: boolean) => {
    setGeneratedRows((prev) => prev.map((row) => ({ ...row, selected: checked })));
  };

  const handleSave = async () => {
    const activeRows = generatedRows.filter((r) => r.selected);
    if (activeRows.length === 0) {
      toast.error("Selecione pelo menos um serviço da lista para cadastrar.");
      return;
    }

    // Validação: Preço deve ser preenchido (maior que zero) para serviços selecionados
    const zeroPriceRows = activeRows.filter((r) => r.price_cents === 0);
    if (zeroPriceRows.length > 0) {
      toast.error("Defina o preço (maior que R$ 0,00) para todos os serviços selecionados.");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const row of activeRows) {
      try {
        await createService({
          name: row.name,
          description: row.description,
          price_cents: row.price_cents,
          duration_minutes: row.duration_minutes,
          species: row.species,
          size: row.size,
          coat_type: row.coat_type,
          is_active: true,
        });
        successCount++;
      } catch (err: any) {
        errors.push(`${row.name}: ${err.response?.data?.detail || "Erro desconhecido"}`);
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(`${successCount} serviços importados com sucesso!`);
      onSuccess();
      onClose();
    }

    if (errors.length > 0) {
      toast.error(`Houve erro ao importar ${errors.length} serviços. Verifique duplicidades.`);
    }
  };

  // Checkbox theme color styling config
  const checkboxSx = {
    color: "primary.main",
    "&.Mui-checked": {
      color: "primary.main",
    },
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Library size={22} color="#1976d2" />
          <Typography variant="h6" fontWeight="bold">Assistente de Cadastro em Massa</Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSubmitting}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {step === 1 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
              Selecione as variações que deseja disponibilizar em seu catálogo. O sistema gerará a grade de combinações automaticamente.
              <br />
              <strong>Exemplo:</strong> Se você marcar o serviço <em>Banho</em>, a espécie <em>Canino</em>, o porte <em>P</em> e a pelagem <em>Longa</em>, criaremos o serviço <strong>"Banho - Canino P [Pelo Longo]"</strong>. No próximo passo, você define o preço e o tempo de cada um.
            </Alert>
            {/* Primeira Fila: Serviços Base, Espécies e Portes (Sempre 3 colunas em telas de tablet/desktop) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr 1fr",
                },
                gap: 2,
                mb: 2,
              }}
            >
              {/* Card 1: Serviços Base */}
              <Box
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                  1. Serviços Base
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ display: "block", mb: 2, opacity: 0.8 }}>
                  Selecione quais tipos de procedimentos você realiza
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  {Object.entries(PREDEFINED_SERVICES_MATRIX).map(([key, item]) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox
                          checked={selectedServices.includes(key)}
                          onChange={() => handleToggleService(key)}
                          sx={checkboxSx}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="600" color="text.primary">
                          {item.name}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </Box>

              {/* Card 2: Espécies */}
              <Box
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                  2. Espécies
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ display: "block", mb: 2, opacity: 0.8 }}>
                  Selecione as espécies de animais atendidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  {["Canino", "Felino"].map((species) => (
                    <FormControlLabel
                      key={species}
                      control={
                        <Checkbox
                          checked={selectedSpecies.includes(species)}
                          onChange={() => handleToggleSpecies(species)}
                          sx={checkboxSx}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.primary">
                          {species}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </Box>

              {/* Card 3: Portes */}
              <Box
                sx={{
                  p: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                  3. Portes
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ display: "block", mb: 2, opacity: 0.8 }}>
                  Selecione os portes de animais atendidos
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  {PET_SIZES.map((item) => (
                    <FormControlLabel
                      key={item.value}
                      control={
                        <Checkbox
                          checked={selectedSizes.includes(item.value)}
                          onChange={() => handleToggleSize(item.value)}
                          sx={checkboxSx}
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.primary">
                          {item.label}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Segunda Fila: Tipo de Pelagem (Sempre ocupa a largura total embaixo) */}
            <Box
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                bgcolor: "background.paper",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
                4. Tipo de Pelagem (Opcional)
              </Typography>
              <Typography variant="caption" color="text.primary" sx={{ display: "block", mb: 2, opacity: 0.8 }}>
                Marque apenas se quiser preços diferenciados por tipo de pelo
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexWrap="wrap" gap={3}>
                {COAT_TYPES.map((c) => (
                  <FormControlLabel
                    key={c.value}
                    control={
                      <Checkbox
                        checked={selectedCoatTypes.includes(c.value)}
                        onChange={() => handleToggleCoatType(c.value)}
                        sx={checkboxSx}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.primary">
                        {c.label}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                  Ajuste os Preços e Tempos de Execução
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
                  Você poderá editar, cadastrar novos serviços ou excluir procedimentos do seu catálogo a qualquer momento depois.
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={generatedRows.every((r) => r.selected)}
                    indeterminate={
                      generatedRows.some((r) => r.selected) &&
                      !generatedRows.every((r) => r.selected)
                    }
                    onChange={(e) => handleToggleAllRows(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label={
                  <Typography variant="body2" color="text.primary">
                    Selecionar Todos
                  </Typography>
                }
              />
            </Box>

            <Box sx={{ maxHeight: "450px", overflowY: "auto", pr: 1 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                {generatedRows.map((row, idx) => (
                  <Box
                    key={row.key}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 1.5,
                      border: "1px solid",
                      borderColor: row.selected ? "primary.main" : "divider",
                      borderRadius: 3,
                      bgcolor: row.selected ? "background.paper" : "action.hover",
                      opacity: row.selected ? 1 : 0.6,
                      transition: "all 0.2s ease-in-out",
                      boxShadow: row.selected ? "0 2px 8px rgba(25, 118, 210, 0.05)" : "none",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }
                    }}
                  >
                    <Checkbox
                      checked={row.selected}
                      onChange={(e) => handleRowChange(idx, "selected", e.target.checked)}
                      sx={{ p: 0, ...checkboxSx }}
                    />

                    {/* Service Info */}
                    <Box flexGrow={1} minWidth={0} display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="body2" fontWeight="bold" color="text.primary">
                        {row.name.split(" - ")[0]}
                      </Typography>
                      
                      {/* Descrição em formato de frase com Badges/Chips coloridos embutidos */}
                      <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                        <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                          Procedimento para
                        </Typography>
                        <Box
                          sx={{
                            fontSize: "11.5px",
                            fontWeight: "bold",
                            px: 1,
                            py: 0.3,
                            borderRadius: "4px",
                            bgcolor: SPECIES_BADGE_COLORS[row.species]?.bg || "action.hover",
                            color: SPECIES_BADGE_COLORS[row.species]?.text || "text.primary",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {row.species}
                        </Box>
                        
                        <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                          de porte
                        </Typography>
                        <Box
                          sx={{
                            fontSize: "11.5px",
                            fontWeight: "bold",
                            px: 1,
                            py: 0.3,
                            borderRadius: "4px",
                            bgcolor: SIZE_BADGE_COLORS[row.size]?.bg || "action.hover",
                            color: SIZE_BADGE_COLORS[row.size]?.text || "text.primary",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {SIZE_LABEL_MAP[row.size] || row.size}
                        </Box>

                        {row.coat_type && (
                          <>
                            <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                              com pelagem
                            </Typography>
                            <Box
                              sx={{
                                fontSize: "11.5px",
                                fontWeight: "bold",
                                px: 1,
                                py: 0.3,
                                borderRadius: "4px",
                                bgcolor: "#e2e8f0",
                                color: "#334155",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {COAT_TYPES.find(c => c.value === row.coat_type)?.label || row.coat_type}
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Price input */}
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: "10px", fontWeight: "bold" }}>
                        Preço
                      </Typography>
                      <TextField
                        size="small"
                        disabled={!row.selected}
                        value={formatBRLFromCents(row.price_cents)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          handleRowChange(idx, "price_cents", digits === "" ? 0 : Number(digits));
                        }}
                        sx={{ width: 105 }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start" sx={{ mr: 0.5 }}>
                                <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "11px" }}>
                                  R$
                                </Typography>
                              </InputAdornment>
                            ),
                          }
                        }}
                      />
                    </Box>

                    {/* Duration input */}
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: "10px", fontWeight: "bold" }}>
                        Duração
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        disabled={!row.selected}
                        value={row.duration_minutes || ""}
                        placeholder="0"
                        onChange={(e) => handleRowChange(idx, "duration_minutes", parseInt(e.target.value) || 0)}
                        sx={{ width: 85 }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end" sx={{ ml: 0.5 }}>
                                <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "11px" }}>
                                  min
                                </Typography>
                              </InputAdornment>
                            ),
                          }
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        {step === 1 ? (
          <>
            <Button variant="text" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              endIcon={<ChevronRight size={18} />}
              onClick={handleNext}
              disabled={selectedServices.length === 0 || selectedSpecies.length === 0 || selectedSizes.length === 0}
            >
              Gerar Serviços
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="text"
              startIcon={<ChevronLeft size={18} />}
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button
              color="success"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={18} />}
              onClick={handleSave}
              disabled={isSubmitting || generatedRows.filter((r) => r.selected).length === 0}
            >
              {isSubmitting ? "Importando..." : `Cadastrar ${generatedRows.filter((r) => r.selected).length} Serviços`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
