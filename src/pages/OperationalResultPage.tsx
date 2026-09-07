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
  Printer,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getOperationalResult,
  exportOperationalResultExcel,
  type OperationalResultResponse,
} from "../api/services/operationalResult";
import { toast } from "react-toastify";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

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

  const handlePrint = () => {
    window.print();
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

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        p: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 4 },
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
          mb: 3,
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

          <IconButton
            size="small"
            onClick={handlePrint}
            title="Imprimir ou Salvar PDF"
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0.8 }}
          >
            <Printer size={18} />
          </IconButton>
        </Box>
      </Box>

      {/* ── CARDS DE RESUMO EXECUTIVO (KPIs) ─────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
          gap: 1.5,
          mb: 2.5,
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
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, "@media print": { display: "none" } }}>
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
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflowX: "auto",
            position: "relative",
            "&::-webkit-scrollbar": { height: 8 },
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
                "& td, & th": { whiteSpace: "nowrap" },
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  {/* Nome do Serviço (Único campo inicial fixo) */}
                  <TableCell
                    sx={{
                      width: 240,
                      minWidth: 220,
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      bgcolor: "primary.main",
                      color: "#FFFFFF",
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      borderRight: "2px solid rgba(255,255,255,0.3)",
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
                            lineHeight: 1.15,
                            py: 0.8,
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
                      py: 1,
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
                  sortedServices.map((row) => (
                    <TableRow
                      key={row.code}
                      hover
                      sx={{
                        "&:nth-of-type(even)": { bgcolor: "#F8FAFC" },
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      {/* Nome do Serviço (Em ordem alfabética) */}
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.825rem",
                          color: "text.primary",
                          bgcolor: "background.paper",
                          position: "sticky",
                          left: 0,
                          zIndex: 4,
                          borderRight: "2px solid #CBD5E1",
                          py: 0.85,
                          pl: 2,
                        }}
                      >
                        {row.name}
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
                          bgcolor: "background.paper",
                          borderLeft: "2px solid #CBD5E1",
                          py: 0.85,
                        }}
                      >
                        {row.total_count}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* ── LINHA DE RODAPÉ (VOLUME SERVIÇOS / DIA - COR CLARA E ELEGANTE) ── */}
                <TableRow
                  sx={{
                    bgcolor: "#F8FAFC",
                    borderTop: "2px solid",
                    borderColor: "divider",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 10,
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
                      zIndex: 15,
                      borderRight: "2px solid #CBD5E1",
                      borderTop: "2px solid",
                      borderColor: "divider",
                      py: 1.2,
                      pl: 2,
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
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      borderLeft: "2px solid #CBD5E1",
                      borderTop: "2px solid",
                      borderColor: "divider",
                      py: 1.2,
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Gráfico 1: Serviços Estratificados */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  SERVIÇOS ESTRATIFICADOS
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volume de atendimentos por serviço no mês de {MONTH_NAMES[selectedMonth - 1]}
                </Typography>
              </Box>
              <Chip
                label={`${summary?.total_services || 0} serviços`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, minHeight: 260, pt: 3, px: 2, pb: 1, overflowX: "auto" }}>
              {opData?.stratified_services.map((item) => {
                const maxCount = Math.max(...(opData?.stratified_services.map((s) => s.count) || [1]), 1);
                const heightPct = Math.max((item.count / maxCount) * 100, 4);
                const isTop = item.count === maxCount && item.count > 0;

                return (
                  <Box
                    key={item.name}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 90,
                      maxWidth: 130,
                      flex: 1,
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
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: "0.75rem", mb: 0.5, color: isTop ? "primary.main" : "text.secondary" }}
                      >
                        {item.count}
                      </Typography>
                      <Tooltip title={`${item.name}: ${item.count} atendimentos (${item.percentage}%)`} arrow>
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
          </Paper>

          {/* Gráfico 2: Volume Serviços / Dia */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  VOLUME SERVIÇOS / DIA
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Demanda diária e ritmo da esteira de banho e tosa ao longo do mês
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.8, height: 200, pt: 4, px: 1, overflowX: "auto" }}>
              {daysMeta.map((dm) => {
                const count = dailyTotals[dm.day] || 0;
                const maxDayCount = Math.max(...Object.values(dailyTotals), 1);
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
          </Paper>

          {/* Comparativo Anual */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            {/* Ano Atual */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                Volume de Serviços - {opData?.annual_comparison.current_year}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Evolução mensal dos atendimentos no ano corrente
              </Typography>

              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 180, pt: 3, px: 1 }}>
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  const cnt = opData?.annual_comparison.monthly_volume_current[mNum] || 0;
                  const maxYear = Math.max(...Object.values(opData?.annual_comparison.monthly_volume_current || {}), 1);
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
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", mb: 0.5 }}>
                Volume de Serviços - {opData?.annual_comparison.previous_year} (Ano Anterior)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Comparativo histórico e análise de sazonalidade
              </Typography>

              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 180, pt: 3, px: 1 }}>
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  const cnt = opData?.annual_comparison.monthly_volume_previous[mNum] || 0;
                  const maxYear = Math.max(...Object.values(opData?.annual_comparison.monthly_volume_previous || {}), 1);
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
        </Box>
      )}
    </Box>
  );
}
