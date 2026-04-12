import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
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
import { createSupplier, updateSupplier } from "../../api/services/suppliers";
import type { SupplierFormData, Supplier } from "./types";
import { maskCnpj } from "../../utils/masks";

const supplierSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  cnpj: z.string().nullable().optional(),
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

  const { control, handleSubmit, reset } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || initialName,
      cnpj: supplier?.cnpj || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: supplier?.name || initialName,
        cnpj: supplier?.cnpj || "",
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

      reset();
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
      slotProps={{
        paper: {
          sx: {
            width: "500px",
            maxWidth: "500px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Fornecedor" : "Editar Fornecedor"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Divider />
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
          </Box>
          <Divider sx={{ mt: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              Salvar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
