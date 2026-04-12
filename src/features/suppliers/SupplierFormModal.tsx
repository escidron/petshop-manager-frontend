import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createSupplier, updateSupplier } from "../../api/services/suppliers";
import type { SupplierFormData, Supplier } from "./types";
import { useEffect } from "react";

const supplierSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  cnpj: z.string().nullable().optional(),
});

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
  initialName?: string;
  supplierToEdit?: Supplier;
};

export default function SupplierFormModal({
  open,
  onClose,
  onSuccess,
  initialName = "",
  supplierToEdit,
}: Props) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplierToEdit?.name || initialName,
      cnpj: supplierToEdit?.cnpj || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: supplierToEdit?.name || initialName,
        cnpj: supplierToEdit?.cnpj || "",
      });
    }
  }, [open, supplierToEdit, initialName, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setIsSubmitting(true);
      let supplier;
      if (supplierToEdit) {
        supplier = await updateSupplier(supplierToEdit.id, data);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        supplier = await createSupplier(data);
        toast.success("Fornecedor criado com sucesso!");
      }
      reset();
      onSuccess(supplier);
      onClose();
    } catch {
      toast.error("Erro ao criar fornecedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5">{supplierToEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ mb: 0.5, display: "block", color: "text.primary" }}>
              Nome do Fornecedor *
            </Typography>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="Nome Fantasia ou Razão Social"
                />
              )}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ mb: 0.5, display: "block", color: "text.primary" }}>
              CNPJ
            </Typography>
            <Controller
              name="cnpj"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="00.000.000/0000-00"
                />
              )}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Salvar Fornecedor
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
