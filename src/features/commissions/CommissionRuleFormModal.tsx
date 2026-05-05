import {
  Autocomplete,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createCommissionRule, updateCommissionRule } from "../../api/services/commissions";
import type { CommissionRule, CommissionRuleFormData } from "./types";
import type { Employee } from "../employees/types";
import type { Service } from "../tenant_services/types";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../../theme";
dayjs.locale("pt-br");

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  commission_type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number<number>().min(0.01, "Valor deve ser maior que zero"),
  applies_to: z.enum(["service", "product", "both"]),
  employee_id: z.number().nullable().optional(),
  service_ids: z.array(z.number()),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean(),
});

type Props = {
  open: boolean;
  mode: "create" | "edit";
  rule?: CommissionRule;
  employees: Employee[];
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function CommissionRuleFormModal({
  open, mode, rule, employees, services, onClose, onSuccess,
}: Props) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<CommissionRuleFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      commission_type: "percentage",
      value: "" as unknown as number,
      applies_to: "service",
      employee_id: null,
      service_ids: [],
      valid_from: null,
      valid_until: null,
      is_active: true,
    },
  });

  const commissionType = watch("commission_type");

  useEffect(() => {
    if (open) {
      reset({
        name: rule?.name ?? "",
        commission_type: rule?.commission_type ?? "percentage",
        value: rule?.value ?? ("" as unknown as number),
        applies_to: rule?.applies_to ?? "service",
        employee_id: rule?.employee_id ?? null,
        service_ids: rule?.service_ids ?? [],
        valid_from: rule?.valid_from ?? null,
        valid_until: rule?.valid_until ?? null,
        is_active: rule?.is_active ?? true,
      });
    }
  }, [open, rule, reset]);

  const onSubmit = async (data: CommissionRuleFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
      };
      if (mode === "create") {
        await createCommissionRule(payload);
        toast.success("Regra de comissão criada com sucesso");
      } else {
        await updateCommissionRule(rule!.id, payload);
        toast.success("Regra atualizada com sucesso");
      }
      reset();
      onSuccess();
      onClose();
    } catch {
      toast.error(mode === "create" ? "Erro ao criar regra." : "Erro ao atualizar regra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const colStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    width: "47%",
  };

  return (
    <Dialog
      open={open}
      maxWidth={false}
      slotProps={{ paper: { sx: { width: "760px", maxWidth: "760px" } } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
        <Typography variant="h5">
          {mode === "create" ? "Nova Regra de Comissão" : "Editar Regra"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* ── ESQUERDA — Campos obrigatórios ────────────────────── */}
            <Box sx={colStyle}>
              <Box>
                <Typography variant="h6">Configuração</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos obrigatórios
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Nome da regra
                </FormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder='Ex: "Tosa grande — João"'
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Tipo de comissão
                </FormLabel>
                <Controller
                  name="commission_type"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} size="small">
                      <MenuItem value="percentage">Percentual (%)</MenuItem>
                      <MenuItem value="fixed">Valor fixo (R$)</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Valor
                </FormLabel>
                <Controller
                  name="value"
                  control={control}
                  render={({ field, fieldState }) => {
                    const numValue =
                      field.value !== undefined && field.value !== null && String(field.value) !== ""
                        ? Number(field.value)
                        : undefined;

                    const formattedValue =
                      numValue !== undefined
                        ? numValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "";

                    return (
                      <TextField
                        value={formattedValue}
                        size="small"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        placeholder="0,00"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                {commissionType === "percentage" ? "%" : "R$"}
                              </InputAdornment>
                            ),
                          },
                        }}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          field.onChange(
                            digits === "" ? undefined : Number(digits) / 100,
                          );
                        }}
                      />
                    );
                  }}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Aplica-se a
                </FormLabel>
                <Controller
                  name="applies_to"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} size="small">
                      <MenuItem value="service">Serviços</MenuItem>
                      <MenuItem value="product">Produtos</MenuItem>
                      <MenuItem value="both">Ambos</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Box>

            {/* ── DIREITA — Filtros e vigência (opcionais) ──────────── */}
            <Box sx={colStyle}>
              <Box>
                <Typography variant="h6">Filtros e Vigência</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos não obrigatórios
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Funcionário
                </FormLabel>
                <Controller
                  name="employee_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete<Employee>
                      options={employees.filter((e) => e.is_active)}
                      size="small"
                      value={employees.find((e) => e.id === field.value) ?? null}
                      getOptionLabel={(o) => o.name}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      onChange={(_, v) => field.onChange(v?.id ?? null)}
                      noOptionsText="Nenhum funcionário cadastrado"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Qualquer funcionário"
                        />
                      )}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Serviços
                </FormLabel>
                <Controller
                  name="service_ids"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete<Service, true>
                      multiple
                      options={services}
                      size="small"
                      value={services.filter((s) => field.value.includes(s.id))}
                      getOptionLabel={(o) => formatServiceLabel(o)}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      onChange={(_, v) => field.onChange(v.map((s) => s.id))}
                      noOptionsText="Nenhum serviço cadastrado"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={field.value.length === 0 ? "Qualquer serviço" : ""}
                        />
                      )}
                    />
                  )}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Válido de
                  </FormLabel>
                  <Controller
                    name="valid_from"
                    control={control}
                    render={({ field, fieldState }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(newDate) => {
                            if (newDate && newDate.isValid()) {
                              field.onChange(newDate.format("YYYY-MM-DD"));
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                              inputMode: "numeric",
                              sx: { backgroundColor: theme.palette.common.white },
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Válido até
                  </FormLabel>
                  <Controller
                    name="valid_until"
                    control={control}
                    render={({ field, fieldState }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(newDate) => {
                            if (newDate && newDate.isValid()) {
                              field.onChange(newDate.format("YYYY-MM-DD"));
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                              inputMode: "numeric",
                              sx: { backgroundColor: theme.palette.common.white },
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>
              </Box>

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Regra ativa"
                  />
                )}
              />
            </Box>
          </Box>

          <Divider sx={{ mt: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              Salvar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
