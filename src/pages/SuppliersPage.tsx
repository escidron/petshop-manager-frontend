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
  LinearProgress,
  Skeleton,
  TableFooter,
  TablePagination,
} from "@mui/material";
import { TablePaginationActions } from "../components/TablePaginationActions";
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  useEffect(() => {
    getSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return suppliers;
    const term = search.toLowerCase();
    const normalizedTerm = term.replace(/\D/g, "");

    return suppliers.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(term);

      const normalizedCnpj = s.cnpj?.replace(/\D/g, "") || "";
      const cnpjMatch = normalizedTerm
        ? normalizedCnpj.includes(normalizedTerm)
        : false;

      const phone1Match = s.phone_1?.toLowerCase().includes(term) || false;
      const phone2Match = s.phone_2?.toLowerCase().includes(term) || false;
      const emailMatch = s.email?.toLowerCase().includes(term) || false;

      return nameMatch || cnpjMatch || s.cnpj?.toLowerCase().includes(term) || phone1Match || phone2Match || emailMatch;
    });
  }, [suppliers, search]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  useEffect(() => {
    setPage(0);
  }, [search, suppliers]);

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
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Telefone 1
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
                Telefone 2
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
                E-mail
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
            {(rowsPerPage > 0
              ? filteredRows.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage,
                )
              : filteredRows
            ).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.cnpj || "-"}</TableCell>
                <TableCell>{row.phone_1 || "-"}</TableCell>
                <TableCell>{row.phone_2 || "-"}</TableCell>
                <TableCell>{row.email || "-"}</TableCell>
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
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhum fornecedor cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && filteredRows.length === 0 && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell align="right"><Skeleton variant="rectangular" width={60} height={24} sx={{ display: "inline-block" }} /></TableCell>
                </TableRow>
              ))
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={6}
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
                slotProps={{
                  select: {
                    inputProps: { "aria-label": "rows per page" },
                    native: true,
                  },
                }}
              />
            </TableRow>
          </TableFooter>
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
