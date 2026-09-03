import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: showAdditionalInfo ? "85%" : "500px" },
            maxWidth: { xs: "100%", md: "1200px" },
            minWidth: { xs: "unset", md: showAdditionalInfo ? "750px" : "450px" },
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
          {mode === "create" ? "Novo Produto" : "Editar Produto"}
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
