import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import { Typography, Skeleton, Chip, useMediaQuery } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Service } from "./types";
import { formatBRLFromCents } from "../../utils/masks";
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import type { CoatType } from "../pets/types";

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
        aria-label="first page"
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
        aria-label="previous page"
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
        aria-label="next page"
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
        aria-label="last page"
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

type Props = {
  rows: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
};
export default function ServiceTable({
  rows,
  loading,
  onEdit,
  onDelete,
}: Props) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  React.useEffect(() => {
    setPage(0);
  }, [rows]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const paginatedRows = React.useMemo(() => {
    return rowsPerPage > 0
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;
  }, [rows, page, rowsPerPage]);

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {loading ? (
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
        ) : rows.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2.5 }}>
            <Typography color="text.disabled" variant="body1">
              Nenhum serviço cadastrado ainda.
            </Typography>
          </Paper>
        ) : (
          paginatedRows.map((service) => (
            <Paper
              key={service.id}
              onClick={() => onEdit(service)}
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

              {/* Linha 2: Compatibilidade do Animal (apenas quando registrado) */}
              {(() => {
                const compatParts: string[] = [];
                const speciesText = Array.isArray(service.species)
                  ? service.species.join(", ")
                  : service.species;
                if (speciesText) compatParts.push(`Espécie: ${speciesText}`);

                const sizeText = service.sizes && service.sizes.length > 0
                  ? service.sizes.join(", ")
                  : service.size;
                if (sizeText) compatParts.push(`Porte: ${sizeText}`);

                let coatLabel = "";
                if (service.coat_types && service.coat_types.length > 0) {
                  coatLabel = service.coat_types
                    .map((c) => getCoatTypeLabel(c as CoatType))
                    .filter((l) => l && l !== "-")
                    .join(", ");
                } else if (service.coat_type) {
                  const l = getCoatTypeLabel(service.coat_type as CoatType);
                  if (l && l !== "-") coatLabel = l;
                }
                if (coatLabel) compatParts.push(`Pelagem: ${coatLabel}`);
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
                      onDelete?.(service);
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
        {rows.length > 0 && (
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
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, rows.length)} de {rows.length}
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
                {page + 1} / {Math.max(1, Math.ceil(rows.length / rowsPerPage))}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => handleChangePage(e, page + 1)}
                disabled={page >= Math.ceil(rows.length / rowsPerPage) - 1}
              >
                <ChevronRight size={18} />
              </IconButton>
            </Box>
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 2, overflow: "hidden" }}
    >
        <Table sx={{ minWidth: 500 }} aria-label="services table">
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
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Tipo de pelagem
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
            {loading ? (
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
            ) : (
              (rowsPerPage > 0
                ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : rows
              ).map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onEdit(row)}
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
                    : (row.size ?? "-")}
                </TableCell>
                <TableCell align="left">
                  {row.coat_types && row.coat_types.length > 0
                    ? row.coat_types
                        .map((c) => getCoatTypeLabel(c as CoatType))
                        .filter((l) => l && l !== "-")
                        .join(", ") || "-"
                    : (row.coat_type ? getCoatTypeLabel(row.coat_type as CoatType) : "-")}
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
                        onEdit?.(row);
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
                        onDelete?.(row);
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            )))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhum serviço cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={4}
                count={rows.length}
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
  );
}
