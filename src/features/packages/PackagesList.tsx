import { Box, Typography } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPackages, deletePackage } from "../../api/services/packages";
import { Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import PackageForm from "./PackageForm";
import PackageTable from "./PackageTable";
import { useToast } from "../../hooks/useToast";
import type { Package } from "./types";
import { Button } from "../../components/Button/Button";
import PackageDeleteModal from "./PackageDeleteModal";
import CustomTextField from "../../components/Textfield/CustomTextfield";

export default function PackagesList() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const filteredPackages = useMemo(() => {
    if (!search) return packages;
    const term = search.toLowerCase();
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(term) ||
        (pkg.description && pkg.description.toLowerCase().includes(term)),
    );
  }, [packages, search]);

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      toast.success("Pacote excluído com sucesso!");
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const message =
        error.response?.data?.detail || "Erro ao excluir o pacote.";
      toast.error(message);
    },
  });

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (pkg: Package) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmDelete = () => {
    if (packageToDelete) {
      deleteMutation.mutate(packageToDelete.id);
      setPackageToDelete(null);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Pacotes e Combos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie seus pacotes promocionais de produtos e serviços.
        </Typography>
      </Box>

      <Box
        mb={2}
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: 1, width: "100%", maxWidth: { sm: "420px" } }}>
          <CustomTextField
            fullWidth
            icon={<Search size={18} />}
            placeholder="Pesquisar pacote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <Button
          startIcon={<Plus size={18} />}
          onClick={() => setIsFormOpen(true)}
          sx={{
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          Novo Pacote
        </Button>
      </Box>

      <PackageTable
        rows={filteredPackages}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {isFormOpen && (
        <PackageForm
          open={isFormOpen}
          onClose={handleCloseForm}
          editingPackage={editingPackage}
        />
      )}

      {packageToDelete && (
        <PackageDeleteModal
          open={!!packageToDelete}
          pkg={packageToDelete}
          loading={deleteMutation.isPending}
          onCancel={() => setPackageToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
