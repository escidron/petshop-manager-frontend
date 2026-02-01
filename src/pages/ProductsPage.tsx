import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ProductFormData } from "../features/products/ProductForm";
import { DEFAULT_PRODUCT_FORM } from "../features/products/constants";
import { useProducts } from "../hooks/useProducts";
import ProductFormModal from "../features/products/ProductFormModal";
import ProductDeleteModal from "../features/products/ProductToDeleteModal";
import ProductsToolbar from "../features/products/ProductsToolbar";
import ProductsTable from "../features/products/ProductsTable";
import { deleteProduct } from "../api/services/products";

export type Product = {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantity: number;
  min_stock: number;
  is_active: boolean;
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(DEFAULT_PRODUCT_FORM);

  const [productModal, setProductModal] = useState<{
    open: boolean;
    mode?: "create" | "edit";
    product?: Product;
  }>({ open: false, mode: "create" });
  const { products, loading, getProducts } = useProducts();
  const navigate = useNavigate();

  const filteredRows = useMemo(() => {
    if (!search) return products;

    const term = search.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }, [products, search]);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await deleteProduct(productToDelete.id);
      await getProducts();
      setProductToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
      <ProductsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setProductModal({ open: true, mode: "create" })}
      />

      <ProductsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/pets/${id}`)}
        onEdit={(product) => setProductModal({ open: true, mode: "edit", product })}
        onDelete={(pet) => setProductToDelete(pet)}
      />

      {/* Create / Edit Modal */}
      {productModal.open && (
        <ProductFormModal
          open
          mode={productModal.mode ? productModal.mode : "create"}
          product={productModal.mode === "edit" ? productModal.product : undefined}
          onClose={() => setProductModal({ open: false })}
          onSuccess={() => {
            setProductModal({ open: false });
            getProducts();
          }}
          productForm={productForm}
          setProductForm={setProductForm}
        />
      )}

      {/* Delete Modal */}
      {productToDelete && (
        <ProductDeleteModal
          open
          product={productToDelete}
          loading={deleting}
          onCancel={() => setProductToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
