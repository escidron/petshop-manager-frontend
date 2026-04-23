import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
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

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  employee_id: z.number().nullable().optional(),
  service_id: z.number().nullable().optional(),
  applies_to: z.enum(["service", "product", "both"]),
  commission_type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  priority: z.coerce.number().int().min(1),
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
      employee_id: null,
      service_id: null,
      applies_to: "service",
      commission_type: "percentage",
      value: 10,
      priority: 100,
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
        employee_id: rule?.employee_id ?? null,
        service_id: rule?.service_id ?? null,
        applies_to: rule?.applies_to ?? "service",
        commission_type: rule?.commission_type ?? "percentage",
        value: rule?.value ?? 10,
        priority: rule?.priority ?? 100,
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

  return (
    <Dialog open={open} maxWidth={false} slotProps={{ paper: { sx: { width: "560px", maxWidth: "560px" } } }}>
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

          <FormControl fullWidth>
            <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Nome da regra</FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder='Ex: "Tosa grande - João"'
                />
              )}
            />
          </FormControl>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Funcionário (opcional)</FormLabel>
              <Controller
                name="employee_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    size="small"
                    displayEmpty
                  >
                    <MenuItem value=""><em>Qualquer funcionário</em></MenuItem>
                    {employees.filter((e) => e.is_active).map((e) => (
                      <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Serviço (opcional)</FormLabel>
              <Controller
                name="service_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    size="small"
                    displayEmpty
                  >
                    <MenuItem value=""><em>Qualquer serviço</em></MenuItem>
                    {services.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Aplica-se a</FormLabel>
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

            <FormControl fullWidth>
              <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Tipo de comissão</FormLabel>
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
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Valor</FormLabel>
              <Controller
                name="value"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {commissionType === "percentage" ? "%" : "R$"}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Prioridade</FormLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Menor = mais prioritário"}
                  />
                )}
              />
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Válido de</FormLabel>
              <Controller
                name="valid_from"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    value={field.value ?? ""}
                    type="date"
                    fullWidth
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Válido até</FormLabel>
              <Controller
                name="valid_until"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    value={field.value ?? ""}
                    type="date"
                    fullWidth
                  />
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
