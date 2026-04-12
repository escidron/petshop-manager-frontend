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
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import SupplierFormModal from "../features/suppliers/SupplierFormModal";
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

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      try {
        await deleteSupplier(id);
        toast.success("Fornecedor excluído!");
        getSuppliers();
      } catch {
        toast.error(
          "Erro ao excluir fornecedor. Verifique se ele está vinculado a produtos em estoque.",
        );
      }
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
          placeholder="Buscar..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Nome</strong>
              </TableCell>
              <TableCell>
                <strong>CNPJ</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Ações</strong>
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
                    onClick={() => handleDelete(row.id)}
                    color="error"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          getSuppliers();
        }}
        supplierToEdit={supplierToEdit}
      />
    </Box>
  );
}
