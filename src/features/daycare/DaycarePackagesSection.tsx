import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import {
  listDaycarePackages,
  deleteDaycarePackage,
} from "../../api/services/daycare";
import DaycarePackageFormModal from "./DaycarePackageFormModal";
import DaycarePackageTable from "./DaycarePackageTable";
import type { DaycarePackage } from "./types";

export default function DaycarePackagesSection() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pkg: DaycarePackage | null;
  }>({
    open: false,
    mode: "create",
    pkg: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    pkg: DaycarePackage | null;
  }>({
    open: false,
    pkg: null,
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["daycarePackages"],
    queryFn: () => listDaycarePackages(false),
  });

  const filteredPackages = useMemo(() => {
    if (!search.trim()) return packages;
    const term = search.toLowerCase();
    return packages.filter((p) => p.name.toLowerCase().includes(term));
  }, [packages, search]);

  const deleteMutation = useMutation({
    mutationFn: (packageId: number) => deleteDaycarePackage(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daycarePackages"] });
      toast.success("Pacote de creche excluído com sucesso!");
      setDeleteDialog({ open: false, pkg: null });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Erro ao excluir pacote de creche.";
      toast.error(msg);
    },
  });

  const handleOpenCreate = () => {
    setModalState({ open: true, mode: "create", pkg: null });
  };

  const handleOpenEdit = (pkg: DaycarePackage) => {
    setModalState({ open: true, mode: "edit", pkg });
  };

  const handleOpenDelete = (pkg: DaycarePackage) => {
    setDeleteDialog({ open: true, pkg });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.pkg) {
      deleteMutation.mutate(deleteDialog.pkg.id);
    }
  };

  return (
    <Box>
      {/* Barra de Ações: Busca + Botão Novo Pacote */}
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
          onClick={handleOpenCreate}
        >
          Novo Pacote
        </Button>
      </Box>

      {/* Tabela de Pacotes de Creche */}
      <DaycarePackageTable
        packages={filteredPackages}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Modal de Formulário (Criação / Edição) */}
      {modalState.open && (
        <DaycarePackageFormModal
          open={modalState.open}
          mode={modalState.mode}
          pkg={modalState.pkg}
          onClose={() =>
            setModalState((prev) => ({ ...prev, open: false, pkg: null }))
          }
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["daycarePackages"] });
          }}
        />
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, pkg: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AlertTriangle color="#dc2626" size={22} />
          <Typography variant="h6" fontWeight={700}>
            Excluir Pacote
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja excluir o pacote{" "}
            <strong>"{deleteDialog.pkg?.name}"</strong>? Essa ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialog({ open: false, pkg: null })}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

