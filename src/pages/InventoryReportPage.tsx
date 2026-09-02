import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
dayjs.locale("pt-br");
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart2, Package, TrendingUp, Search } from "lucide-react";
import { fetchGlobalInventoryLogs, fetchProducts } from "../api/services/products";
import theme from "../theme";
import type { Product } from "../features/products/types";
import type { InventoryLog } from "../features/inventory/schemas";

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

const LOG_TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Saída",
  sale: "Venda",
  adjustment: "Ajuste",
  manual_adjustment: "Ajuste Manual",
};

const LOG_TYPE_COLORS: Record<
  string,
  "success" | "error" | "warning" | "default"
> = {
  in: "success",
  out: "error",
  sale: "warning",
  adjustment: "default",
  manual_adjustment: "default",
};

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ReportCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.5, sm: 2 },
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: 0.75,
      border: "1.5px solid",
      borderColor: "divider",
      borderTop: `4px solid ${color}`,
      borderRadius: 2.5,
      bgcolor: "#FFFFFF",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          fontSize: { xs: "0.68rem", sm: "0.75rem" },
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
    </Box>
    <Typography
      variant="h6"
      sx={{
        fontWeight: 800,
        color: "#111827",
        fontSize: { xs: "1.1rem", sm: "1.3rem" },
        lineHeight: 1.2,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

export default function InventoryReportPage({
  startDate: propStartDate,
  endDate: propEndDate,
  hideFilters = false,
}: {
  startDate?: dayjs.Dayjs | null;
  endDate?: dayjs.Dayjs | null;
  hideFilters?: boolean;
} = {}) {
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });
  const products: Product[] = productsData || [];

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["inventory-logs"],
    queryFn: () => fetchGlobalInventoryLogs(),
  });
  const logs: InventoryLog[] = logsData || [];

  const isLoading = loadingProducts || loadingLogs;

  const summary = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.quantity <= p.min_stock).length;
    const stockValue = products.reduce(
      (acc, p) => acc + p.quantity * (p.cost_cents ?? p.price_cents),
      0,
    );

    const filteredByDate = logs.filter((l) => {
      const from = propStartDate ? propStartDate : (filterFrom ? dayjs(filterFrom) : null);
      const to = propEndDate ? propEndDate : (filterTo ? dayjs(filterTo) : null);
      if (from && dayjs(l.created_at).isBefore(from.startOf("day")))
        return false;
      if (to && dayjs(l.created_at).isAfter(to.endOf("day")))
        return false;
      return true;
    });

    return { totalProducts, lowStock, stockValue, movementsInPeriod: filteredByDate.length };
  }, [products, logs, filterFrom, filterTo, propStartDate, propEndDate]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const from = propStartDate ? propStartDate : (filterFrom ? dayjs(filterFrom) : null);
      const to = propEndDate ? propEndDate : (filterTo ? dayjs(filterTo) : null);
      if (from && dayjs(l.created_at).isBefore(from.startOf("day")))
        return false;
      if (to && dayjs(l.created_at).isAfter(to.endOf("day")))
        return false;
      if (filterType && l.log_type !== filterType) return false;
      if (
        filterProduct &&
        !(l.product_name ?? "").toLowerCase().includes(filterProduct.toLowerCase())
      )
        return false;
      return true;
    });
  }, [logs, filterFrom, filterTo, filterType, filterProduct, propStartDate, propEndDate]);

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: hideFilters ? 0 : { xs: 1.5, sm: 2.5, md: 3 },
        maxWidth: "1400px",
      }}
    >
      {!hideFilters && (
        <Typography variant="h5" fontWeight={700} mb={3}>
          Relatório de Estoque
        </Typography>
      )}

      {/* 4 Indicadores em Grid 2x2 (mobile) e 4 colunas (desktop) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
        }}
      >
        <ReportCard
          icon={<Package size={20} />}
          label="TOTAL PRODUTOS"
          value={summary.totalProducts}
          color={theme.palette.primary.main}
        />
        <ReportCard
          icon={<AlertTriangle size={20} />}
          label="ESTOQUE BAIXO"
          value={summary.lowStock}
          color={theme.palette.error.main}
        />
        <ReportCard
          icon={<TrendingUp size={20} />}
          label="VALOR ESTOQUE"
          value={fmtBRL(summary.stockValue)}
          color={theme.palette.success.main}
        />
        <ReportCard
          icon={<BarChart2 size={20} />}
          label="MOVIMENTAÇÕES"
          value={summary.movementsInPeriod}
          color={theme.palette.info.main}
        />
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          {!hideFilters && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>De:</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={filterFrom ? dayjs(filterFrom) : null}
                    onChange={(newDate) => {
                      if (newDate && newDate.isValid()) setFilterFrom(newDate.format("YYYY-MM-DD"));
                      else setFilterFrom("");
                    }}
                    dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                      const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                      return days[day.day()];
                    }}
                    slotProps={{
                      popper: {
                        sx: {
                          "& .MuiDayCalendar-weekDayLabel": { color: "#3d4048 !important", fontWeight: 700, fontSize: "0.75rem" },
                          "& .MuiPickersDay-root": { color: "#3d4048 !important", "&.Mui-selected": { color: "white !important" } },
                          "& .MuiPickersCalendarHeader-label": { color: "#3d4048 !important" },
                          "& .MuiPickersArrowSwitcher-button": { color: "#3d4048 !important" },
                        },
                      },
                      textField: { size: "small", placeholder: "DD/MM/AAAA", inputMode: "numeric" },
                      actionBar: { actions: [] },
                    }}
                  />
                </LocalizationProvider>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ ml: 1 }}>Até:</Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={filterTo ? dayjs(filterTo) : null}
                    onChange={(newDate) => {
                      if (newDate && newDate.isValid()) setFilterTo(newDate.format("YYYY-MM-DD"));
                      else setFilterTo("");
                    }}
                    dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                      const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                      return days[day.day()];
                    }}
                    slotProps={{
                      popper: {
                        sx: {
                          "& .MuiDayCalendar-weekDayLabel": { color: "#3d4048 !important", fontWeight: 700, fontSize: "0.75rem" },
                          "& .MuiPickersDay-root": { color: "#3d4048 !important", "&.Mui-selected": { color: "white !important" } },
                          "& .MuiPickersCalendarHeader-label": { color: "#3d4048 !important" },
                          "& .MuiPickersArrowSwitcher-button": { color: "#3d4048 !important" },
                        },
                      },
                      textField: { size: "small", placeholder: "DD/MM/AAAA", inputMode: "numeric" },
                      actionBar: { actions: [] },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </>
          )}
          <Select
            size="small"
            displayEmpty
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ width: { xs: "100%", sm: 160 } }}
          >
            <MenuItem value=""><em>Tipo (Todos)</em></MenuItem>
            <MenuItem value="in">Entrada</MenuItem>
            <MenuItem value="out">Saída</MenuItem>
            <MenuItem value="sale">Venda</MenuItem>
            <MenuItem value="adjustment">Ajuste</MenuItem>
            <MenuItem value="manual_adjustment">Ajuste Manual</MenuItem>
          </Select>
          <TextField
            size="small"
            placeholder="Buscar produto"
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: "100%", sm: 220 } }}
          />
        </Box>
      </Paper>

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
              <Typography color="text.secondary">
                Nenhuma movimentação encontrada para os filtros selecionados.
              </Typography>
            </Paper>
          ) : (
            filtered.map((log) => (
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
                  gap: 1,
                }}
              >
                {/* Linha 1: Produto e Quantidade */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ fontSize: "0.98rem", lineHeight: 1.3 }}>
                      {log.product_name ?? `#${log.product_id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    fontWeight={800}
                    sx={{
                      fontSize: "1.1rem",
                      whiteSpace: "nowrap",
                      color:
                        log.quantity_changed > 0
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                    }}
                  >
                    {log.quantity_changed > 0 ? "+" : ""}
                    {log.quantity_changed}
                  </Typography>
                </Box>

                {/* Linha 2: Tipo e Observações */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pt: 0.75,
                    borderTop: "1px dashed #E2E8F0",
                    flexWrap: "wrap",
                    gap: 0.75,
                  }}
                >
                  <Chip
                    label={LOG_TYPE_LABELS[log.log_type] ?? log.log_type}
                    color={LOG_TYPE_COLORS[log.log_type] ?? "default"}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.72rem", fontWeight: 600 }}
                  />

                  {log.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                      {log.description}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Data</TableCell>
                <TableCell sx={headerCellSx}>Produto</TableCell>
                <TableCell sx={headerCellSx}>Tipo</TableCell>
                <TableCell sx={headerCellSx} align="right">Quantidade</TableCell>
                <TableCell sx={headerCellSx}>Observações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {dayjs(log.created_at).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell>{log.product_name ?? `#${log.product_id}`}</TableCell>
                  <TableCell>
                    <Chip
                      label={LOG_TYPE_LABELS[log.log_type] ?? log.log_type}
                      color={LOG_TYPE_COLORS[log.log_type] ?? "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color:
                        log.quantity_changed > 0
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                    }}
                  >
                    {log.quantity_changed > 0 ? "+" : ""}
                    {log.quantity_changed}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {log.description ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.disabled">
                      Nenhuma movimentação encontrada para os filtros selecionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
