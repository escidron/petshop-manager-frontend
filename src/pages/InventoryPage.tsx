import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TablePagination,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Plus,
  AlertTriangle,
  Search,
  Boxes,
  History,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchGlobalInventoryLogs,
} from "../api/services/products";
import type { Product } from "../features/products/types";
import type { InventoryLog } from "../features/inventory/schemas";
import AdjustStockModal from "../features/inventory/AdjustStockModal";
import dayjs from "dayjs";
import { Button } from "../components/Button/Button";
import CustomTextField from "../components/Textfield/CustomTextfield";

function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
      style={{
        flexGrow: value === index ? 1 : 0,
        display: value === index ? "flex" : "none",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {value === index && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [tabValue, setTabValue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockSearch, setStockSearch] = useState("");

  const [productPage, setProductPage] = useState(0);
  const [productRowsPerPage, setProductRowsPerPage] = useState(15);
  const [logPage, setLogPage] = useState(0);
  const [logRowsPerPage, setLogRowsPerPage] = useState(15);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Reset page when search changes
  useEffect(() => {
    setProductPage(0);
  }, [stockSearch]);

  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });
  const products: Product[] = productsData || [];

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["inventory_logs"],
    queryFn: () => fetchGlobalInventoryLogs(),
  });
  const logs: InventoryLog[] = logsData || [];

  const filteredProducts = useMemo(() => {
    const term = stockSearch.toLowerCase().trim();
    return [...products]
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(term);
        const skuMatch = p.sku ? p.sku.toLowerCase().includes(term) : false;
        return nameMatch || skuMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products, stockSearch]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      productPage * productRowsPerPage,
      productPage * productRowsPerPage + productRowsPerPage
    );
  }, [filteredProducts, productPage, productRowsPerPage]);

  const paginatedLogs = useMemo(() => {
    return logs.slice(
      logPage * logRowsPerPage,
      logPage * logRowsPerPage + logRowsPerPage
    );
  }, [logs, logPage, logRowsPerPage]);

  const handleOpenAdjust = (product?: Product) => {
    setSelectedProduct(product || null);
    setIsModalOpen(true);
  };

  const getLogTypeLabel = (quantity: number) => {
    if (quantity > 0) {
      return (
        <Chip
          label="Entrada"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        label="Saída"
        size="small"
        color="error"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1200px",
        minHeight: "100%",
        height: { xs: "auto", md: "100%" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Controle de Estoque
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitore quantidades, alertas de estoque mínimo e movimentações
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => handleOpenAdjust()}
          sx={{
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          Ajuste Avulso
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: { xs: "visible", md: "hidden" },
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#FAFAFA" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant={isMobile ? "fullWidth" : "standard"}
            indicatorColor="primary"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "none",
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                py: 1,
                px: { xs: 1, sm: 2.5 },
                gap: 0.75,
              },
              "& .Mui-selected": {
                color: "primary.main",
                fontWeight: 700,
              },
            }}
          >
            <Tab
              icon={<Boxes size={18} />}
              iconPosition="start"
              label={isMobile ? "Posição" : "Posição de Estoque"}
            />
            <Tab
              icon={<History size={18} />}
              iconPosition="start"
              label={isMobile ? "Histórico" : "Histórico de Movimentações"}
            />
          </Tabs>
        </Box>

        {/* Tab 1: Posição de Estoque */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, width: { xs: "100%", sm: 340 } }}>
            <CustomTextField
              fullWidth
              icon={<Search size={18} />}
              placeholder="Buscar produto ou SKU..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
            />
          </Box>

          {loadingProducts ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : isMobile ? (
            /* Visualização Mobile em Cards */
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filteredProducts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhum produto cadastrado que controle estoque.
                  </Typography>
                </Paper>
              ) : (
                paginatedProducts.map((product: Product) => {
                  const isZero = product.quantity <= 0;
                  const isLow = product.quantity <= (product.min_stock || 0);

                  return (
                    <Paper
                      key={product.id}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: "1.5px solid",
                        borderColor: isZero ? "#FECACA" : isLow ? "#FED7AA" : "divider",
                        bgcolor: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.25,
                      }}
                    >
                      {/* Linha 1: Nome do Produto e Badge de Status */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            color="text.primary"
                            sx={{ fontSize: "0.95rem", lineHeight: 1.3 }}
                          >
                            {product.name}
                          </Typography>
                          {product.sku && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
                              SKU: {product.sku}
                            </Typography>
                          )}
                        </Box>

                        {isZero ? (
                          <Chip
                            label="Sem Estoque"
                            size="small"
                            sx={{
                              bgcolor: "#FEE2E2",
                              color: "#B91C1C",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        ) : isLow ? (
                          <Chip
                            icon={<AlertTriangle size={13} color="#B45309" />}
                            label="Estoque Baixo"
                            size="small"
                            sx={{
                              bgcolor: "#FEF3C7",
                              color: "#B45309",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        ) : (
                          <Chip
                            label="Regular"
                            size="small"
                            sx={{
                              bgcolor: "#ECFDF5",
                              color: "#047857",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 22,
                            }}
                          />
                        )}
                      </Box>

                      {/* Linha 2: Quadro de Estoque Atual vs Mínimo */}
                      <Box
                        sx={{
                          bgcolor: "#F8FAFC",
                          borderRadius: 2,
                          p: 1.25,
                          display: "flex",
                          justifyContent: "space-around",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Estoque Atual
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight={800}
                            sx={{
                              fontSize: "1.2rem",
                              color: isZero ? "error.main" : isLow ? "#D97706" : "primary.main",
                            }}
                          >
                            {product.quantity}
                          </Typography>
                        </Box>

                        <Box sx={{ width: "1px", height: 28, bgcolor: "divider" }} />

                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Estoque Mínimo
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="text.secondary" sx={{ fontSize: "1.05rem" }}>
                            {product.min_stock || 0}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Linha 3: Ação de Ajuste */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SlidersHorizontal size={15} />}
                        onClick={() => handleOpenAdjust(product)}
                        sx={{
                          width: "100%",
                          minHeight: 38,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        Ajustar Estoque
                      </Button>
                    </Paper>
                  );
                })
              )}

              {/* Paginação Mobile */}
              {filteredProducts.length > 0 && (
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
                    {productPage * productRowsPerPage + 1}–
                    {Math.min((productPage + 1) * productRowsPerPage, filteredProducts.length)} de{" "}
                    {filteredProducts.length}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => setProductPage((p) => Math.max(0, p - 1))}
                      disabled={productPage === 0}
                    >
                      <ChevronLeft size={18} />
                    </IconButton>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {productPage + 1} / {Math.max(1, Math.ceil(filteredProducts.length / productRowsPerPage))}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setProductPage((p) => p + 1)}
                      disabled={productPage >= Math.ceil(filteredProducts.length / productRowsPerPage) - 1}
                    >
                      <ChevronRight size={18} />
                    </IconButton>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : (
            /* Visualização Desktop em Tabela */
            <>
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "40%", fontWeight: 600 }}>Produto</TableCell>
                      <TableCell align="center" sx={{ width: "15%", fontWeight: 600 }}>
                        Estoque Atual
                      </TableCell>
                      <TableCell align="center" sx={{ width: "15%", fontWeight: 600 }}>
                        Estoque Mínimo
                      </TableCell>
                      <TableCell align="center" sx={{ width: "20%", fontWeight: 600 }}>
                        Status
                      </TableCell>
                      <TableCell align="right" sx={{ width: "10%", fontWeight: 600 }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.map((product: Product) => {
                      const isLow = product.quantity <= (product.min_stock || 0);
                      return (
                        <TableRow
                          key={product.id}
                          sx={{
                            "&:hover": {
                              backgroundColor: "secondary.main",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                          <TableCell align="center">
                            <Typography
                              fontWeight="bold"
                              color={isLow ? "error" : "inherit"}
                            >
                              {product.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {product.min_stock || 0}
                          </TableCell>
                          <TableCell align="center">
                            {isLow ? (
                              <Chip
                                icon={<AlertTriangle size={14} />}
                                label="Baixo Estoque"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="Regular"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SlidersHorizontal size={14} />}
                              onClick={() => handleOpenAdjust(product)}
                            >
                              Ajustar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Nenhum produto cadastrado que controle estoque.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={productPage}
                onPageChange={(_, newPage) => setProductPage(newPage)}
                rowsPerPage={productRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setProductRowsPerPage(parseInt(e.target.value, 10));
                  setProductPage(0);
                }}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count !== -1 ? count : `mais que ${to}`}`
                }
              />
            </>
          )}
        </TabPanel>

        {/* Tab 2: Histórico */}
        <TabPanel value={tabValue} index={1}>
          {loadingLogs ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : isMobile ? (
            /* Visualização Mobile em Cards */
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {logs.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhuma movimentação registrada.
                  </Typography>
                </Paper>
              ) : (
                paginatedLogs.map((log: InventoryLog) => {
                  const isPositive = log.quantity_changed > 0;
                  const isNegative = log.quantity_changed < 0;

                  return (
                    <Paper
                      key={log.id}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: "1.5px solid",
                        borderColor: "divider",
                        bgcolor: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.25,
                      }}
                    >
                      {/* Linha 1: Produto e Data */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          color="text.primary"
                          sx={{ fontSize: "0.95rem" }}
                        >
                          {log.product_name || `Produto #${log.product_id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                          {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                      </Box>

                      {/* Linha 2: Tipo de Movimentação e Qtd */}
                      <Box
                        sx={{
                          bgcolor: "#F8FAFC",
                          borderRadius: 2,
                          p: 1.25,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {isPositive ? (
                          <Chip
                            icon={<ArrowUpRight size={14} color="#047857" />}
                            label="Entrada"
                            size="small"
                            sx={{
                              bgcolor: "#ECFDF5",
                              color: "#047857",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : isNegative ? (
                          <Chip
                            icon={<ArrowDownRight size={14} color="#B91C1C" />}
                            label="Saída"
                            size="small"
                            sx={{
                              bgcolor: "#FEE2E2",
                              color: "#B91C1C",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          />
                        ) : (
                          <Chip
                            label="Ajuste"
                            size="small"
                            sx={{
                              bgcolor: "#F1F5F9",
                              color: "#475569",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          />
                        )}

                        <Typography
                          variant="body1"
                          fontWeight={800}
                          sx={{
                            fontSize: "1.1rem",
                            color: isPositive ? "success.main" : isNegative ? "error.main" : "text.primary",
                          }}
                        >
                          {isPositive ? `+${log.quantity_changed}` : log.quantity_changed}
                        </Typography>
                      </Box>

                      {/* Linha 3: Motivo */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <FileText size={14} color="#64748B" style={{ flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary">
                          {log.description || "Sem motivo informado"}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })
              )}

              {/* Paginação Mobile */}
              {logs.length > 0 && (
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
                    {logPage * logRowsPerPage + 1}–
                    {Math.min((logPage + 1) * logRowsPerPage, logs.length)} de {logs.length}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                      disabled={logPage === 0}
                    >
                      <ChevronLeft size={18} />
                    </IconButton>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {logPage + 1} / {Math.max(1, Math.ceil(logs.length / logRowsPerPage))}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setLogPage((p) => p + 1)}
                      disabled={logPage >= Math.ceil(logs.length / logRowsPerPage) - 1}
                    >
                      <ChevronRight size={18} />
                    </IconButton>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : (
            /* Visualização Desktop em Tabela */
            <>
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Qtd.</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Motivo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedLogs.map((log: InventoryLog) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
                        </TableCell>
                        <TableCell>
                          {log.product_name || `Produto #${log.product_id}`}
                        </TableCell>
                        <TableCell>
                          {getLogTypeLabel(log.quantity_changed)}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight="bold"
                            color={
                              log.quantity_changed > 0
                                ? "success.main"
                                : "error.main"
                            }
                          >
                            {log.quantity_changed > 0 ? "+" : ""}
                            {log.quantity_changed}
                          </Typography>
                        </TableCell>
                        <TableCell>{log.description || "-"}</TableCell>
                      </TableRow>
                    ))}

                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Nenhuma movimentação registrada.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={logs.length}
                page={logPage}
                onPageChange={(_, newPage) => setLogPage(newPage)}
                rowsPerPage={logRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setLogRowsPerPage(parseInt(e.target.value, 10));
                  setLogPage(0);
                }}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count !== -1 ? count : `mais que ${to}`}`
                }
              />
            </>
          )}
        </TabPanel>
      </Paper>

      {isModalOpen && (
        <AdjustStockModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
        />
      )}
    </Box>
  );
}
