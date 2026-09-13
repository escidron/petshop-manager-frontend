import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Card,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Autocomplete,
  TextField,
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  ChartNoAxesCombined,
  Scissors,
  Award,
  BarChart3,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getOperationalResult,
  exportOperationalResultExcel,
  type OperationalResultResponse,
  type OperationalStratifiedItem,
} from "../api/services/operationalResult";
import { toast } from "react-toastify";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface ServiceAutocompleteFilterProps {
  allServices: string[];
  selectedServices: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

function ServiceAutocompleteFilter({
  allServices,
  selectedServices,
  onChange,
  label = "Filtrar serviços",
}: ServiceAutocompleteFilterProps) {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      size="small"
      options={allServices}
      value={selectedServices}
      isOptionEqualToValue={(option, val) => option === val}
      onChange={(_, newValue) => {
        const uniqueValues = Array.from(new Set(newValue));
        onChange(uniqueValues);
      }}
      noOptionsText="Nenhum serviço encontrado"
      PaperComponent={({ children, ...paperProps }) => (
        <Paper {...paperProps} elevation={6} sx={{ borderRadius: 2, mt: 0.5, minWidth: 280 }}>
          <Box
            onMouseDown={(e) => {
              // Previne que o input perca o foco e feche o dropdown antes do click
              e.preventDefault();
            }}
            sx={{
              p: 1,
              px: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {selectedServices.length} de {allServices.length} selecionados
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              <Button
                size="small"
                variant="outlined"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([...allServices]);
                }}
                sx={{
                  fontSize: "0.72rem",
                  py: 0.2,
                  px: 0.85,
                  minWidth: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Todos
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }}
                sx={{
                  fontSize: "0.72rem",
                  py: 0.2,
                  px: 0.85,
                  minWidth: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Nenhum
              </Button>
            </Box>
          </Box>
          {children}
        </Paper>
      )}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={option}>
          <Checkbox
            size="small"
            checked={selected}
            sx={{ mr: 1, p: 0.25 }}
          />
          <ListItemText
            primary={option}
            primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }}
          />
        </li>
      )}
      renderTags={(value) => {
        if (value.length === allServices.length) {
          return (
            <Chip
              size="small"
              label={`Todos (${allServices.length})`}
              color="primary"
              variant="outlined"
              sx={{ height: 24, fontSize: "0.72rem", fontWeight: 700 }}
            />
          );
        }
        if (value.length === 0) {
          return (
            <Chip
              size="small"
              label="Nenhum (0)"
              color="error"
              variant="outlined"
              sx={{ height: 24, fontSize: "0.72rem", fontWeight: 700 }}
            />
          );
        }
        if (value.length === 1) {
          return (
            <Chip
              size="small"
              label={value[0]}
              color="primary"
              sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600, maxWidth: 140 }}
            />
          );
        }
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              size="small"
              label={value[0]}
              sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600, maxWidth: 110 }}
            />
            <Chip
              size="small"
              label={`+${value.length - 1}`}
              color="primary"
              sx={{ height: 24, fontSize: "0.72rem", fontWeight: 700 }}
            />
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={selectedServices.length === 0 ? "Buscar serviços..." : ""}
          label={label}
          InputLabelProps={{ shrink: true, sx: { fontSize: "0.85rem", fontWeight: 700 } }}
          sx={{
            "& .MuiInputBase-root": {
              fontSize: "0.8rem",
              py: 0.25,
              borderRadius: 2,
            },
          }}
        />
      )}
      sx={{
        width: { xs: "100%", sm: 280, md: 320 },
        minWidth: 220,
      }}
    />
  );
}

export default function OperationalResultPage() {
  const theme = useTheme();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Matriz Diária, 1 = Gráficos & Comparativo
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Consulta dos dados operacionais
  const { data: opData, isLoading, isError } = useQuery<OperationalResultResponse>({
    queryKey: ["operational-result", selectedYear, selectedMonth],
    queryFn: () => getOperationalResult(selectedYear, selectedMonth),
  });

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await exportOperationalResultExcel(selectedYear, selectedMonth);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resultado_Operacional_${String(selectedMonth).padStart(2, "0")}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Planilha Excel exportada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar planilha Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const summary = opData?.summary;
  const daysMeta = opData?.days_metadata || [];
  const rows = opData?.rows || [];
  const dailyTotals = opData?.daily_totals || {};

  // Lista direta de serviços do petshop ordenados alfabeticamente (sem agrupadores)
  const sortedServices = useMemo(() => {
    return [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    );
  }, [rows]);

  // Lista de todos os nomes únicos de serviços cadastrados
  const allServiceNames = useMemo(() => {
    const names = sortedServices.map((s) => s.name.trim()).filter(Boolean);
    return Array.from(new Set(names));
  }, [sortedServices]);

  // Estados dos filtros de serviços por gráfico (null = todos marcados por default)
  const [selectedServicesChart1, setSelectedServicesChart1] = useState<string[] | null>(null);
  const [selectedServicesChart2, setSelectedServicesChart2] = useState<string[] | null>(null);
  const [selectedServicesAnnual, setSelectedServicesAnnual] = useState<string[] | null>(null);

  const effectiveSelectedChart1 = useMemo(() => {
    if (selectedServicesChart1 === null) return allServiceNames;
    return selectedServicesChart1;
  }, [selectedServicesChart1, allServiceNames]);

  const effectiveSelectedChart2 = useMemo(() => {
    if (selectedServicesChart2 === null) return allServiceNames;
    return selectedServicesChart2;
  }, [selectedServicesChart2, allServiceNames]);

  const effectiveSelectedAnnual = useMemo(() => {
    if (selectedServicesAnnual === null) return allServiceNames;
    return selectedServicesAnnual;
  }, [selectedServicesAnnual, allServiceNames]);

  // ── Gráfico 1: Serviços Estratificados (Agrupados por nome único) ──
  const filteredStratified = useMemo(() => {
    if (!opData?.stratified_services) return [];
    const selectedSet = new Set(effectiveSelectedChart1);
    const map = new Map<string, OperationalStratifiedItem>();

    for (const item of opData.stratified_services) {
      if (!selectedSet.has(item.name)) continue;
      if (!map.has(item.name)) {
        map.set(item.name, { ...item });
      } else {
        const existing = map.get(item.name)!;
        existing.count += item.count;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      // Ordenação decrescente por quantidade (da maior para a menor barra)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Desempate alfabético
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }, [opData?.stratified_services, effectiveSelectedChart1]);

  const totalFilteredChart1 = useMemo(() => {
    return filteredStratified.reduce((acc, item) => acc + item.count, 0);
  }, [filteredStratified]);

  // ── Gráfico 2: Volume Serviços / Dia ──
  const filteredDailyTotals = useMemo(() => {
    const selectedSet = new Set(effectiveSelectedChart2);
    const totals: Record<number, number> = {};
    daysMeta.forEach((dm) => {
      totals[dm.day] = 0;
    });
    sortedServices.forEach((row) => {
      if (selectedSet.has(row.name)) {
        Object.entries(row.daily_counts).forEach(([dayStr, cnt]) => {
          const d = Number(dayStr);
          totals[d] = (totals[d] || 0) + cnt;
        });
      }
    });
    return totals;
  }, [sortedServices, effectiveSelectedChart2, daysMeta]);

  const totalFilteredChart2 = useMemo(() => {
    return Object.values(filteredDailyTotals).reduce((a, b) => a + b, 0);
  }, [filteredDailyTotals]);

  // ── Gráfico 3: Comparativo Anual ──
  const filteredAnnualCurrent = useMemo(() => {
    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = 0;

    if (effectiveSelectedAnnual.length === allServiceNames.length) {
      return opData?.annual_comparison?.monthly_volume_current || monthly;
    }

    const svcData = opData?.annual_comparison?.service_monthly_current;
    if (svcData) {
      const selectedSet = new Set(effectiveSelectedAnnual);
      Object.entries(svcData).forEach(([srvName, mMap]) => {
        if (selectedSet.has(srvName)) {
          Object.entries(mMap).forEach(([mStr, cnt]) => {
            const m = Number(mStr);
            monthly[m] = (monthly[m] || 0) + cnt;
          });
        }
      });
    }
    return monthly;
  }, [opData?.annual_comparison, effectiveSelectedAnnual, allServiceNames]);

  const filteredAnnualPrevious = useMemo(() => {
    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = 0;

    if (effectiveSelectedAnnual.length === allServiceNames.length) {
      return opData?.annual_comparison?.monthly_volume_previous || monthly;
    }

    const svcData = opData?.annual_comparison?.service_monthly_previous;
    if (svcData) {
      const selectedSet = new Set(effectiveSelectedAnnual);
      Object.entries(svcData).forEach(([srvName, mMap]) => {
        if (selectedSet.has(srvName)) {
          Object.entries(mMap).forEach(([mStr, cnt]) => {
            const m = Number(mStr);
            monthly[m] = (monthly[m] || 0) + cnt;
          });
        }
      });
    }
    return monthly;
  }, [opData?.annual_comparison, effectiveSelectedAnnual, allServiceNames]);

  const totalFilteredAnnualCurrent = useMemo(() => {
    return Object.values(filteredAnnualCurrent).reduce((a, b) => a + b, 0);
  }, [filteredAnnualCurrent]);

  const totalFilteredAnnualPrevious = useMemo(() => {
    return Object.values(filteredAnnualPrevious).reduce((a, b) => a + b, 0);
  }, [filteredAnnualPrevious]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        maxHeight: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: "calc(16px + env(safe-area-inset-bottom, 0px))", md: 2 },
        boxSizing: "border-box",
      }}
    >
      {/* ── CABEÇALHO & AÇÕES (ESTILO DRE) ─────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ChartNoAxesCombined size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Resultado Operacional
            </Typography>
            <Chip
              label="Visão Proprietário"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Matriz diária de atendimento, produtividade do Banho & Tosa e indicadores de volume operacional.
          </Typography>
        </Box>

        {/* Toolbar de Ações */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            "@media print": { display: "none" },
          }}
        >
          {/* Navegação Rápida de Mês e Ano */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 0.5,
            }}
          >
            <IconButton size="small" onClick={handlePrevMonth} title="Mês anterior">
              <ChevronLeft size={18} />
            </IconButton>

            <FormControl size="small" variant="standard" sx={{ mx: 1, minWidth: 105 }}>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                disableUnderline
                sx={{ fontSize: "0.875rem", fontWeight: 700, textAlign: "center" }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <MenuItem key={idx + 1} value={idx + 1} sx={{ fontWeight: 600 }}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" variant="standard" sx={{ minWidth: 70 }}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disableUnderline
                sx={{ fontSize: "0.875rem", fontWeight: 700 }}
              >
                {[currentDate.getFullYear() - 2, currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                  <MenuItem key={y} value={y} sx={{ fontWeight: 600 }}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton size="small" onClick={handleNextMonth} title="Próximo mês">
              <ChevronRight size={18} />
            </IconButton>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": { borderColor: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            {isExporting ? "Exportando..." : "Exportar Excel"}
          </Button>

        </Box>
      </Box>

      {/* ── CARDS DE RESUMO EXECUTIVO (KPIs) ─────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
          gap: 1.5,
          mb: 1.5,
          flexShrink: 0,
          "@media print": { display: "grid", gridTemplateColumns: "repeat(5, 1fr)" },
        }}
      >
        {/* Card 1: Volume Total de Serviços */}
        <Card
          elevation={0}
          sx={{
            py: 1,
            px: 1.75,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
              Total de Serviços
            </Typography>
            <Scissors size={16} color={theme.palette.primary.main} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.2rem", lineHeight: 1.2 }}>
              {isLoading ? <CircularProgress size={18} /> : summary?.total_services || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              serviços no mês
            </Typography>
          </Box>
        </Card>

        {/* Card 2: Média / Dia Útil */}
        <Card
          elevation={0}
          sx={{
            py: 1,
            px: 1.75,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `4px solid ${theme.palette.info.main}`,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
              Média de Serviços / Dia Útil
            </Typography>
            <TrendingUp size={16} color={theme.palette.info.main} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.2rem", lineHeight: 1.2 }}>
              {isLoading ? <CircularProgress size={18} /> : summary?.avg_services_per_working_day.toFixed(1) || 0}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="info.main" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              atendimentos/dia
            </Typography>
          </Box>
        </Card>

        {/* Card 3: Dias Úteis Operados */}
        <Card
          elevation={0}
          sx={{
            py: 1,
            px: 1.75,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `4px solid ${theme.palette.success.main}`,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
              Dias Úteis Operados
            </Typography>
            <Calendar size={16} color={theme.palette.success.main} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.2rem", lineHeight: 1.2 }}>
              {isLoading ? <CircularProgress size={18} /> : `${summary?.working_days || 0} dias`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              com atendimento
            </Typography>
          </Box>
        </Card>

        {/* Card 4: Dia de Maior Movimento (Pico) */}
        <Card
          elevation={0}
          sx={{
            py: 1,
            px: 1.75,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `4px solid ${theme.palette.warning.main}`,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
              Dia de Maior Movimento
            </Typography>
            <Flame size={16} color={theme.palette.warning.main} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.2rem", lineHeight: 1.2 }}>
              {isLoading ? <CircularProgress size={18} /> : summary?.peak_day ? `Dia ${String(summary.peak_day).padStart(2, "0")}` : "-"}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              {summary?.peak_day_count ? `${summary.peak_day_count} atendimentos` : "sem movimento"}
            </Typography>
          </Box>
        </Card>

        {/* Card 5: Serviço Mais Realizado (Top 1) */}
        <Card
          elevation={0}
          sx={{
            py: 1,
            px: 1.75,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `4px solid #8B5CF6`,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
              Serviço Mais Realizado
            </Typography>
            <Award size={16} color="#8B5CF6" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
            <Tooltip title={summary?.top_service_name || ""} arrow>
              <Typography
                variant="h6"
                fontWeight={800}
                color="text.primary"
                sx={{
                  fontSize: "1.1rem",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: { xs: 120, sm: 160 },
                }}
              >
                {isLoading ? <CircularProgress size={18} /> : summary?.top_service_name || "-"}
              </Typography>
            </Tooltip>
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.7rem", color: "#8B5CF6", whiteSpace: "nowrap" }}>
              {summary?.top_service_count ? `${summary.top_service_count} (${summary.top_service_pct}%)` : "nenhum"}
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* ── TABS DE VISUALIZAÇÃO ────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1.5, flexShrink: 0, "@media print": { display: "none" } }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.875rem",
              minHeight: 40,
              px: 2,
            },
          }}
        >
          <Tab icon={<Layers size={16} style={{ marginRight: 6 }} />} iconPosition="start" label="Matriz Operacional Diária" />
          <Tab icon={<BarChart3 size={16} style={{ marginRight: 6 }} />} iconPosition="start" label="Gráficos & Análise Comparativa" />
        </Tabs>
      </Box>

      {/* ── TAB 0: MATRIZ OPERACIONAL DIÁRIA (LISTA LIMPA DE SERVIÇOS) ─── */}
      {activeTab === 0 && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "auto",
            position: "relative",
            "&::-webkit-scrollbar": { width: 8, height: 8 },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.18)",
              borderRadius: 4,
            },
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
              <CircularProgress size={40} />
            </Box>
          ) : isError ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="error" sx={{ fontWeight: 600 }}>
                Erro ao carregar os dados operacionais.
              </Typography>
            </Box>
          ) : (
            <Table
              size="small"
              stickyHeader
              sx={{
                width: "100%",
                minWidth: 1200,
                borderCollapse: "separate",
                borderSpacing: 0,
                "& td, & th": { whiteSpace: "nowrap" },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  {/* Nome do Serviço (Único campo inicial fixo) */}
                  <TableCell
                    sx={{
                      width: 250,
                      minWidth: 250,
                      maxWidth: 250,
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      bgcolor: "primary.main",
                      color: "#FFFFFF",
                      position: "sticky",
                      top: 0,
                      left: 0,
                      zIndex: 30,
                      borderRight: "2px solid rgba(255,255,255,0.3)",
                      borderBottom: "2px solid rgba(0,0,0,0.2)",
                      py: 1,
                    }}
                  >
                    SERVIÇO
                  </TableCell>

                  {/* Colunas Diárias do Mês (1..31) */}
                  {daysMeta.map((dm) => {
                    const isClosed = dm.is_closed ?? dm.is_weekend;
                    return (
                      <Tooltip
                        key={dm.day}
                        title={isClosed ? `${dm.day_of_week} ${dm.date_str} - Estabelecimento Fechado` : `${dm.day_of_week} ${dm.date_str}`}
                        arrow
                      >
                        <TableCell
                          sx={{
                            p: 0.5,
                            minWidth: 38,
                            maxWidth: 44,
                            textAlign: "center",
                            bgcolor: isClosed
                              ? alpha(theme.palette.primary.dark, 0.96)
                              : "primary.main",
                            color: "#FFFFFF",
                            borderRight: "1px solid rgba(255,255,255,0.1)",
                            borderBottom: "2px solid rgba(0,0,0,0.2)",
                            lineHeight: 1.15,
                            py: 0.8,
                            position: "sticky",
                            top: 0,
                            zIndex: 20,
                          }}
                        >
                          <Box sx={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", opacity: isClosed ? 0.85 : 1 }}>
                            {dm.day_of_week}
                          </Box>
                          <Box sx={{ fontSize: "0.72rem", fontWeight: 600, opacity: 0.95 }}>
                            {dm.date_str}
                          </Box>
                        </TableCell>
                      </Tooltip>
                    );
                  })}

                  {/* Total do Serviço no Mês */}
                  <TableCell
                    align="center"
                    sx={{
                      minWidth: 90,
                      textAlign: "center",
                      bgcolor: "primary.main",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      borderLeft: "2px solid rgba(255,255,255,0.25)",
                      borderBottom: "2px solid rgba(0,0,0,0.2)",
                      py: 1,
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                    }}
                  >
                    TOTAL
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sortedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={daysMeta.length + 2} sx={{ py: 6, textAlign: "center" }}>
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>
                        Nenhum serviço cadastrado para este estabelecimento.
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cadastre seus serviços no menu Serviços para visualizar a matriz diária de atendimentos.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedServices.map((row, rowIdx) => {
                    const isEven = rowIdx % 2 === 1;
                    const cellBg = isEven ? "#F8FAFC" : "#FFFFFF";
                    return (
                      <TableRow
                        key={row.code}
                        hover
                        sx={{
                          bgcolor: cellBg,
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                          "&:hover .sticky-service-col": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        {/* Nome do Serviço (Em ordem alfabética) */}
                        <TableCell
                          className="sticky-service-col"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.825rem",
                            color: "text.primary",
                            bgcolor: cellBg,
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                            borderRight: "2px solid #CBD5E1",
                            py: 0.85,
                            pl: 2,
                            width: 250,
                            minWidth: 250,
                            maxWidth: 250,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <Tooltip title={row.name} arrow placement="top-start" enterDelay={150}>
                            <span>{row.name}</span>
                          </Tooltip>
                        </TableCell>

                        {/* Células diárias (1..31) */}
                        {daysMeta.map((dm) => {
                          const count = row.daily_counts[dm.day] || 0;
                          const isClosed = dm.is_closed ?? dm.is_weekend;
                          return (
                            <TableCell
                              key={dm.day}
                              align="center"
                              sx={{
                                p: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: count > 0 ? 700 : 400,
                                color: count > 0 ? "text.primary" : "text.disabled",
                                bgcolor: isClosed ? "#F3F4F6" : "inherit",
                                borderRight: "1px solid #F1F5F9",
                                py: 0.85,
                              }}
                            >
                              {count > 0 ? count : ""}
                            </TableCell>
                          );
                        })}

                        {/* Total do Serviço no Mês */}
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.825rem",
                            color: "text.primary",
                            bgcolor: cellBg,
                            borderLeft: "2px solid #CBD5E1",
                            py: 0.85,
                          }}
                        >
                          {row.total_count}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* ── LINHA DE RODAPÉ (VOLUME SERVIÇOS / DIA - COR CLARA E ELEGANTE) ── */}
                <TableRow
                  sx={{
                    bgcolor: "#F8FAFC",
                    borderTop: "2px solid",
                    borderColor: "divider",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 25,
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "text.primary",
                      bgcolor: "#F8FAFC",
                      position: "sticky",
                      left: 0,
                      bottom: 0,
                      zIndex: 35,
                      borderRight: "2px solid #CBD5E1",
                      borderTop: "2px solid",
                      borderColor: "divider",
                      py: 1.2,
                      pl: 2,
                      width: 250,
                      minWidth: 250,
                      maxWidth: 250,
                    }}
                  >
                    VOLUME SERVIÇOS / DIA
                  </TableCell>

                  {/* Somas diárias */}
                  {daysMeta.map((dm) => {
                    const daySum = dailyTotals[dm.day] || 0;
                    const isClosed = dm.is_closed ?? dm.is_weekend;
                    return (
                      <TableCell
                        key={dm.day}
                        align="center"
                        sx={{
                          p: 0.5,
                          fontWeight: 800,
                          fontSize: "0.8rem",
                          color: daySum > 0 ? "text.primary" : "text.disabled",
                          bgcolor: isClosed ? "#F1F5F9" : "#F8FAFC",
                          borderRight: "1px solid #E2E8F0",
                          borderTop: "2px solid",
                          borderColor: "divider",
                          py: 1.2,
                          position: "sticky",
                          bottom: 0,
                          zIndex: 25,
                        }}
                      >
                        {daySum > 0 ? daySum : 0}
                      </TableCell>
                    );
                  })}

                  {/* Total Geral de Atendimentos */}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                      borderLeft: "2px solid #CBD5E1",
                      borderTop: "2px solid",
                      borderColor: "divider",
                      py: 1.2,
                      position: "sticky",
                      bottom: 0,
                      zIndex: 25,
                    }}
                  >
                    {summary?.total_services || 0}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* ── TAB 1: GRÁFICOS & ANÁLISE COMPARATIVA ────────────────────────── */}
      {activeTab === 1 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 1,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.18)",
              borderRadius: 4,
            },
          }}
        >
          {/* Gráfico 1: Serviços Estratificados */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  SERVIÇOS ESTRATIFICADOS
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volume de atendimentos por serviço no mês de {MONTH_NAMES[selectedMonth - 1]}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={
                    effectiveSelectedChart1.length === allServiceNames.length
                      ? `${summary?.total_services || 0} serviços`
                      : `${totalFilteredChart1} de ${summary?.total_services || 0} serviços`
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  }}
                />
                <ServiceAutocompleteFilter
                  allServices={allServiceNames}
                  selectedServices={effectiveSelectedChart1}
                  onChange={(newVal) => setSelectedServicesChart1(newVal)}
                  label="Filtrar serviços"
                />
              </Box>
            </Box>

            {filteredStratified.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Nenhum serviço selecionado no filtro.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Marque pelo menos um serviço no seletor acima para visualizar a estratificação.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  alignItems: "flex-end",
                  gap: 3,
                  minHeight: 260,
                  width: "100%",
                  pt: 3,
                  px: 2,
                  pb: 1.5,
                  overflowX: "auto",
                  overflowY: "hidden",
                  "&::-webkit-scrollbar": { height: 7 },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0,0,0,0.15)",
                    borderRadius: 4,
                  },
                }}
              >
                {filteredStratified.map((item, idx) => {
                  const maxCount = Math.max(...filteredStratified.map((s) => s.count), 1);
                  const heightPct = Math.max((item.count / maxCount) * 100, 4);
                  const isTop = item.count === maxCount && item.count > 0;
                  const pct = totalFilteredChart1 > 0 ? ((item.count / totalFilteredChart1) * 100).toFixed(1) : "0";

                  return (
                    <Box
                      key={`${item.code || item.name}-${idx}`}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flex: "0 0 100px",
                        width: 100,
                        minWidth: 100,
                        maxWidth: 120,
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Área da Barra com baseline fixa */}
                      <Box
                        sx={{
                          height: 160,
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          borderBottom: "2px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, fontSize: "0.75rem", mb: 0.5, color: isTop ? "primary.main" : "text.secondary" }}
                        >
                          {item.count}
                        </Typography>
                        <Tooltip title={`${item.name}: ${item.count} atendimentos (${pct}%)`} arrow>
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: 42,
                              height: `${heightPct}%`,
                              bgcolor: isTop ? "#0284C7" : item.count > 0 ? "#38BDF8" : "#E2E8F0",
                              borderRadius: "4px 4px 0 0",
                              transition: "all 0.3s ease",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#0369A1", transform: "scaleY(1.03)" },
                            }}
                          />
                        </Tooltip>
                      </Box>

                      {/* Rótulo completo do serviço sem reticências */}
                      <Box
                        sx={{
                          width: "100%",
                          pt: 1,
                          display: "flex",
                          justifyContent: "center",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            lineHeight: 1.25,
                            color: "text.primary",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Gráfico 2: Volume Serviços / Dia */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  VOLUME SERVIÇOS / DIA
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Demanda diária e ritmo da esteira de banho e tosa ao longo do mês
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={
                    effectiveSelectedChart2.length === allServiceNames.length
                      ? `${summary?.total_services || 0} atendimentos`
                      : `${totalFilteredChart2} de ${summary?.total_services || 0} atendimentos`
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha("#EA580C", 0.1),
                    color: "#EA580C",
                  }}
                />
                <ServiceAutocompleteFilter
                  allServices={allServiceNames}
                  selectedServices={effectiveSelectedChart2}
                  onChange={(newVal) => setSelectedServicesChart2(newVal)}
                  label="Filtrar serviços"
                />
              </Box>
            </Box>

            {effectiveSelectedChart2.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Nenhum serviço selecionado no filtro.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Marque pelo menos um serviço no seletor acima para visualizar o volume diário.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  alignItems: "flex-end",
                  gap: 0.8,
                  height: 200,
                  width: "100%",
                  pt: 4,
                  px: 1,
                  overflowX: "auto",
                  overflowY: "hidden",
                  "&::-webkit-scrollbar": { height: 7 },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0,0,0,0.15)",
                    borderRadius: 4,
                  },
                }}
              >
                {daysMeta.map((dm) => {
                  const count = filteredDailyTotals[dm.day] || 0;
                  const maxDayCount = Math.max(...Object.values(filteredDailyTotals), 1);
                  const heightPct = count > 0 ? Math.max((count / maxDayCount) * 100, 6) : 2;

                  return (
                    <Box
                      key={dm.day}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 32,
                        flex: 1,
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      {count > 0 && (
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.7rem", mb: 0.5, color: "#EA580C" }}>
                          {count}
                        </Typography>
                      )}
                      <Tooltip title={`Dia ${dm.date_str} (${dm.day_of_week}): ${count} atendimentos`} arrow>
                        <Box
                          sx={{
                            width: "100%",
                            maxWidth: 24,
                            height: `${heightPct}%`,
                            bgcolor: count > 0 ? "#F97316" : "#E5E7EB",
                            borderRadius: "4px 4px 0 0",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#C2410C" },
                          }}
                        />
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.6rem",
                          mt: 1,
                          textAlign: "center",
                          color: (dm.is_closed ?? dm.is_weekend) ? "text.disabled" : "text.secondary",
                        }}
                      >
                        {String(dm.day).padStart(2, "0")}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Gráfico 3: Comparativo Anual */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  COMPARATIVO ANUAL DE SERVIÇOS
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Evolução mensal comparando {opData?.annual_comparison.current_year} com {opData?.annual_comparison.previous_year} (Ano Anterior)
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={
                    effectiveSelectedAnnual.length === allServiceNames.length
                      ? `${totalFilteredAnnualCurrent} (${opData?.annual_comparison.current_year}) vs ${totalFilteredAnnualPrevious} (${opData?.annual_comparison.previous_year})`
                      : `${totalFilteredAnnualCurrent} vs ${totalFilteredAnnualPrevious} selecionados`
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha("#8B5CF6", 0.1),
                    color: "#8B5CF6",
                  }}
                />
                <ServiceAutocompleteFilter
                  allServices={allServiceNames}
                  selectedServices={effectiveSelectedAnnual}
                  onChange={(newVal) => setSelectedServicesAnnual(newVal)}
                  label="Filtrar serviços"
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {/* Ano Atual */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.02), border: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 0.25 }}>
                  Volume de Serviços - {opData?.annual_comparison.current_year}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Evolução mensal dos atendimentos no ano corrente
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "flex-end",
                    gap: 1,
                    height: 180,
                    width: "100%",
                    pt: 3,
                    px: 1,
                    overflowX: "auto",
                    overflowY: "hidden",
                  }}
                >
                  {MONTH_NAMES.map((name, idx) => {
                    const mNum = idx + 1;
                    const cnt = filteredAnnualCurrent[mNum] || 0;
                    const maxYear = Math.max(
                      ...Object.values(filteredAnnualCurrent),
                      ...Object.values(filteredAnnualPrevious),
                      1
                    );
                    const hPct = cnt > 0 ? Math.max((cnt / maxYear) * 100, 6) : 3;

                    return (
                      <Box key={mNum} sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                        {cnt > 0 && (
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", mb: 0.5, color: "#EA580C" }}>
                            {cnt}
                          </Typography>
                        )}
                        <Tooltip title={`${name}/${opData?.annual_comparison.current_year}: ${cnt} serviços`} arrow>
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: 26,
                              height: `${hPct}%`,
                              bgcolor: cnt > 0 ? "#F97316" : "#F3F4F6",
                              borderRadius: "4px 4px 0 0",
                            }}
                          />
                        </Tooltip>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", mt: 0.75, color: "text.secondary" }}>
                          {name.slice(0, 3).toUpperCase()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Ano Anterior */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha("#FB923C", 0.04), border: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 0.25 }}>
                  Volume de Serviços - {opData?.annual_comparison.previous_year} (Ano Anterior)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Comparativo histórico e análise de sazonalidade
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    alignItems: "flex-end",
                    gap: 1,
                    height: 180,
                    width: "100%",
                    pt: 3,
                    px: 1,
                    overflowX: "auto",
                    overflowY: "hidden",
                  }}
                >
                  {MONTH_NAMES.map((name, idx) => {
                    const mNum = idx + 1;
                    const cnt = filteredAnnualPrevious[mNum] || 0;
                    const maxYear = Math.max(
                      ...Object.values(filteredAnnualCurrent),
                      ...Object.values(filteredAnnualPrevious),
                      1
                    );
                    const hPct = cnt > 0 ? Math.max((cnt / maxYear) * 100, 6) : 3;

                    return (
                      <Box key={mNum} sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                        {cnt > 0 && (
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", mb: 0.5, color: "#EA580C" }}>
                            {cnt}
                          </Typography>
                        )}
                        <Tooltip title={`${name}/${opData?.annual_comparison.previous_year}: ${cnt} serviços`} arrow>
                          <Box
                            sx={{
                              width: "100%",
                              maxWidth: 26,
                              height: `${hPct}%`,
                              bgcolor: cnt > 0 ? "#FB923C" : "#F3F4F6",
                              borderRadius: "4px 4px 0 0",
                            }}
                          />
                        </Tooltip>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", mt: 0.75, color: "text.secondary" }}>
                          {name.slice(0, 3).toUpperCase()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
