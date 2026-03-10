import { Box, Typography } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPackages, deletePackage } from "../../api/services/packages";
import { Add } from "@mui/icons-material";
import { useState } from "react";
import PackageForm from "./PackageForm";
import PackageTable from "./PackageTable";
import type { Package } from "./types";
import { Button } from "../../components/Button/Button";

export default function PackagesList() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    if (
      window.confirm(`Tem certeza que deseja excluir o pacote "${pkg.name}"?`)
    ) {
      deleteMutation.mutate(pkg.id);
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
          <Typography variant="body2" color="text.secondary">
            Gerencie seus pacotes promocionais de produtos e serviços.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsFormOpen(true)}
        >
          Novo Pacote
        </Button>
      </Box>

      <PackageTable
        rows={packages}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isFormOpen && (
        <PackageForm
          open={isFormOpen}
          onClose={handleCloseForm}
          editingPackage={editingPackage}
        />
      )}
    </Box>
  );
}
