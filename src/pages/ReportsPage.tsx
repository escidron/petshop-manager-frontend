import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
} from "@mui/material";
import { useState, useMemo, useRef, useEffect } from "react";
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

  // Active Tab: resumo | extrato | comissoes | estoque
  const activeTab =
    searchParams.get("tab") ||
    searchParams.get("subtab") ||
    (searchParams.get("category") === "estoque" ? "estoque" : "resumo");

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  // Ref para o container de meses começar rolado para a direita (mês atual sempre visível)
  const monthsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (monthsContainerRef.current) {
      monthsContainerRef.current.scrollLeft = monthsContainerRef.current.scrollWidth;
    }
  }, []);

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
    <Box
      sx={{
        width: "100%",
        maxWidth: "1400px",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
      }}
    >
      <Typography variant="h5" fontWeight={700} sx={{ mb: { xs: 2, sm: 2.5 } }}>
        Relatórios Gerenciais
      </Typography>

      {/* Abas Unificadas em Linha Única (Sem Frente de Caixa, cabem 100% no mobile) */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => handleTabChange(val)}
          aria-label="Abas de Relatórios"
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              backgroundColor: "#313485",
            },
          }}
          sx={{
            "& .MuiTabs-flexContainer": {
              display: "flex",
              justifyContent: "space-between",
            },
            "& .MuiTab-root": {
              color: "#71717A",
              fontWeight: 700,
              fontSize: { xs: "0.82rem", sm: "0.92rem" },
              minHeight: 44,
              px: { xs: 0.5, sm: 2 },
              minWidth: 0,
              flex: 1,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&.Mui-selected": {
                color: "#313485",
              },
            },
          }}
        >
          <Tab label="Resumo" value="resumo" />
          <Tab label="Extrato" value="extrato" />
          <Tab label="Comissões" value="comissoes" />
          <Tab label="Estoque" value="estoque" />
        </Tabs>
      </Box>

      {/* Barra de Filtros de Data */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: { xs: 1.75, lg: 3 },
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: "space-between",
          }}
        >
          {/* Quick Month Buttons Row (Inicia rolado para a direita para mostrar o mês atual) */}
          <Box
            ref={monthsContainerRef}
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              pb: { xs: 0.5, lg: 0 },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              alignItems: "center",
            }}
          >
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
                    minWidth: 54,
                    height: 32,
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: "none",
                    flexShrink: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  {m.label}
                </Button>
              );
            })}
          </Box>

          {/* Seleção de Período Personalizado com Calendário Padronizado */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "160px 160px" },
                gap: 1.25,
                alignItems: "center",
                width: { xs: "100%", lg: "auto" },
              }}
            >
              <DatePicker
                label="De"
                format="DD/MM/YYYY"
                value={startDate}
                onChange={(val) => setStartDate(val)}
                dayOfWeekFormatter={(day: Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                          bgcolor: "#313485 !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: {
                    size: "small",
                    fullWidth: true,
                    placeholder: "DD/MM/AAAA",
                    sx: {
                      bgcolor: "#FAFAFA",
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.8rem", sm: "0.85rem" },
                        whiteSpace: "nowrap",
                        py: 1,
                        px: { xs: 0.75, sm: 1 },
                      },
                      "& .MuiInputAdornment-root": {
                        ml: 0.25,
                      },
                      "& .MuiIconButton-root": {
                        p: 0.5,
                      },
                    },
                  },
                }}
              />
              <DatePicker
                label="Até"
                format="DD/MM/YYYY"
                value={endDate}
                onChange={(val) => setEndDate(val)}
                dayOfWeekFormatter={(day: Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                          bgcolor: "#313485 !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: {
                    size: "small",
                    fullWidth: true,
                    placeholder: "DD/MM/AAAA",
                    sx: {
                      bgcolor: "#FAFAFA",
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.8rem", sm: "0.85rem" },
                        whiteSpace: "nowrap",
                        py: 1,
                        px: { xs: 0.75, sm: 1 },
                      },
                      "& .MuiInputAdornment-root": {
                        ml: 0.25,
                      },
                      "& .MuiIconButton-root": {
                        p: 0.5,
                      },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </Paper>

      {/* Render Active Content */}
      <Box>
        {activeTab === "resumo" && (
          <SalesSummaryReport startDate={startDate} endDate={endDate} />
        )}
        
        {activeTab === "extrato" && (
          <FinancialReportPage
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            hideFilters={true}
          />
        )}

        {activeTab === "comissoes" && (
          <CommissionReportPage
            startDate={startDate}
            endDate={endDate}
            hideFilters={true}
          />
        )}

        {activeTab === "estoque" && (
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
