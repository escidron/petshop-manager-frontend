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
} from "@mui/material";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createEmployee, updateEmployee } from "../../api/services/employees";
import type { Employee, EmployeeFormData } from "./types";

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  other: "Outro",
};

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  role: z.enum(["groomer", "vet", "salesperson", "other"]),
  phone: z.string().nullable().optional(),
  email: z.string().email("E-mail inválido").nullable().optional().or(z.literal("")),
  is_active: z.boolean(),
});

type Props = {
  open: boolean;
  mode: "create" | "edit";
  employee?: Employee;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EmployeeFormModal({ open, mode, employee, onClose, onSuccess }: Props) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm<EmployeeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      role: "other",
      phone: "",
      email: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: employee?.name ?? "",
        role: employee?.role ?? "other",
        phone: employee?.phone ?? "",
        email: employee?.email ?? "",
        is_active: employee?.is_active ?? true,
      });
    }
  }, [open, employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = { ...data, email: data.email || null, phone: data.phone || null };
      if (mode === "create") {
        await createEmployee(payload);
        toast.success("Funcionário cadastrado com sucesso");
      } else {
        await updateEmployee(employee!.id, payload);
        toast.success("Funcionário atualizado com sucesso");
      }
      reset();
      onSuccess();
      onClose();
    } catch {
      toast.error(mode === "create" ? "Erro ao cadastrar funcionário." : "Erro ao atualizar funcionário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} maxWidth={false} slotProps={{ paper: { sx: { width: "500px", maxWidth: "500px" } } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
        <Typography variant="h5">
          {mode === "create" ? "Novo Funcionário" : "Editar Funcionário"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Divider />

          <FormControl fullWidth>
            <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Nome completo"
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>Cargo</FormLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} size="small">
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Telefone</FormLabel>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="(11) 99999-9999"
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>E-mail</FormLabel>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="email@exemplo.com"
                />
              )}
            />
          </FormControl>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Ativo"
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
