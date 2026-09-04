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
import { Typography, Chip, Skeleton, useMediaQuery, Tooltip } from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";
import { formatBRLFromCents } from "../../utils/masks";
import type { Product } from "./types";
import ProductPhotosPreviewModal from "./ProductPhotosPreviewModal";

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
  rows: Product[];
  loading: boolean;
  onRowClick?: (id: number) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};
export default function ProductsTable({
  rows,
  loading,
  onRowClick,
  onEdit,
  onDelete,
}: Props) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [previewProduct, setPreviewProduct] = React.useState<Product | null>(null);

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
              Nenhum produto cadastrado ainda.
            </Typography>
          </Paper>
        ) : (
          paginatedRows.map((product) => (
            <Paper
              key={product.id}
              onClick={() => (onRowClick ? onRowClick(product.id) : onEdit(product))}
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
                opacity: product.is_active ? 1 : 0.6,
                transition: "all 0.15s ease",
                "&:active": {
                  bgcolor: "action.hover",
                  transform: "scale(0.99)",
                },
              }}
            >
              {/* Linha 1: Foto + Nome e Preço */}
              {(() => {
                const primaryPhoto = product.photos?.find((p) => p.is_primary) || product.photos?.[0];
                return (
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
                      {primaryPhoto ? (
                        <Tooltip title="Clique para ampliar foto e ver galeria">
                          <Box
                            component="img"
                            src={primaryPhoto.photo_url}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewProduct(product);
                            }}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1.75,
                              objectFit: "cover",
                              border: "1.5px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                              cursor: "zoom-in",
                              transition: "transform 0.15s ease",
                              "&:hover": {
                                transform: "scale(1.08)",
                                borderColor: "primary.main",
                              },
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.75,
                            bgcolor: "grey.100",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid",
                            borderColor: "divider",
                            flexShrink: 0,
                            color: "text.disabled",
                          }}
                        >
                          <Package size={20} />
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          color="text.primary"
                          sx={{ fontSize: "0.98rem", lineHeight: 1.3 }}
                          noWrap
                        >
                          {product.name}
                        </Typography>
                        {product.sku && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.2 }}
                          >
                            SKU: {product.sku}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Preço em destaque */}
                    <Typography
                      variant="body1"
                      fontWeight={800}
                      color="primary.main"
                      sx={{ fontSize: "1.05rem", whiteSpace: "nowrap" }}
                    >
                      R$ {formatBRLFromCents(product.price_cents) ?? "-"}
                    </Typography>
                  </Box>
                );
              })()}

              {/* Linha 2: Categoria e Estoque */}
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  borderRadius: 1.5,
                  p: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 0.75,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                  <Package size={15} color="#64748B" style={{ flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                    {product.category || "Geral"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Typography variant="caption" fontWeight={600} color="text.primary">
                    {product.quantity !== undefined && product.quantity !== null
                      ? `${product.quantity} ${product.unit || "UN"}`
                      : "-"}
                  </Typography>

                  {product.quantity === 0 ? (
                    <Chip
                      label="Sem estoque"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                    />
                  ) : product.quantity <= product.min_stock ? (
                    <Chip
                      label="Estoque baixo"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                    />
                  ) : null}
                </Box>
              </Box>

              {/* Linha 3: Status / Ações */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  pt: 0.75,
                  borderTop: "1px dashed #E2E8F0",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Chip
                    label={product.is_active ? "Ativo" : "Inativo"}
                    size="small"
                    sx={{
                      bgcolor: product.is_active ? "success.main" : "grey.300",
                      color: product.is_active ? "#FFFFFF" : "text.secondary",
                      fontWeight: 700,
                      height: 20,
                      fontSize: "0.68rem",
                    }}
                  />
                  {product.is_internal_use && (
                    <Chip
                      label="Uso Interno"
                      size="small"
                      sx={{
                        bgcolor: "info.light",
                        color: "info.dark",
                        fontWeight: 600,
                        height: 20,
                        fontSize: "0.68rem",
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    sx={{ color: "text.secondary" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(product);
                    }}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(product);
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

        <ProductPhotosPreviewModal
          open={previewProduct !== null}
          onClose={() => setPreviewProduct(null)}
          product={previewProduct}
        />
      </Box>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 2, overflow: "hidden" }}
      >
        <Table sx={{ minWidth: 500 }} aria-label="products table">
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
                  width: "10%",
                }}
              >
                Codigo
              </TableCell>

              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                  width: "30%",
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
                  width: "15%",
                }}
              >
                Categoria
              </TableCell>

              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                  width: "22%",
                }}
              >
                Quantidade
              </TableCell>

              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                  width: "13%",
                }}
              >
                Preço
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                  width: "10%",
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
              paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => (onRowClick ? onRowClick(row.id) : onEdit?.(row))}
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
                  {row.sku}
                </TableCell>
                <TableCell align="left">
                  {(() => {
                    const primaryPhoto = row.photos?.find((p) => p.is_primary) || row.photos?.[0];
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {primaryPhoto ? (
                          <Tooltip title="Clique para ampliar foto e ver galeria">
                            <Box
                              component="img"
                              src={primaryPhoto.photo_url}
                              alt={row.name}
                              loading="lazy"
                              decoding="async"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewProduct(row);
                              }}
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 1.5,
                                objectFit: "cover",
                                border: "1.5px solid",
                                borderColor: "divider",
                                flexShrink: 0,
                                cursor: "zoom-in",
                                transition: "all 0.15s ease",
                                "&:hover": {
                                  transform: "scale(1.15)",
                                  borderColor: "primary.main",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                },
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 1.5,
                              bgcolor: "grey.100",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                              color: "text.disabled",
                            }}
                          >
                            <Package size={18} />
                          </Box>
                        )}
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {row.name ?? "-"}
                        </Typography>
                      </Box>
                    );
                  })()}
                </TableCell>
                <TableCell align="left">{row.category ?? "-"}</TableCell>
                <TableCell align="left">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row.quantity !== undefined && row.quantity !== null ? `${row.quantity} ${row.unit || "UN"}` : "-"}
                    {row.quantity === 0 ? (
                      <Chip
                        label="Sem estoque"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ) : row.quantity <= row.min_stock ? (
                      <Chip
                        label="Estoque baixo"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell align="left">
                  R$ {formatBRLFromCents(row.price_cents) ?? "-"}
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
                    Nenhum produto cadastrado ainda.
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

      <ProductPhotosPreviewModal
        open={previewProduct !== null}
        onClose={() => setPreviewProduct(null)}
        product={previewProduct}
      />
    </>
  );
}
