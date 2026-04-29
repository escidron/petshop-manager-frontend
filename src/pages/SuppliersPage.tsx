import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import SupplierFormModal from "../features/suppliers/SupplierFormModal";
import SupplierDeleteModal from "../features/suppliers/SupplierDeleteModal";
import { deleteSupplier } from "../api/services/suppliers";
import { useToast } from "../hooks/useToast";
import type { Supplier } from "../features/suppliers/types";
import { Button } from "../components/Button/Button";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const { suppliers, loading, getSuppliers } = useSuppliers();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | undefined>(
    undefined,
  );
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | undefined>(
    undefined,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [suppliers, search]);

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      toast.success("Fornecedor excluído!");
      setSupplierToDelete(undefined);
      getSuppliers();
    } catch {
      toast.error(
        "Erro ao excluir fornecedor. Verifique se ele está vinculado a produtos em estoque.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSupplierToEdit(undefined);
    setModalOpen(true);
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          size="small"
          placeholder="Pesquisar fornecedor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="gray" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleOpenCreate}
        >
          Novo Fornecedor
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ position: "relative" }}>
        {loading && filteredRows.length > 0 && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          />
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Nome
              </TableCell>
              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                CNPJ
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                {}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.cnpj || "-"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(row)}
                    color="primary"
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(row)}
                    color="error"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhum fornecedor cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SupplierFormModal
        open={modalOpen}
        mode={supplierToEdit ? "edit" : "create"}
        supplier={supplierToEdit}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          getSuppliers();
        }}
      />

      {supplierToDelete && (
        <SupplierDeleteModal
          open={!!supplierToDelete}
          supplier={supplierToDelete}
          loading={isDeleting}
          onCancel={() => setSupplierToDelete(undefined)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
