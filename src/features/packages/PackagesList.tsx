import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPackages, deletePackage } from "../../api/services/packages";
import { Edit, Delete, Inventory as PackageIcon } from "@mui/icons-material";
import { useState } from "react";
import PackageForm from "./PackageForm";
import type { Package } from "./types";

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

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este pacote?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  if (isLoading) return <Typography>Carregando...</Typography>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">Pacotes e Combos</Typography>
        <Button
          variant="contained"
          startIcon={<PackageIcon />}
          onClick={() => setIsFormOpen(true)}
        >
          Novo Pacote
        </Button>
      </Box>

      <Grid container spacing={3}>
        {packages.map((pkg) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="h6">{pkg.name}</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(pkg)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(pkg.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {pkg.description || "Sem descrição"}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  R$ {(pkg.price_cents / 100).toFixed(2)}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {pkg.items.length} itens inclusos
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
