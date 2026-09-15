import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Search,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ListFilter,
} from "lucide-react";
import dayjs from "dayjs";
import type { BillStatus, BillFilters } from "./types";
import type { DREAccount } from "../../../api/services/financial";
import type { Supplier } from "../../suppliers/types";

interface Props {
  filters: BillFilters;
  onFilterChange: (newFilters: Partial<BillFilters>) => void;
  categories: DREAccount[];
  suppliers: Supplier[];
}

type PeriodPreset = "this_month" | "today" | "next_7_days" | "next_30_days" | "overdue" | "custom" | "all";

export default function BillFilterBar({
  filters,
  onFilterChange,
  categories,
  suppliers,
}: Props) {
  const [activePeriod, setActivePeriod] = useState<PeriodPreset>("this_month");
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Atualiza datas com base no preset
  const handlePeriodChange = (preset: PeriodPreset) => {
    setActivePeriod(preset);
    const today = dayjs();

    if (preset === "this_month") {
      onFilterChange({
        start_date: today.startOf("month").format("YYYY-MM-DD"),
        end_date: today.endOf("month").format("YYYY-MM-DD"),
        status: "all",
      });
    } else if (preset === "today") {
      onFilterChange({
        start_date: today.format("YYYY-MM-DD"),
        end_date: today.format("YYYY-MM-DD"),
        status: "all",
      });
    } else if (preset === "next_7_days") {
      onFilterChange({
        start_date: today.format("YYYY-MM-DD"),
        end_date: today.add(7, "day").format("YYYY-MM-DD"),
        status: "pending",
      });
    } else if (preset === "next_30_days") {
      onFilterChange({
        start_date: today.format("YYYY-MM-DD"),
        end_date: today.add(30, "day").format("YYYY-MM-DD"),
        status: "pending",
      });
    } else if (preset === "overdue") {
      onFilterChange({
        start_date: undefined,
        end_date: today.subtract(1, "day").format("YYYY-MM-DD"),
        status: "overdue",
      });
    } else if (preset === "all") {
      onFilterChange({
        start_date: undefined,
        end_date: undefined,
      });
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFilterChange({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        bgcolor: "background.paper",
      }}
    >
      {/* Linha Superior: Abas Tipo (Todas / A Pagar / A Receber) + Atalhos de Período */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.5,
          mb: 2,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={filters.bill_type || "all"}
          onChange={(_, val) => onFilterChange({ bill_type: val, page: 1 })}
          sx={{
            minHeight: 38,
            "& .MuiTab-root": {
              minHeight: 38,
              py: 0.5,
              px: 2,
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "none",
              borderRadius: 2,
            },
          }}
        >
          <Tab
            value="all"
            label="Todas as Contas"
            icon={<ListFilter size={16} />}
            iconPosition="start"
          />
          <Tab
            value="payable"
            label="A Pagar (Despesas)"
            icon={<ArrowUpRight size={16} color="#EF4444" />}
            iconPosition="start"
            sx={{ "&.Mui-selected": { color: "#DC2626" } }}
          />
          <Tab
            value="receivable"
            label="A Receber (Receitas)"
            icon={<ArrowDownLeft size={16} color="#10B981" />}
            iconPosition="start"
            sx={{ "&.Mui-selected": { color: "#059669" } }}
          />
        </Tabs>

        {/* Atalhos Rápidos de Período */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label="Este Mês"
            size="small"
            clickable
            color={activePeriod === "this_month" ? "primary" : "default"}
            variant={activePeriod === "this_month" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("this_month")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
          <Chip
            label="Hoje"
            size="small"
            clickable
            color={activePeriod === "today" ? "primary" : "default"}
            variant={activePeriod === "today" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("today")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
          <Chip
            label="Próx. 7 dias"
            size="small"
            clickable
            color={activePeriod === "next_7_days" ? "primary" : "default"}
            variant={activePeriod === "next_7_days" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("next_7_days")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
          <Chip
            label="Próx. 30 dias"
            size="small"
            clickable
            color={activePeriod === "next_30_days" ? "primary" : "default"}
            variant={activePeriod === "next_30_days" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("next_30_days")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
          <Chip
            label="Vencidos"
            size="small"
            clickable
            color={activePeriod === "overdue" ? "error" : "default"}
            variant={activePeriod === "overdue" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("overdue")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
          <Chip
            label="Todas as datas"
            size="small"
            clickable
            color={activePeriod === "all" ? "primary" : "default"}
            variant={activePeriod === "all" ? "filled" : "outlined"}
            onClick={() => handlePeriodChange("all")}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        </Box>
      </Box>

      {/* Linha Inferior: Filtros de Detalhe (Busca, Status, Datas Custom, Categoria DRE) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "2fr 1fr 1fr 1.2fr",
            lg: "2fr 1fr 1fr 1.2fr 1.2fr",
          },
          gap: 1.5,
          alignItems: "center",
        }}
      >
        {/* Campo de Busca */}
        <TextField
          size="small"
          placeholder="Buscar descrição, doc ou código..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9CA3AF" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchInput("")}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ bgcolor: "background.paper" }}
        />

        {/* Status */}
        <FormControl size="small">
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={filters.status || "all"}
            label="Status"
            onChange={(e) => onFilterChange({ status: e.target.value as BillStatus | "all", page: 1 })}
          >
            <MenuItem value="all">Todos os Status</MenuItem>
            <MenuItem value="pending">Pendente (A Vencer)</MenuItem>
            <MenuItem value="paid">Liquidado (Pago)</MenuItem>
            <MenuItem value="overdue">Vencido</MenuItem>
            <MenuItem value="canceled">Cancelado</MenuItem>
          </Select>
        </FormControl>

        {/* Data Início */}
        <TextField
          size="small"
          type="date"
          label="Data Vencimento (De)"
          InputLabelProps={{ shrink: true }}
          value={filters.start_date || ""}
          onChange={(e) => {
            setActivePeriod("custom");
            onFilterChange({ start_date: e.target.value || undefined, page: 1 });
          }}
        />

        {/* Data Fim */}
        <TextField
          size="small"
          type="date"
          label="Data Vencimento (Até)"
          InputLabelProps={{ shrink: true }}
          value={filters.end_date || ""}
          onChange={(e) => {
            setActivePeriod("custom");
            onFilterChange({ end_date: e.target.value || undefined, page: 1 });
          }}
        />

        {/* Categoria DRE */}
        <FormControl size="small">
          <InputLabel id="category-filter-label">Categoria DRE</InputLabel>
          <Select
            labelId="category-filter-label"
            value={filters.category_id || ""}
            label="Categoria DRE"
            onChange={(e) =>
              onFilterChange({
                category_id: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
          >
            <MenuItem value="">Todas as Categorias</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.code ? `[${c.code}] ` : ""}{c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Fornecedor (quando filtrando a pagar) */}
        {filters.bill_type === "payable" && (
          <FormControl size="small">
            <InputLabel id="supplier-filter-label">Fornecedor</InputLabel>
            <Select
              labelId="supplier-filter-label"
              value={filters.supplier_id || ""}
              label="Fornecedor"
              onChange={(e) =>
                onFilterChange({
                  supplier_id: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <MenuItem value="">Todos os Fornecedores</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Paper>
  );
}
