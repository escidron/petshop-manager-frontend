import * as React from "react";
import axios from "axios";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDaycareModality,
  listDaycareModalities,
} from "../../api/services/daycare";
import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { useToast } from "../../hooks/useToast";
import { formatBRLFromCents } from "../../utils/masks";
import DaycareServiceFormModal from "./DaycareServiceFormModal";
import type { DaycareModality } from "./types";

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number,
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={(e) => onPageChange(e, 0)}
        disabled={page === 0}
        aria-label="primeira página"
      >
        {theme.direction === "rtl" ? (
          <ChevronsRight size={20} />
        ) : (
          <ChevronsLeft size={20} />
        )}
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        aria-label="página anterior"
      >
        {theme.direction === "rtl" ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="próxima página"
      >
        {theme.direction === "rtl" ? (
          <ChevronLeft size={20} />
        ) : (
          <ChevronRight size={20} />
        )}
      </IconButton>
      <IconButton
        onClick={(e) =>
          onPageChange(e, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
        }
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="última página"
      >
        {theme.direction === "rtl" ? (
          <ChevronsLeft size={20} />
        ) : (
          <ChevronsRight size={20} />
        )}
      </IconButton>
    </Box>
  );
}

export default function DaycareModalitiesSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [modalState, setModalState] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    modality?: DaycareModality | null;
  }>({ open: false, mode: "create", modality: null });

  const [modalityToDelete, setModalityToDelete] = React.useState<DaycareModality | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const { data: modalities = [], isLoading } = useQuery({
    queryKey: ["daycare", "modalities"],
    queryFn: () => listDaycareModalities(false),
  });

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return modalities;
    const term = search.toLowerCase();
    return modalities.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.description || "").toLowerCase().includes(term) ||
        (m.sizes || []).some((s) => s.toLowerCase().includes(term)) ||
        (m.species || []).some((sp) => sp.toLowerCase().includes(term))
    );
  }, [modalities, search]);

  React.useEffect(() => {
    setPage(0);
  }, [search, modalities]);

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

  const paginatedRows = React.useMemo(() => {
    return rowsPerPage > 0
      ? filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : filteredRows;
  }, [filteredRows, page, rowsPerPage]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  const handleOpenCreate = () => {
    setModalState({ open: true, mode: "create", modality: null });
  };

  const handleOpenEdit = (modality: DaycareModality) => {
    setModalState({ open: true, mode: "edit", modality });
  };

  const handleConfirmDelete = async () => {
    if (!modalityToDelete) return;
    try {
      setDeleting(true);
      await deleteDaycareModality(modalityToDelete.id);
      toast.success("Serviço de creche removido com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["daycare", "modalities"] });
      setModalityToDelete(null);
    } catch (err: unknown) {
      let message = "Não foi possível remover o serviço de creche.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || message;
      }
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* TOOLBAR */}
      <Box
        mb={2}
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={1.5}
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: 1, width: "100%", maxWidth: { md: "420px" } }}>
          <CustomTextField
            fullWidth
            icon={<Search size={18} />}
            placeholder="Pesquisar serviço de creche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            fullWidth={isMobile}
            startIcon={<Plus size={18} />}
            onClick={handleOpenCreate}
          >
            Novo Serviço
          </Button>
        </Box>
      </Box>

      {/* TABELA DE SERVIÇOS DE CRECHE */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
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
                Nenhum serviço de creche cadastrado ainda.
              </Typography>
            </Paper>
          ) : (
            paginatedRows.map((service) => (
              <Paper
                key={service.id}
                onClick={() => handleOpenEdit(service)}
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
                  opacity: service.is_active ? 1 : 0.6,
                  transition: "all 0.15s ease",
                  "&:active": {
                    bgcolor: "action.hover",
                    transform: "scale(0.99)",
                  },
                }}
              >
                {/* Linha 1: Nome, Status e Preço */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ fontSize: "0.98rem", lineHeight: 1.3 }}
                    >
                      {service.name}
                    </Typography>
                    {!service.is_active && (
                      <Chip
                        label="Inativo"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          bgcolor: "grey.200",
                          color: "grey.700",
                          mt: 0.4,
                        }}
                      />
                    )}
                  </Box>

                  {/* Preço em destaque */}
                  <Typography
                    variant="body1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: "1.05rem", whiteSpace: "nowrap" }}
                  >
                    R$ {formatBRLFromCents(service.price_cents) ?? "-"}
                  </Typography>
                </Box>

                {/* Linha 2: Compatibilidade do Animal */}
                {(() => {
                  const compatParts: string[] = [];
                  const speciesText = Array.isArray(service.species)
                    ? service.species.join(", ")
                    : service.species;
                  if (speciesText) compatParts.push(`Espécie: ${speciesText}`);

                  const sizeText =
                    service.sizes && service.sizes.length > 0
                      ? service.sizes.join(", ")
                      : null;
                  if (sizeText) compatParts.push(`Porte: ${sizeText}`);

                  if (compatParts.length === 0) return null;

                  return (
                    <Box
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 1.5,
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.primary"
                        fontWeight={600}
                        noWrap
                      >
                        🐾 {compatParts.join(" • ")}
                      </Typography>
                    </Box>
                  );
                })()}

                {/* Linha 3: Rodapé com Ação */}
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
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    <Pencil size={13} />
                    Toque para editar
                  </Box>

                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalityToDelete(service);
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))
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
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, overflow: "hidden" }}
        >
          <Table sx={{ minWidth: 500 }} aria-label="daycare services table">
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
                  Nome do serviço
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
                  Preço
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
                  Tipo de animal
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
                  Porte do animal
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell align="right">
                      <Skeleton variant="rectangular" width={60} height={24} sx={{ display: "inline-block" }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleOpenEdit(row)}
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 0.2s ease, opacity 0.2s ease",
                      opacity: row.is_active ? 1 : 0.5,
                      "&:hover": {
                        backgroundColor: "secondary.main",
                      },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="left">
                      R$ {formatBRLFromCents(row.price_cents) ?? "-"}
                    </TableCell>
                    <TableCell align="left">
                      {Array.isArray(row.species)
                        ? (row.species.length > 0 ? row.species.join(", ") : "-")
                        : (row.species ?? "-")}
                    </TableCell>
                    <TableCell align="left">
                      {row.sizes && row.sizes.length > 0
                        ? row.sizes.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <IconButton
                          size="medium"
                          sx={{
                            color: "primary.main",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(row);
                          }}
                        >
                          <Pencil size={16} />
                        </IconButton>

                        <IconButton
                          size="medium"
                          sx={{
                            color: "error.main",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalityToDelete(row);
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
              {!isLoading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.disabled" variant="body1">
                      Nenhum serviço de creche cadastrado ainda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "Todos", value: -1 }]}
                  colSpan={5}
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                  slotProps={{
                    select: {
                      inputProps: { "aria-label": "linhas por página" },
                      native: true,
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      {/* MODAL PADRÃO NOVO/EDITAR SERVIÇO DE CRECHE */}
      {modalState.open && (
        <DaycareServiceFormModal
          open={modalState.open}
          mode={modalState.mode}
          modality={modalState.modality}
          onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
          onSuccess={() => {
            setModalState((prev) => ({ ...prev, open: false }));
            queryClient.invalidateQueries({ queryKey: ["daycare", "modalities"] });
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalityToDelete && (
        <Dialog
          open={Boolean(modalityToDelete)}
          onClose={() => setModalityToDelete(null)}
          maxWidth="xs"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            Remover serviço de creche
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Tem certeza que deseja remover o serviço{" "}
              <strong>"{modalityToDelete.name}"</strong>? Esta ação não pode ser
              desfeita.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setModalityToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              color="error"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              Remover
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
