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
  const [errors, setErrors] = useState<{
    name?: string;
    price_cents?: string;
    frequency?: string;
  }>({});

  useEffect(() => {
    setErrors({});
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        price_cents: pkg.price_cents || 0,
        is_monthly: true,
        frequency: pkg.frequency ?? null,
        days_quantity: null,
        validity_days: null,
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
    if (cents > 0 && errors.price_cents) {
      setErrors((prev) => ({ ...prev, price_cents: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      name?: string;
      price_cents?: string;
      frequency?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome do pacote é obrigatório";
    }
    if (formData.price_cents <= 0) {
      newErrors.price_cents = "O preço deve ser maior que zero";
    }
    if (!formData.frequency) {
      newErrors.frequency = "Selecione a frequência semanal";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price_cents: formData.price_cents,
        is_monthly: true,
        frequency: formData.frequency,
        days_quantity: null,
        validity_days: null,
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
                  Nome do Pacote
                </FormLabel>
                <CustomTextField
                  placeholder="ex: Pacote Mensal 3x"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, name: val }));
                    if (val.trim() && errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                  Preço do Pacote
                </FormLabel>
                <TextField
                  value={rawPrice}
                  size="small"
                  placeholder="0,00"
                  error={!!errors.price_cents}
                  helperText={errors.price_cents}
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
                />
              </FormControl>
            </Grid>

            {/* Linha 2: Frequência Semanal */}
            <Grid size={{ xs: 12, sm: 12 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}>
                  Frequência Semanal
                </FormLabel>
                <TextField
                  select
                  size="small"
                  value={formData.frequency ?? ""}
                  error={!!errors.frequency}
                  helperText={errors.frequency}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                    },
                  }}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setFormData((prev) => ({
                      ...prev,
                      frequency: val,
                    }));
                    if (val && errors.frequency) {
                      setErrors((prev) => ({ ...prev, frequency: undefined }));
                    }
                  }}
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

            {/* Linha 3: Switch Pacote Ativo */}
            <Grid size={{ xs: 12, sm: 12 }}>
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
