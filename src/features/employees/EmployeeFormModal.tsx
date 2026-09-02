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
  IconButton,
  useTheme,
  useMediaQuery,
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
import { maskPhone } from "../../utils/masks";

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  bather: "Banhista",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Entregador/Motorista",
  other: "Outro",
};

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  role: z.enum(["groomer", "bather", "vet", "salesperson", "receptionist", "driver", "other"]),
  phone: z.string().min(1, "Telefone obrigatório"),
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
      const payload = { ...data, email: data.email || null, phone: data.phone };
      if (mode === "create") {
        await createEmployee(payload);
        toast.success("Funcionário cadastrado com sucesso");
      } else {
        await updateEmployee(employee!.id, payload);
        toast.success("Funcionário atualizado com sucesso");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(mode === "create" ? "Erro ao cadastrar funcionário." : "Erro ao atualizar funcionário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={false}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: "500px" },
            maxWidth: { xs: "100%", md: "500px" },
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
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {mode === "create" ? "Novo Funcionário" : "Editar Funcionário"}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
        }}
      >
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>
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
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cargo</FormLabel>
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
                  onChange={(e) => field.onChange(maskPhone(e.target.value))}
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>E-mail (Opcional)</FormLabel>
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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 0.5,
              "& > button": {
                width: { xs: "100%", sm: "auto" },
                minHeight: 44,
                borderRadius: 2,
              },
            }}
          >
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              sx={{ fontWeight: 700 }}
            >
              Salvar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
