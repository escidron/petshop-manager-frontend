import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductFormModal from "../features/products/ProductFormModal";
import ProductDeleteModal from "../features/products/ProductToDeleteModal";
import ImportProductsModal from "../features/products/ImportProductsModal";
import ProductsToolbar from "../features/products/ProductsToolbar";
import ProductsTable from "../features/products/ProductsTable";
import { deleteProduct } from "../api/services/products";
import { useToast } from "../hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

import type { Product } from "../features/products/types";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const toast = useToast();
  const [productModal, setProductModal] = useState<{
    open: boolean;
    mode?: "create" | "edit";
    product?: Product;
  }>({ open: false, mode: "create" });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { products, loading, getProducts } = useProducts();
  const filteredRows = useMemo(() => {
    if (!search) return products;

    const term = search.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(term),
    );
  }, [products, search]);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await deleteProduct(productToDelete.id);
      await getProducts();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductToDelete(null);
      toast.success("Produto apagado com sucesso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <ProductsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setProductModal({ open: true, mode: "create", product: undefined })}
        onImport={() => setImportModalOpen(true)}
      />

      <ProductsTable
        rows={filteredRows}
        loading={loading}
        onEdit={(product) =>
          setProductModal({ open: true, mode: "edit", product })
        }
        onDelete={(product) => setProductToDelete(product)}
      />

      {/* Create / Edit Modal */}
      {productModal.open && (
        <ProductFormModal
          open
          mode={productModal.mode ? productModal.mode : "create"}
          product={
            productModal.mode === "edit" ? productModal.product : undefined
          }
          onClose={() => setProductModal((prev) => ({ ...prev, open: false }))}
          onSuccess={() => {
            setProductModal((prev) => ({ ...prev, open: false }));
            getProducts();
            queryClient.invalidateQueries({ queryKey: ["products"] });
          }}
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
      {/* Import Modal */}
      <ImportProductsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          getProducts();
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }}
      />
    </Box>
  );
}
