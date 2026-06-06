import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
} from "@mui/material";
import { useState, useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";

import SalesSummaryReport from "../features/reports/SalesSummaryReport";
import FinancialReportPage from "./FinancialReportPage";
import CommissionReportPage from "./CommissionReportPage";
import InventoryReportPage from "./InventoryReportPage";

dayjs.locale("pt-br");

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Date states shared across tabs
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf("day"));

  // Active Category (vendas, estoque)
  const activeCategory = searchParams.get("category") || "vendas";
  // Active Subtab under Vendas (resumo, extrato, comissoes)
  const activeSubTab = searchParams.get("subtab") || "resumo";

  const handleCategoryChange = (newCat: string) => {
    setSearchParams({
      category: newCat,
      subtab: newCat === "vendas" ? "resumo" : "",
    });
  };

  const handleSubTabChange = (newSub: string) => {
    setSearchParams({
      category: activeCategory,
      subtab: newSub,
    });
  };

  // Generate dynamic last 9 months selector
  const months = useMemo(() => {
    const list = [];
    const now = dayjs();
    for (let i = 8; i >= 0; i--) {
      const d = now.subtract(i, "month");
      list.push({
        label: d.format("MMM").toUpperCase().replace(".", ""),
        month: d.month(),
        year: d.year(),
        d,
      });
    }
    return list;
  }, []);

  const handleSelectMonth = (m: { d: Dayjs }) => {
    setStartDate(m.d.startOf("month"));
    setEndDate(m.d.endOf("month"));
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "1400px", mx: "auto", p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Relatórios Gerenciais
      </Typography>

      {/* Main Categories Row */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeCategory}
          onChange={(_, val) => handleCategoryChange(val)}
          aria-label="Categorias de Relatórios"
          TabIndicatorProps={{
            style: {
              backgroundColor: "#313485",
            }
          }}
          sx={{
            "& .MuiTab-root": {
              color: "#71717A",
              fontWeight: 700,
              "&.Mui-selected": {
                color: "#313485",
              },
            },
          }}
        >
          <Tab label="Vendas & Faturamento" value="vendas" />
          <Tab label="Gestão de Estoques" value="estoque" />
        </Tabs>
      </Box>

      {/* Subtabs for Vendas Category */}
      {activeCategory === "vendas" && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3, mt: -1 }}>
          <Tabs
            value={activeSubTab}
            onChange={(_, val) => handleSubTabChange(val)}
            aria-label="Sub-abas de Vendas"
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              style: {
                backgroundColor: "#313485",
              }
            }}
            sx={{
              "& .MuiTab-root": {
                color: "#71717A",
                fontSize: "0.875rem",
                py: 1,
                minHeight: 0,
                fontWeight: 600,
                "&.Mui-selected": {
                  color: "#313485",
                },
              },
            }}
          >
            <Tab label="Resumo" value="resumo" />
            <Tab label="Extrato de Vendas" value="extrato" />
            <Tab label="Comissões" value="comissoes" />
          </Tabs>
        </Box>
      )}

      {/* Shared Date Filters Bar (Padrão BemPrático) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Quick Month Buttons Row */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {months.map((m) => {
              const isActive =
                startDate &&
                endDate &&
                startDate.month() === m.month &&
                startDate.year() === m.year &&
                endDate.month() === m.month &&
                endDate.year() === m.year &&
                startDate.date() === 1;
              return (
                <Button
                  key={m.label}
                  variant={isActive ? "contained" : "outlined"}
                  color={isActive ? "success" : "inherit"}
                  size="small"
                  onClick={() => handleSelectMonth(m)}
                  sx={{
                    minWidth: 55,
                    height: 32,
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  {m.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                  De
                </Typography>
                <DatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  slotProps={{ textField: { size: "small", sx: { width: 165 } } }}
                />
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                  Até
                </Typography>
                <DatePicker
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  slotProps={{ textField: { size: "small", sx: { width: 165 } } }}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        </Box>
      </Paper>

      {/* Render Active Content */}
      <Box>
        {activeCategory === "vendas" && activeSubTab === "resumo" && (
          <SalesSummaryReport startDate={startDate} endDate={endDate} />
        )}
        
        {activeCategory === "vendas" && activeSubTab === "extrato" && (
          <FinancialReportPage
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            hideFilters={true}
          />
        )}

        {activeCategory === "vendas" && activeSubTab === "comissoes" && (
          <CommissionReportPage
            startDate={startDate}
            endDate={endDate}
            hideFilters={true}
          />
        )}

        {activeCategory === "estoque" && (
          <InventoryReportPage
            startDate={startDate}
            endDate={endDate}
            hideFilters={true}
          />
        )}
      </Box>
    </Box>
  );
}
