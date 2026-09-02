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
  Typography,
  LinearProgress,
  Skeleton,
  TableFooter,
  TablePagination,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { TablePaginationActions } from "../components/TablePaginationActions";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail, ChevronRight, ChevronLeft } from "lucide-react";
import { useSuppliers } from "../hooks/useSuppliers";
import SupplierFormModal from "../features/suppliers/SupplierFormModal";
import SupplierDeleteModal from "../features/suppliers/SupplierDeleteModal";
import { deleteSupplier } from "../api/services/suppliers";
import { useToast } from "../hooks/useToast";
import type { Supplier } from "../features/suppliers/types";
import { Button } from "../components/Button/Button";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { maskCnpj, maskPhone } from "../utils/masks";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

      return (
        nameMatch ||
        cnpjMatch ||
        s.cnpj?.toLowerCase().includes(term) ||
        phone1Match ||
        phone2Match ||
        emailMatch
      );
    });
  }, [suppliers, search]);

  const paginatedRows = useMemo(() => {
    return rowsPerPage > 0
      ? filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : filteredRows;
  }, [filteredRows, page, rowsPerPage]);

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
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1200px",
      }}
    >
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
            placeholder="Pesquisar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Button
          startIcon={<Plus size={18} />}
          onClick={handleOpenCreate}
          sx={{
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          Novo Fornecedor
        </Button>
      </Box>

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading && filteredRows.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Paper key={i} sx={{ p: 2, borderRadius: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={18} />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1.5 }} />
              </Paper>
            ))
          ) : filteredRows.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2.5 }}>
              <Typography color="text.disabled" variant="body1">
                Nenhum fornecedor cadastrado ainda.
              </Typography>
            </Paper>
          ) : (
            paginatedRows.map((supplier) => {
              const initials = supplier.name
                ? supplier.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "FO";

              return (
                <Paper
                  key={supplier.id}
                  onClick={() => handleEdit(supplier)}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    transition: "all 0.15s ease",
                    "&:active": {
                      bgcolor: "action.hover",
                      transform: "scale(0.99)",
                    },
                  }}
                >
                  {/* Linha 1: Avatar, Nome e CNPJ */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "rgba(49, 52, 133, 0.1)",
                        color: "primary.main",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        color="text.primary"
                        noWrap
                        sx={{ fontSize: "0.95rem" }}
                      >
                        {supplier.name}
                      </Typography>
                      {supplier.cnpj && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.2 }}
                        >
                          CNPJ: {maskCnpj(supplier.cnpj)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Linha 2: Contatos (Telefone e Email) */}
                  {(supplier.phone_1 || supplier.phone_2 || supplier.email) && (
                    <Box
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 1.5,
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {(supplier.phone_1 || supplier.phone_2) && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Phone size={13} color="#64748B" style={{ flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                            {[
                              supplier.phone_1 ? maskPhone(supplier.phone_1) : null,
                              supplier.phone_2 ? maskPhone(supplier.phone_2) : null,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </Typography>
                        </Box>
                      )}

                      {supplier.email && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Mail size={13} color="#64748B" style={{ flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                            {supplier.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Linha 3: Ações e Detalhes */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 0.75,
                      borderTop: "1px dashed #E2E8F0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "primary.main",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      Ver detalhes
                      <ChevronRight size={16} />
                    </Box>

                    <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        sx={{ color: "text.secondary" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(supplier);
                        }}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(supplier);
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}

          {/* Mobile Pagination */}
          {filteredRows.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} de {filteredRows.length}
              </Typography>

              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleChangePage(e, page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft size={18} />
                </IconButton>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {page + 1} / {Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleChangePage(e, page + 1)}
                  disabled={page >= Math.ceil(filteredRows.length / rowsPerPage) - 1}
                >
                  <ChevronRight size={18} />
                </IconButton>
              </Box>
            </Paper>
          )}
        </Box>
      ) : (
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
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleEdit(row)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "secondary.main",
                    },
                  }}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.cnpj ? maskCnpj(row.cnpj) : "-"}</TableCell>
                  <TableCell>{row.phone_1 ? maskPhone(row.phone_1) : "-"}</TableCell>
                  <TableCell>{row.phone_2 ? maskPhone(row.phone_2) : "-"}</TableCell>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                      }}
                      color="primary"
                    >
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(row);
                      }}
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
      )}

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
