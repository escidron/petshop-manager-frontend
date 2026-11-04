import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Typography,
  Switch,
  FormControl,
  FormLabel,
  FormControlLabel,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { X } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { formatBRLFromCents } from "../../utils/masks";
import {
  createDaycarePackage,
  updateDaycarePackage,
} from "../../api/services/daycare";
import type { DaycarePackage, DaycarePackageFormData } from "./types";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  pkg?: DaycarePackage | null;
  onClose: () => void;
  onSuccess: (saved: DaycarePackage) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 1, label: "1x na semana" },
  { value: 2, label: "2x na semana" },
  { value: 3, label: "3x na semana" },
  { value: 4, label: "4x na semana" },
  { value: 5, label: "5x na semana" },
  { value: 6, label: "6x na semana" },
  { value: 7, label: "7x na semana" },
];

export default function DaycarePackageFormModal({
  open,
  mode,
  pkg,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [formData, setFormData] = useState<DaycarePackageFormData>({
    name: "",
    price_cents: 0,
    is_monthly: true,
    frequency: null,
    days_quantity: null,
    validity_days: null,
    is_active: true,
  });

  const [rawPrice, setRawPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        price_cents: pkg.price_cents || 0,
        is_monthly: pkg.is_monthly ?? true,
        frequency: pkg.frequency ?? null,
        days_quantity: pkg.days_quantity ?? null,
        validity_days: pkg.validity_days ?? null,
        is_active: pkg.is_active ?? true,
      });
      setRawPrice(pkg.price_cents ? formatBRLFromCents(pkg.price_cents) : "");
    } else {
      setFormData({
        name: "",
        price_cents: 0,
        is_monthly: true,
        frequency: null,
        days_quantity: null,
        validity_days: null,
        is_active: true,
      });
      setRawPrice("");
    }
  }, [pkg, open]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (!rawDigits) {
      setRawPrice("");
      setFormData((prev) => ({ ...prev, price_cents: 0 }));
      return;
    }
    const cents = parseInt(rawDigits, 10);
    setRawPrice(formatBRLFromCents(cents));
    setFormData((prev) => ({ ...prev, price_cents: cents }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Informe o nome do pacote.");
      return;
    }
    if (formData.price_cents <= 0) {
      toast.error("Informe um preço válido para o pacote.");
      return;
    }
    if (formData.is_monthly && !formData.frequency) {
      toast.error("Selecione a frequência semanal.");
      return;
    }
    if (!formData.is_monthly && (!formData.days_quantity || formData.days_quantity <= 0)) {
      toast.error("Informe a quantidade de diárias do pacote.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price_cents: formData.price_cents,
        is_monthly: formData.is_monthly,
        frequency: formData.is_monthly ? formData.frequency : null,
        days_quantity: !formData.is_monthly ? formData.days_quantity : null,
        validity_days: !formData.is_monthly ? formData.validity_days : null,
        is_active: formData.is_active,
      };

      const saved =
        mode === "create"
          ? await createDaycarePackage(payload)
          : await updateDaycarePackage(pkg!.id, payload);

      toast.success(
        mode === "create"
          ? "Pacote criado com sucesso!"
          : "Pacote atualizado com sucesso!"
      );
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Erro ao salvar o pacote.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 3 },
            maxHeight: { xs: "100dvh", md: "90vh" },
            height: { xs: "100dvh", md: "auto" },
          },
        },
      }}
    >
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
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {pkg ? "Editar Pacote" : "Novo Pacote"}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 },
            pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
          }}
        >
          <Grid container spacing={2.5}>
            {/* Linha 1: Nome do Pacote (8) + Preço (4) */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                  Nome do Pacote *
                </FormLabel>
                <CustomTextField
                  placeholder={
                    formData.is_monthly
                      ? "ex: Pacote Mensal 5x"
                      : "ex: Cartela 10 Diárias"
                  }
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  fullWidth
                  required
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                  Preço do Pacote *
                </FormLabel>
                <TextField
                  value={rawPrice}
                  size="small"
                  placeholder="0,00"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography
                            sx={{
                              color: "text.disabled",
                              fontWeight: 500,
                              mt: "2px",
                            }}
                          >
                            R$
                          </Typography>
                        </InputAdornment>
                      ),
                    },
                  }}
                  onChange={handlePriceChange}
                  fullWidth
                  required
                />
              </FormControl>
            </Grid>

            {/* Linha 2: Frequência (se mensal) OU Diárias + Validade (se avulso) */}
            {formData.is_monthly ? (
              <Grid size={{ xs: 12, sm: 12 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                    Frequência Semanal *
                  </FormLabel>
                  <TextField
                    select
                    size="small"
                    value={formData.frequency ?? ""}
                    slotProps={{
                      select: {
                        displayEmpty: true,
                      },
                    }}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        frequency: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    fullWidth
                  >
                    <MenuItem value="" disabled sx={{ color: "text.disabled" }}>
                      Selecione a frequência...
                    </MenuItem>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                      Quantidade de Diárias *
                    </FormLabel>
                    <TextField
                      type="number"
                      size="small"
                      placeholder="ex: 10"
                      value={formData.days_quantity ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          days_quantity: e.target.value
                            ? parseInt(e.target.value, 10)
                            : null,
                        }))
                      }
                      fullWidth
                      slotProps={{
                        htmlInput: { min: 1 },
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                      Validade (dias)
                    </FormLabel>
                    <TextField
                      type="number"
                      size="small"
                      placeholder="ex: 30"
                      helperText="Deixe vazio para validade infinita"
                      value={formData.validity_days ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validity_days: e.target.value
                            ? parseInt(e.target.value, 10)
                            : null,
                        }))
                      }
                      fullWidth
                    />
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Linha 3: Switches com layout espaçado e claro */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_monthly}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_monthly: e.target.checked,
                        frequency: null,
                        days_quantity: null,
                        validity_days: null,
                      }))
                    }
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500} color="text.primary">
                    Pacote Mensal Recorrente
                  </Typography>
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500} color="text.primary">
                    Pacote Ativo para Vendas
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            gap: 1.5,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > button": {
              width: { xs: "100%", sm: "auto" },
              minHeight: 44,
              borderRadius: 2,
            },
          }}
        >
          <Button onClick={onClose} variant="text" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{ fontWeight: 700 }}
          >
            {pkg ? "Atualizar" : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
