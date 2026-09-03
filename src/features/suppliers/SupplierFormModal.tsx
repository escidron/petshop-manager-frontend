import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Typography,
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
import { createSupplier, updateSupplier } from "../../api/services/suppliers";
import type { SupplierFormData, Supplier } from "./types";
import { maskCnpj, maskPhone } from "../../utils/masks";

const supplierSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  cnpj: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, "").length === 14, {
      message: "CNPJ deve ter 14 dígitos",
    }),
  phone_1: z.string().nullable().optional(),
  phone_2: z.string().nullable().optional(),
  email: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "E-mail inválido",
    }),
});

type Props = {
  open: boolean;
  mode: "create" | "edit";
  supplier?: Supplier;
  initialName?: string;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
};

export default function SupplierFormModal({
  open,
  mode,
  supplier,
  initialName = "",
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { control, handleSubmit, reset } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || initialName,
      cnpj: supplier?.cnpj || "",
      phone_1: supplier?.phone_1 || "",
      phone_2: supplier?.phone_2 || "",
      email: supplier?.email || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: supplier?.name || initialName,
        cnpj: supplier?.cnpj || "",
        phone_1: supplier?.phone_1 || "",
        phone_2: supplier?.phone_2 || "",
        email: supplier?.email || "",
      });
    }
  }, [open, supplier, initialName, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const saved =
        mode === "create"
          ? await createSupplier(data)
          : await updateSupplier(supplier!.id, data);

      toast.success(
        mode === "create"
          ? "Fornecedor cadastrado com sucesso"
          : "Fornecedor atualizado com sucesso",
      );

      onSuccess(saved);
      onClose();
    } catch {
      toast.error(
        mode === "create" ? "Erro ao cadastrar fornecedor." : "Erro ao atualizar fornecedor.",
      );
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
            width: { xs: "100%", md: "550px" },
            maxWidth: { xs: "100%", md: "550px" },
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
          {mode === "create" ? "Novo Fornecedor" : "Editar Fornecedor"}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth>
              <FormLabel required sx={{ color: "text.primary", mb: 0.5 }}>
                Nome do Fornecedor
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
                    placeholder="Nome Fantasia ou Razão Social"
                  />
                )}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                CNPJ
              </FormLabel>
              <Controller
                name="cnpj"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                  />
                )}
              />
            </FormControl>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Telefone Contato 1
                </FormLabel>
                <Controller
                  name="phone_1"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Telefone Contato 2
                </FormLabel>
                <Controller
                  name="phone_2"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    />
                  )}
                />
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                E-mail
              </FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="email@fornecedor.com"
                  />
                )}
              />
            </FormControl>
          </Box>
          <Divider sx={{ mt: 1 }} />
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 0.5,
            }}
          >
            <Button
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                minHeight: 44,
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              Salvar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
