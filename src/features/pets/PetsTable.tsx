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
import { Typography, Skeleton, Chip, Avatar, useMediaQuery, IconButton, Paper } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Dog,
  User,
  Mars,
  Venus,
} from "lucide-react";
import type { Pet } from "./types";
import { formatePetGender } from "../../utils/formatPetGender";

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
  rows: Pet[];
  loading: boolean;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
};
export default function PetsTable({ rows, loading, onEdit, onDelete }: Props) {
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
              Nenhum pet cadastrado ainda.
            </Typography>
          </Paper>
        ) : (
          paginatedRows.map((pet) => {
            const initials = pet.name
              ? pet.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "PT";

            return (
              <Paper
                key={pet.id}
                onClick={() => onEdit(pet)}
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
                  opacity: pet.is_deceased ? 0.7 : 1,
                  transition: "all 0.15s ease",
                  "&:active": {
                    bgcolor: "action.hover",
                    transform: "scale(0.99)",
                  },
                }}
              >
                {/* Linha 1: Avatar, Nome e Gênero/Óbito */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: pet.is_deceased ? "grey.300" : "rgba(49, 52, 133, 0.1)",
                        color: pet.is_deceased ? "grey.700" : "primary.main",
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
                        {pet.name}
                      </Typography>
                      {pet.owner_name && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}
                          noWrap
                        >
                          <User size={12} />
                          Tutor: {pet.owner_name}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    {pet.gender && ["male", "female"].includes(pet.gender) && (
                      <Chip
                        label={pet.gender === "male" ? "Macho" : "Fêmea"}
                        size="small"
                        icon={
                          pet.gender === "male" ? (
                            <Mars color={theme.palette.text.primary} size={14} />
                          ) : (
                            <Venus color={theme.palette.text.primary} size={14} />
                          )
                        }
                        sx={{
                          bgcolor:
                            pet.gender === "male"
                              ? "rgba(33, 150, 243, 0.15)"
                              : "rgba(233, 30, 99, 0.15)",
                          color: "text.primary",
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {pet.is_deceased && (
                      <Chip
                        label="Óbito 🖤"
                        size="small"
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          fontWeight: 600,
                          height: 22,
                          fontSize: "0.72rem",
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Linha 2: Espécie e Raça */}
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
                  <Dog size={15} color="#64748B" style={{ flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    color="text.primary"
                    fontWeight={600}
                    noWrap
                  >
                    {pet.species || "Pet"}{pet.breed ? ` • ${pet.breed}` : ""}
                  </Typography>
                </Box>

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
                        onDelete?.(pet);
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
        <Table sx={{ minWidth: 500 }} aria-label="pets table">
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
                Espécie
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
                Raça
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
                Genero
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
                Tutor
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
                  transition: "background-color 0.2s ease",
                  opacity: row.is_deceased ? 0.65 : 1,
                  "&:hover": {
                    backgroundColor: "secondary.main",
                  },
                }}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row.name}
                    {row.is_deceased && (
                      <Chip
                        label="Óbito 🖤"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.75rem",
                          bgcolor: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="left">{row.species ?? "-"}</TableCell>
                <TableCell align="left">
                  {row.breed ? row.breed : "-"}
                </TableCell>
                <TableCell align="left">
                  {row.gender ? formatePetGender(row.gender) : "-"}
                </TableCell>
                <TableCell align="left">{row.owner_name ?? "-"}</TableCell>
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
                    Nenhum pet cadastrado ainda.
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
