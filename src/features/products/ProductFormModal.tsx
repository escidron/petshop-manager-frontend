import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";

import { Button } from "../../components/Button/Button";

import type { ProductFormData } from "./ProductForm";
import type { Product } from "../../pages/ProductsPage";
import { DEFAULT_PRODUCT_FORM } from "./constants";
import { createProduct, updateProduct } from "../../api/services/products";
import ProductForm from "./ProductForm";
import { useToast } from "../../hooks/useToast";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  product?: Product;
  productForm: ProductFormData;
  setProductForm: (data: ProductFormData) => void;
  onClose: () => void;
  onSuccess: (product: Product) => void;
};

export default function ProductFormModal({
  open,
  mode,
  product,
  productForm,
  setProductForm,
  onClose,
  onSuccess,
}: Props) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (mode === "edit" && product) {
      setProductForm({
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        price: product.price,
        cost: product.cost,
        quantity: product.quantity,
        min_stock: product.min_stock,
      });
    }

    if (mode === "create") {
      setProductForm(DEFAULT_PRODUCT_FORM);
    }
  }, [mode, product, setProductForm]);

  const handleSave = async () => {
    if (!productForm.name.trim()) return;

    try {
      setSaving(true);

      if (mode === "create") {
        const createdProduct = await createProduct({
          ...productForm,
        });

        onSuccess(createdProduct);
        toast.success("Produto cadastrado com sucesso");
      }

      if (mode === "edit" && product) {
        const updated = await updateProduct(product.id, productForm);
        onSuccess(updated);
        toast.success("Produto atualizado com sucesso");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Cadastrar produto" : "Editar produto"}
      </DialogTitle>

      <DialogContent>
        <ProductForm product={productForm} onChange={setProductForm} />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button variant="text" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button onClick={handleSave} loading={saving}>
          {mode === "create" ? "Salvar" : "Atualizar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
