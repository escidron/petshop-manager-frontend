import { Box, Typography } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPackages, deletePackage } from "../../api/services/packages";
import { Plus } from "lucide-react";
import { useState } from "react";
import PackageForm from "./PackageForm";
import PackageTable from "./PackageTable";
import { useToast } from "../../hooks/useToast";
import type { Package } from "./types";
import { Button } from "../../components/Button/Button";
import PackageDeleteModal from "./PackageDeleteModal";

export default function PackagesList() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Pacotes e Combos
          </Typography>
          <Typography variant="body2" color="text.primary">
            Gerencie seus pacotes promocionais de produtos e serviços.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setIsFormOpen(true)}
        >
          Novo Pacote
        </Button>
      </Box>

      <PackageTable
        rows={packages}
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
