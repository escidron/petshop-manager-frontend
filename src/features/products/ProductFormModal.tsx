import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import axios from "axios";

import { createProduct, updateProduct } from "../../api/services/products";
import ProductForm from "./ProductForm";
import { useToast } from "../../hooks/useToast";
import type { Product, ProductFormData } from "./types";
import { productToFormData } from "./mapper";
import { DEFAULT_PRODUCT_FORM } from "./constants";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  onSuccess: (product: Product) => void;
};

export default function ProductFormModal({
  open,
  mode,
  product,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo(() => {
    return product ? productToFormData(product) : DEFAULT_PRODUCT_FORM;
  }, [product]);

  const handleSubmit = async (data: ProductFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const saved =
        mode === "create"
          ? await createProduct(data)
          : await updateProduct(product!.id, data);

      toast.success(
        mode === "create"
          ? "Produto cadastrado com sucesso"
          : "Produto atualizado com sucesso",
      );

      onSuccess(saved);
      onClose();
    } catch (error) {
      let message =
        mode === "create"
          ? "Erro ao cadastrar produto."
          : "Erro ao atualizar produto.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      toast.error(message);
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
            width: showAdditionalInfo ? "85%" : "500px",
            maxWidth: "1200px",
            minWidth: showAdditionalInfo ? "1200px" : "500px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Produto" : "Editar Produto"}
        </Typography>
        <Box sx={{ cursor: "pointer" }} onClick={onClose}>
          <X size={24} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <ProductForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showAdditionalInfo={showAdditionalInfo}
          setShowAdditionalInfo={setShowAdditionalInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
