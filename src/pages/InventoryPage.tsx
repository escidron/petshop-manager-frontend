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
  TextField,
  InputAdornment,
} from "@mui/material";
import { Plus, AlertTriangle, Search } from "lucide-react";
import { useState } from "react";
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
        height: "100%",
        flexGrow: value === index ? 1 : 0,
        overflow: "hidden",
      }}
    >
      {value === index && (
        <Box
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
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

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["inventory_logs"],
    queryFn: fetchGlobalInventoryLogs,
  });

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
        />
      );
    }
    return (
      <Chip
        label="Saída"
        size="small"
        color="error"
        variant="outlined"
      />
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: 3,
        maxWidth: "1200px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => handleOpenAdjust()}
        >
          Ajuste Avulso
        </Button>
      </Box>

      <Paper
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": { color: "text.primary", fontWeight: 600 },
              "& .Mui-selected": { color: "primary.main" },
            }}
            indicatorColor="primary"
          >
            <Tab label="Posição de Estoque" />
            <Tab label="Histórico de Movimentações" />
          </Tabs>
        </Box>

        {/* Tab 1: Posição de Estoque */}
        <TabPanel value={tabValue} index={0}>
          <TextField
            size="small"
            placeholder="Buscar produto..."
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="gray" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, width: 300 }}
          />
          {loadingProducts ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "40%" }}>Produto</TableCell>
                    <TableCell align="center" sx={{ width: "15%" }}>Estoque Atual</TableCell>
                    <TableCell align="center" sx={{ width: "15%" }}>Estoque Mínimo</TableCell>
                    <TableCell align="center" sx={{ width: "20%" }}>Status</TableCell>
                    <TableCell align="right" sx={{ width: "10%" }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...products]
                    .filter((p) =>
                      p.name.toLowerCase().includes(stockSearch.toLowerCase()),
                    )
                    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                    .map((product: Product) => {
                    const isLow = product.quantity <= (product.min_stock || 0);
                    return (
                      <TableRow key={product.id}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {product.name}
                        </TableCell>
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
                            onClick={() => handleOpenAdjust(product)}
                          >
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="text.primary">
                          Nenhum produto cadastrado que controle estoque.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab 2: Histórico */}
        <TabPanel value={tabValue} index={1}>
          {loadingLogs ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">Qtd.</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log: InventoryLog) => (
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
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="text.primary">
                          Nenhuma movimentação registrada.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
