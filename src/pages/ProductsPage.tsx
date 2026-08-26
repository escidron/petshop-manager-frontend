import { Box, Chip, CircularProgress } from "@mui/material";
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
import ProductMigrationWizardModal from "../features/products/ProductMigrationWizardModal";

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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
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
        onCreate={() => setProductModal({ open: true, mode: "create" })}
        onImport={() => setImportModalOpen(true)}
        onOpenWizard={() => setWizardOpen(true)}
      />

      <ProductsTable
        rows={filteredRows}
        loading={loading}
        onEdit={(product) => setProductModal({ open: true, mode: "edit", product })}
        onDelete={(product) => setProductToDelete(product)}
      />

      {productModal.open && (
        <ProductFormModal
          open={productModal.open}
          mode={productModal.mode || "create"}
          product={productModal.product}
          onClose={() => setProductModal((prev) => ({ ...prev, open: false }))}
          onSuccess={async () => {
            await getProducts();
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
            setProductModal({ open: false, mode: "create" });
          }}
        />
      )}

      {productToDelete && (
        <ProductDeleteModal
          open={!!productToDelete}
          product={productToDelete}
          loading={deleting}
          onCancel={() => setProductToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <ImportProductsModal
        open={importModalOpen}
        activeJobId={activeJobId}
        onJobStarted={(id) => setActiveJobId(id)}
        onJobFinished={() => setActiveJobId(null)}
        onClose={() => setImportModalOpen(false)}
        onSuccess={async () => {
          await getProducts();
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
        }}
      />

      <ProductMigrationWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onJobStarted={(id) => {
          setActiveJobId(id);
          setImportModalOpen(true);
        }}
      />

      {/* Persistent import progress chip when modal is closed */}
      {!importModalOpen && activeJobId && (
        <Chip
          icon={<CircularProgress size={14} color="inherit" />}
          label="Importação em andamento — clique para ver"
          color="primary"
          onClick={() => setImportModalOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1400,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: 3,
          }}
        />
      )}
    </Box>
  );
}

