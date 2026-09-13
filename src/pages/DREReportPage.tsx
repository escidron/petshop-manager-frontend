import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
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
  Card,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Download,
  DollarSign,
  PieChart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDREReport,
  exportDREExcel,
  listDREAccounts,
  upsertDREEntry,
  type DREReportResponse,
} from "../api/services/financial";
import AccountManagementModal from "../features/financial/AccountManagementModal";
import QuickExpenseModal from "../features/financial/QuickExpenseModal";
import CellEditModal from "../features/financial/CellEditModal";
import PayrollModal from "../features/financial/PayrollModal";
import MoneyInput from "../features/financial/MoneyInput";
import { toast } from "react-toastify";

const MONTH_HEADERS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const COL_ACCOUNT_WIDTH = 400;
const COL_TOTAL_WIDTH = 130;

const isExpenseGroup = (groupType?: string | null) => {
  if (!groupType) return false;
  return ["cmv", "fixed_expense", "variable_expense", "financial_expense"].includes(groupType);
};

const fmtBRL = (val: number, zeroAsDash = true, isExpense = false) => {
  if (!val && val !== 0) return "-";
  if (val === 0) return zeroAsDash ? "-" : "R$ 0,00";
  const absFormatted = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (isExpense && val > 0) return `- ${absFormatted}`;
  if (val < 0) return `- ${absFormatted}`;
  return absFormatted;
};

const fmtPct = (val: number) => {
  if (!val && val !== 0) return "-";
  if (val === 0) return "-";
  return `${val.toFixed(2).replace(".", ",")}%`;
};

export default function DREReportPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Célula ativa em edição inline
  const [editingCell, setEditingCell] = useState<{
    accountId: number;
    month: number;
    value: number;
  } | null>(null);

  // Modais
  const [isAccountsOpen, setIsAccountsOpen] = useState<boolean>(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState<boolean>(false);
  const [isPayrollOpen, setIsPayrollOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<{
    accountId: number;
    accountName: string;
    year: number;
    month: number;
    currentAmount: number;
  } | null>(null);

  // Queries
  const { data: dreData, isLoading } = useQuery({
    queryKey: ["dre-report", selectedYear],
    queryFn: () => getDREReport(selectedYear),
    staleTime: 0,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["dre-accounts"],
    queryFn: listDREAccounts,
  });

  // Mutação para salvar célula inline com atualização otimista instantânea
  const inlineMutation = useMutation({
    mutationFn: upsertDREEntry,
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["dre-report", selectedYear] });
      const previousData = queryClient.getQueryData<DREReportResponse>(["dre-report", selectedYear]);
      if (previousData) {
        const updatedRows = previousData.all_rows.map((row) => {
          if (row.account_id === newEntry.account_id) {
            const updatedMonthly = { ...row.monthly_amounts, [newEntry.competence_month]: newEntry.amount };
            const newTotal = Object.values(updatedMonthly).reduce((sum, v) => sum + (v || 0), 0);
            return {
              ...row,
              monthly_amounts: updatedMonthly,
              total_amount: newTotal,
              monthly_average: Number((newTotal / 12).toFixed(2)),
            };
          }
          return row;
        });

        const updatedGroups = previousData.groups.map((group) => ({
          ...group,
          rows: group.rows.map((row) => {
            if (row.account_id === newEntry.account_id) {
              const updatedMonthly = { ...row.monthly_amounts, [newEntry.competence_month]: newEntry.amount };
              const newTotal = Object.values(updatedMonthly).reduce((sum, v) => sum + (v || 0), 0);
              return {
                ...row,
                monthly_amounts: updatedMonthly,
                total_amount: newTotal,
                monthly_average: Number((newTotal / 12).toFixed(2)),
              };
            }
            return row;
          }),
        }));

        queryClient.setQueryData<DREReportResponse>(["dre-report", selectedYear], {
          ...previousData,
          all_rows: updatedRows,
          groups: updatedGroups,
        });
      }
      return { previousData };
    },
    onError: (_err, _newEntry, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["dre-report", selectedYear], context.previousData);
      }
      toast.error("Erro ao salvar alteração.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-report", selectedYear] });
    },
  });

  const handleSaveInlineCell = () => {
    if (editingCell) {
      inlineMutation.mutate({
        account_id: editingCell.accountId,
        competence_year: selectedYear,
        competence_month: editingCell.month,
        amount: editingCell.value,
      });
      setEditingCell(null);
    }
  };

  const toggleGroup = (groupType: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupType]: !prev[groupType],
    }));
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Gerando planilha Excel formatada...");
      const blob = await exportDREExcel(selectedYear);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DRE_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download do Excel concluído!");
    } catch {
      toast.error("Erro ao gerar planilha Excel.");
    }
  };


  const summary = dreData?.summary;
  const isNetProfitPositive = (summary?.net_profit_total ?? 0) >= 0;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        maxHeight: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: "calc(16px + env(safe-area-inset-bottom, 0px))", md: 2 },
        boxSizing: "border-box",
      }}
    >
      {/* ── CABEÇALHO & AÇÕES ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 1.5,
          mb: 1.5,
          flexShrink: 0,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              DRE
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
            Demonstrativo de Resultado do Exercício com integração de vendas, CMV de estoque e despesas operacionais.
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
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <MenuItem key={y} value={y} sx={{ fontWeight: 600 }}>
                  Ano {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<DollarSign size={16} />}
            onClick={() => setIsQuickExpenseOpen(true)}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            Lançar Receitas / Despesas
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Users size={16} />}
            onClick={() => setIsPayrollOpen(true)}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            Gestão da Folha
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Layers size={16} />}
            onClick={() => setIsAccountsOpen(true)}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Plano de Contas
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={handleExportExcel}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Exportar Excel
          </Button>


        </Box>
      </Box>

      {/* ── CARDS DE RESUMO EXECUTIVO (KPIs) COMPACTOS ─────────────────── */}
      {summary && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: 1.5,
            flexShrink: 0,
            "@media print": { display: "grid", gridTemplateColumns: "repeat(4, 1fr)" },
          }}
        >
          {/* Card 1: Receita Bruta */}
          <Card
            elevation={0}
            sx={{
              py: 1,
              px: 1.75,
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
                Receita Bruta ({selectedYear})
              </Typography>
              <DollarSign size={16} color={theme.palette.primary.main} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.15rem", lineHeight: 1.2 }}>
                {fmtBRL(summary.gross_revenue_total, false)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                Vendas + Serviços
              </Typography>
            </Box>
          </Card>

          {/* Card 2: Margem Bruta */}
          <Card
            elevation={0}
            sx={{
              py: 1,
              px: 1.75,
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `4px solid ${theme.palette.info.main}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
                Margem Bruta (Pós-CMV)
              </Typography>
              <PieChart size={16} color={theme.palette.info.main} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.15rem", lineHeight: 1.2 }}>
                {fmtBRL(summary.gross_margin_total, false)}
              </Typography>
              <Typography variant="caption" fontWeight={700} color="info.main" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                {fmtPct(summary.gross_margin_pct)} margem
              </Typography>
            </Box>
          </Card>

          {/* Card 3: EBITDA */}
          <Card
            elevation={0}
            sx={{
              py: 1,
              px: 1.75,
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `4px solid ${theme.palette.warning.main}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
                EBITDA Operacional
              </Typography>
              <DollarSign size={16} color={theme.palette.warning.main} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.15rem", lineHeight: 1.2 }}>
                {fmtBRL(summary.ebitda_total, false)}
              </Typography>
              <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                {fmtPct(summary.ebitda_pct)} operacional
              </Typography>
            </Box>
          </Card>

          {/* Card 4: Lucro Líquido Real */}
          <Card
            elevation={0}
            sx={{
              py: 1,
              px: 1.75,
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `4px solid ${isNetProfitPositive ? theme.palette.success.main : theme.palette.error.main}`,
              borderRadius: 2,
              bgcolor: isNetProfitPositive ? alpha(theme.palette.success.main, 0.03) : alpha(theme.palette.error.main, 0.03),
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.3px" }}>
                Resultado Líquido Final
              </Typography>
              {isNetProfitPositive ? (
                <CheckCircle2 size={16} color={theme.palette.success.main} />
              ) : (
                <AlertTriangle size={16} color={theme.palette.error.main} />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
              <Typography
                variant="h6"
                fontWeight={800}
                color={isNetProfitPositive ? "success.main" : "error.main"}
                sx={{ fontSize: "1.15rem", lineHeight: 1.2 }}
              >
                {fmtBRL(summary.net_profit_total, false)}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color={isNetProfitPositive ? "success.main" : "error.main"}
                sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
              >
                {fmtPct(summary.net_margin_pct)} líquida
              </Typography>
            </Box>
          </Card>
        </Box>
      )}

      {/* ── TABELA DINÂMICA DO DRE ─────────────────────────────────────── */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, minHeight: 200 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
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
              background: "rgba(0,0,0,0.2)",
              borderRadius: 4,
            },
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              width: "100%",
              minWidth: 1570,
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
              "& td, & th": { whiteSpace: "nowrap" },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                {/* Coluna Fixa 1: Nome da Conta */}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: "primary.main",
                    color: "white",
                    width: COL_ACCOUNT_WIDTH,
                    minWidth: COL_ACCOUNT_WIDTH,
                    maxWidth: COL_ACCOUNT_WIDTH,
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 20,
                    borderRight: "1px solid rgba(255,255,255,0.2)",
                    borderBottom: "2px solid rgba(0,0,0,0.15)",
                  }}
                >
                  CONTA / CATEGORIA DRE
                </TableCell>

                {/* Coluna Fixa 2: Total Acumulado */}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: "primary.main",
                    color: "white",
                    width: COL_TOTAL_WIDTH,
                    minWidth: COL_TOTAL_WIDTH,
                    maxWidth: COL_TOTAL_WIDTH,
                    position: "sticky",
                    top: 0,
                    left: COL_ACCOUNT_WIDTH,
                    zIndex: 20,
                    borderRight: "2px solid rgba(255,255,255,0.35)",
                    boxShadow: "3px 0 5px -2px rgba(0,0,0,0.25)",
                    borderBottom: "2px solid rgba(0,0,0,0.15)",
                  }}
                >
                  TOTAL {selectedYear}
                </TableCell>

                {/* 12 Colunas Mensais */}
                {MONTH_HEADERS.map((m, idx) => (
                  <TableCell
                    key={m}
                    align="right"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.825rem",
                      bgcolor: "primary.main",
                      color: "white",
                      width: 95,
                      minWidth: 95,
                      position: "sticky",
                      top: 0,
                      zIndex: 15,
                      borderLeft: idx > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
                      borderBottom: "2px solid rgba(0,0,0,0.15)",
                    }}
                  >
                    {m}/{String(selectedYear).slice(2)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {dreData?.groups.map((group) => {
                const isCollapsed = collapsedGroups[group.group_type];
                const sub = group.subtotal_row;

                return (
                  <React.Fragment key={group.group_type}>
                    {/* Linha Cabeçalho do Grupo (com botão expand/collapse) */}
                    <TableRow
                      sx={{
                        bgcolor: "#A7F3D0",
                        borderTop: "1.5px solid #6EE7B7",
                        borderBottom: "1.5px solid #6EE7B7",
                        cursor: "pointer",
                        "& td": { bgcolor: "#A7F3D0" },
                      }}
                      onClick={() => toggleGroup(group.group_type)}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          color: "#000000",
                          position: "sticky",
                          left: 0,
                          zIndex: 8,
                          bgcolor: "#A7F3D0",
                          py: 1,
                          width: COL_ACCOUNT_WIDTH,
                          minWidth: COL_ACCOUNT_WIDTH,
                          maxWidth: COL_ACCOUNT_WIDTH,
                          borderRight: "1px solid #6EE7B7",
                        }}
                      >
                        <Tooltip
                          title={`Clique para ${isCollapsed ? "expandir" : "recolher"}: ${group.title}`}
                          arrow
                          placement="top-start"
                          enterDelay={200}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
                            {isCollapsed ? <ChevronRight size={18} color="#000000" /> : <ChevronDown size={18} color="#000000" />}
                            <span style={{ letterSpacing: "0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#000000", fontWeight: 800 }}>
                              {group.title}
                            </span>
                            <Typography variant="caption" sx={{ color: "#000000", opacity: 0.85, ml: 0.5, fontWeight: 600, flexShrink: 0 }}>
                              ({group.rows.length} {group.rows.length === 1 ? "conta" : "contas"})
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Total do Grupo (Coluna Fixa 2) */}
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          color: "#000000",
                          fontSize: "0.85rem",
                          py: 1,
                          position: "sticky",
                          left: COL_ACCOUNT_WIDTH,
                          zIndex: 8,
                          bgcolor: "#A7F3D0",
                          width: COL_TOTAL_WIDTH,
                          minWidth: COL_TOTAL_WIDTH,
                          maxWidth: COL_TOTAL_WIDTH,
                          borderRight: "2px solid #34D399",
                          boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                        }}
                      >
                        {fmtBRL(sub.total_amount, true, isExpenseGroup(group.group_type))}
                      </TableCell>

                      {/* Meses do Grupo */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const val = sub.monthly_amounts[m] || 0;
                        return (
                          <TableCell
                            key={m}
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#000000",
                              fontSize: "0.825rem",
                              py: 1,
                            }}
                          >
                            {fmtBRL(val, true, isExpenseGroup(group.group_type))}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Linhas das Contas do Grupo (se não estiver recolhido) */}
                    {!isCollapsed &&
                      group.rows.map((row) => {
                        return (
                          <TableRow
                            key={row.id}
                            sx={{
                              bgcolor: "#FFFFFF",
                              "& td": { bgcolor: "#FFFFFF" },
                            }}
                          >
                            {/* Coluna Fixa 1: Nome da Conta */}
                            <TableCell
                              sx={{
                                fontSize: "0.825rem",
                                pl: 3,
                                position: "sticky",
                                left: 0,
                                zIndex: 6,
                                width: COL_ACCOUNT_WIDTH,
                                minWidth: COL_ACCOUNT_WIDTH,
                                maxWidth: COL_ACCOUNT_WIDTH,
                                bgcolor: "#FFFFFF",
                                borderRight: "1px solid #E2E8F0",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, overflow: "hidden" }}>
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5, maxWidth: 360 }}>
                                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#FFFFFF", fontSize: "0.825rem" }}>
                                        {row.code ? `[${row.code}] ` : ""}{row.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block", mt: 0.25 }}>
                                        {row.is_system
                                          ? "Integração automática com vendas e custos operacionais"
                                          : row.system_source?.startsWith("payroll_")
                                          ? "Integração automática com a Folha de Pagamento"
                                          : "Lançamento manual (clique na célula do mês para lançar valor)"}
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                  placement="top-start"
                                  enterDelay={150}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, overflow: "hidden", cursor: "help" }}>
                                    {row.code && (
                                      <Typography variant="caption" sx={{ flexShrink: 0, fontWeight: 700, color: "#000000" }}>
                                        [{row.code}]
                                      </Typography>
                                    )}
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      noWrap
                                      sx={{ textOverflow: "ellipsis", overflow: "hidden", color: "#000000" }}
                                    >
                                      {row.name}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                                {row.is_system ? (
                                  <Tooltip title="Alimentado automaticamente pelas operações do sistema">
                                    <Chip label="Auto" size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem", borderColor: "divider", flexShrink: 0 }} />
                                  </Tooltip>
                                ) : row.system_source?.startsWith("payroll_") ? (
                                  <Tooltip title="Alimentado automaticamente pela Folha de Pagamento. Clique para abrir o módulo.">
                                    <Chip
                                      label="Folha (Auto)"
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPayrollOpen(true);
                                      }}
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        color: "primary.main",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.22) },
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Clique na célula para editar direto ou duplo clique para anotações">
                                    <Chip label="Manual" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#F1F5F9", color: "text.secondary", flexShrink: 0 }} />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>

                            {/* Coluna Fixa 2: Total da Linha */}
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.825rem",
                                position: "sticky",
                                left: COL_ACCOUNT_WIDTH,
                                zIndex: 6,
                                width: COL_TOTAL_WIDTH,
                                minWidth: COL_TOTAL_WIDTH,
                                maxWidth: COL_TOTAL_WIDTH,
                                bgcolor: "#FFFFFF",
                                borderRight: "2px solid #CBD5E1",
                                color: "#000000",
                                boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                              }}
                            >
                              {fmtBRL(row.total_amount, true, isExpenseGroup(row.group_type))}
                            </TableCell>

                            {/* Meses da Linha (Dinâmicos: Edição Inline na própria célula!) */}
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                              const val = row.monthly_amounts[m] || 0;
                              const isPayroll = Boolean(row.system_source?.startsWith("payroll_"));
                              const isEditable = !row.is_system && !isPayroll && Boolean(row.account_id) && (row.is_editable !== false);
                              const isEditingThis =
                                isEditable &&
                                editingCell?.accountId === row.account_id &&
                                editingCell?.month === m;

                              if (isEditingThis) {
                                return (
                                  <TableCell
                                    key={m}
                                    sx={{
                                      p: 0.5,
                                      minWidth: 120,
                                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    }}
                                  >
                                    <MoneyInput
                                      autoFocus
                                      value={editingCell.value}
                                      onChange={(newVal) =>
                                        setEditingCell((prev) => (prev ? { ...prev, value: newVal } : null))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveInlineCell();
                                        } else if (e.key === "Escape") {
                                          setEditingCell(null);
                                        }
                                      }}
                                      onBlur={handleSaveInlineCell}
                                      size="small"
                                      sx={{
                                        "& .MuiInputBase-root": { bgcolor: "background.paper", borderRadius: 1.5 },
                                        "& .MuiInputBase-input": {
                                          py: 0.5,
                                          px: 0.5,
                                          fontSize: "0.825rem",
                                          textAlign: "right",
                                          fontWeight: 700,
                                        },
                                      }}
                                    />
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell
                                  key={m}
                                  align="right"
                                  onClick={() => {
                                    if (isPayroll) {
                                      toast.info("Esta conta é automática. Abrindo a Gestão da Folha para gerenciar colaboradores.");
                                      setIsPayrollOpen(true);
                                      return;
                                    }
                                    if (isEditable) {
                                      setEditingCell({
                                        accountId: row.account_id!,
                                        month: m,
                                        value: val,
                                      });
                                    }
                                  }}
                                  onDoubleClick={() => {
                                    if (isPayroll) {
                                      toast.info("Esta conta é automática. Abrindo a Gestão da Folha para gerenciar colaboradores.");
                                      setIsPayrollOpen(true);
                                      return;
                                    }
                                    if (isEditable) {
                                      setEditTarget({
                                        accountId: row.account_id!,
                                        accountName: row.name,
                                        year: selectedYear,
                                        month: m,
                                        currentAmount: val,
                                      });
                                    }
                                  }}
                                  sx={{
                                    fontSize: "0.825rem",
                                    color: "#000000",
                                    cursor: isEditable || isPayroll ? "pointer" : "default",
                                    position: "relative",
                                    transition: "background-color 0.15s",
                                    "&:hover": isEditable
                                      ? {
                                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                                          fontWeight: 700,
                                        }
                                      : isPayroll
                                      ? {
                                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        }
                                      : undefined,
                                  }}
                                >
                                  {fmtBRL(val, true, isExpenseGroup(row.group_type))}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}

                    {/* Linha de Resultado Intermediário: MARGEM BRUTA */}
                    {group.group_type === "cmv" && (
                      <TableRow
                        sx={{
                          bgcolor: "#FDBA74",
                          borderTop: "2px solid #FB923C",
                          borderBottom: "1.5px solid #FB923C",
                          "& td": {
                            bgcolor: "#FDBA74",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: "#000000",
                            fontSize: "0.85rem",
                            position: "sticky",
                            left: 0,
                            zIndex: 8,
                            bgcolor: "#FDBA74",
                            py: 1.25,
                            width: COL_ACCOUNT_WIDTH,
                            minWidth: COL_ACCOUNT_WIDTH,
                            maxWidth: COL_ACCOUNT_WIDTH,
                            borderRight: "1px solid #FB923C",
                          }}
                        >
                          <Tooltip
                            title="Margem Bruta = Receita Bruta de Vendas (-) CMV / Custos Diretos"
                            arrow
                            placement="top-start"
                          >
                            <span style={{ cursor: "help" }}>
                              (=) RECEITA LÍQUIDA / MARGEM BRUTA
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            color: "#000000",
                            fontSize: "0.875rem",
                            position: "sticky",
                            left: COL_ACCOUNT_WIDTH,
                            zIndex: 8,
                            bgcolor: "#FDBA74",
                            width: COL_TOTAL_WIDTH,
                            minWidth: COL_TOTAL_WIDTH,
                            maxWidth: COL_TOTAL_WIDTH,
                            borderRight: "2px solid #EA580C",
                            boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                          }}
                        >
                          {fmtBRL(summary?.gross_margin_total ?? 0)}
                        </TableCell>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const rev = dreData?.groups.find((g) => g.group_type === "gross_revenue")?.subtotal_row.monthly_amounts[m] || 0;
                          const cmv = dreData?.groups.find((g) => g.group_type === "cmv")?.subtotal_row.monthly_amounts[m] || 0;
                          const marg = rev - cmv;
                          return (
                            <TableCell key={m} align="right" sx={{ fontWeight: 800, color: "#000000", fontSize: "0.825rem" }}>
                              {fmtBRL(marg)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )}

                    {/* Linha de Resultado Intermediário: EBITDA */}
                    {group.group_type === "variable_expense" && (
                      <TableRow
                        sx={{
                          bgcolor: "#FDBA74",
                          borderTop: "2px solid #FB923C",
                          borderBottom: "1.5px solid #FB923C",
                          "& td": {
                            bgcolor: "#FDBA74",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: "#000000",
                            fontSize: "0.85rem",
                            position: "sticky",
                            left: 0,
                            zIndex: 8,
                            bgcolor: "#FDBA74",
                            py: 1.25,
                            width: COL_ACCOUNT_WIDTH,
                            minWidth: COL_ACCOUNT_WIDTH,
                            maxWidth: COL_ACCOUNT_WIDTH,
                            borderRight: "1px solid #FB923C",
                          }}
                        >
                          <Tooltip
                            title="EBITDA = Margem Bruta (-) Despesas Fixas (-) Despesas Variáveis (Resultado da Operação)"
                            arrow
                            placement="top-start"
                          >
                            <span style={{ cursor: "help" }}>
                              (=) RESULTADO OPERACIONAL (EBITDA)
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            color: "#000000",
                            fontSize: "0.875rem",
                            position: "sticky",
                            left: COL_ACCOUNT_WIDTH,
                            zIndex: 8,
                            bgcolor: "#FDBA74",
                            width: COL_TOTAL_WIDTH,
                            minWidth: COL_TOTAL_WIDTH,
                            maxWidth: COL_TOTAL_WIDTH,
                            borderRight: "2px solid #EA580C",
                            boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                          }}
                        >
                          {fmtBRL(summary?.ebitda_total ?? 0)}
                        </TableCell>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const rev = dreData?.groups.find((g) => g.group_type === "gross_revenue")?.subtotal_row.monthly_amounts[m] || 0;
                          const cmv = dreData?.groups.find((g) => g.group_type === "cmv")?.subtotal_row.monthly_amounts[m] || 0;
                          const fix = dreData?.groups.find((g) => g.group_type === "fixed_expense")?.subtotal_row.monthly_amounts[m] || 0;
                          const varExp = dreData?.groups.find((g) => g.group_type === "variable_expense")?.subtotal_row.monthly_amounts[m] || 0;
                          const ebit = rev - cmv - fix - varExp;
                          return (
                            <TableCell key={m} align="right" sx={{ fontWeight: 800, color: "#000000", fontSize: "0.825rem" }}>
                              {fmtBRL(ebit)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}

              {/* ── LINHA FINAL DE RESULTADO LÍQUIDO ─────────────────────── */}
              {summary && (
                <>
                  <TableRow
                    sx={{
                      bgcolor: "#FDBA74",
                      borderTop: "2px solid #FB923C",
                      borderBottom: "1.5px solid #FB923C",
                      "& td": {
                        bgcolor: "#FDBA74",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        color: "#000000",
                        position: "sticky",
                        left: 0,
                        zIndex: 8,
                        bgcolor: "#FDBA74",
                        py: 1.25,
                        width: COL_ACCOUNT_WIDTH,
                        minWidth: COL_ACCOUNT_WIDTH,
                        maxWidth: COL_ACCOUNT_WIDTH,
                        borderRight: "1px solid #FB923C",
                      }}
                    >
                      <Tooltip
                        title="Resultado Líquido = EBITDA (+) Receitas Não Operacionais (-) Despesas Não Operacionais"
                        arrow
                        placement="top-start"
                      >
                        <span style={{ cursor: "help" }}>
                          (=) RESULTADO LÍQUIDO DO EXERCÍCIO
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.875rem",
                        color: "#000000",
                        position: "sticky",
                        left: COL_ACCOUNT_WIDTH,
                        zIndex: 8,
                        bgcolor: "#FDBA74",
                        width: COL_TOTAL_WIDTH,
                        minWidth: COL_TOTAL_WIDTH,
                        maxWidth: COL_TOTAL_WIDTH,
                        borderRight: "2px solid #EA580C",
                        boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                      }}
                    >
                      {fmtBRL(summary.net_profit_total)}
                    </TableCell>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const netRow = dreData?.all_rows.find((r) => r.id === "result-net-profit");
                      const val = netRow?.monthly_amounts[m] || 0;
                      return (
                        <TableCell
                          key={m}
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.825rem",
                            color: "#000000",
                          }}
                        >
                          {fmtBRL(val)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Linha de Margem Líquida Percentual */}
                  <TableRow
                    sx={{
                      bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                      borderBottom: "3px solid",
                      borderBottomColor: isNetProfitPositive ? "#10B981" : "#EF4444",
                      "& td": {
                        bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.825rem",
                        color: "#000000",
                        position: "sticky",
                        left: 0,
                        zIndex: 8,
                        bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                        py: 0.85,
                        width: COL_ACCOUNT_WIDTH,
                        minWidth: COL_ACCOUNT_WIDTH,
                        maxWidth: COL_ACCOUNT_WIDTH,
                        borderRight: "1px solid",
                        borderRightColor: isNetProfitPositive ? "#A7F3D0" : "#FECDD3",
                      }}
                    >
                      <Tooltip
                        title="Margem Líquida % = (Resultado Líquido / Receita Bruta) * 100"
                        arrow
                        placement="top-start"
                      >
                        <span style={{ cursor: "help" }}>
                          RESULTADO EM % (MARGEM LÍQUIDA)
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        position: "sticky",
                        left: COL_ACCOUNT_WIDTH,
                        zIndex: 8,
                        bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                        width: COL_TOTAL_WIDTH,
                        minWidth: COL_TOTAL_WIDTH,
                        maxWidth: COL_TOTAL_WIDTH,
                        borderRight: "2px solid",
                        borderRightColor: isNetProfitPositive ? "#34D399" : "#F87171",
                        boxShadow: "3px 0 5px -2px rgba(0,0,0,0.06)",
                        py: 0.85,
                      }}
                    >
                      {summary.net_margin_pct === 0 ? (
                        <span style={{ color: "#000000", fontWeight: 700, fontSize: "0.85rem" }}>-</span>
                      ) : (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            px: 1.25,
                            py: 0.35,
                            borderRadius: "12px",
                            bgcolor: summary.net_margin_pct >= 0 ? "#16A34A" : "#DC2626",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            letterSpacing: "0.2px",
                          }}
                        >
                          {fmtPct(summary.net_margin_pct)}
                        </Box>
                      )}
                    </TableCell>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const netRow = dreData?.all_rows.find((r) => r.id === "result-net-profit");
                      const pct = netRow?.monthly_percentages[m] || 0;
                      const isPositive = pct >= 0;

                      return (
                        <TableCell
                          key={m}
                          align="right"
                          sx={{
                            py: 0.85,
                            px: 0.75,
                          }}
                        >
                          {pct === 0 ? (
                            <span style={{ color: "#000000", fontWeight: 700, fontSize: "0.825rem" }}>-</span>
                          ) : (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                px: 1,
                                py: 0.3,
                                borderRadius: "10px",
                                bgcolor: isPositive ? "#16A34A" : "#DC2626",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                minWidth: 54,
                              }}
                            >
                              {fmtPct(pct)}
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── MODAIS INTEGRADOS ─────────────────────────────────────────── */}
      {isQuickExpenseOpen && (
        <QuickExpenseModal
          open={isQuickExpenseOpen}
          onClose={() => setIsQuickExpenseOpen(false)}
          year={selectedYear}
          accounts={accounts}
          reportRows={dreData?.all_rows}
          onOpenPayroll={() => setIsPayrollOpen(true)}
        />
      )}

      <AccountManagementModal
        open={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        year={selectedYear}
      />

      {isPayrollOpen && (
        <PayrollModal
          open={isPayrollOpen}
          onClose={() => setIsPayrollOpen(false)}
          year={selectedYear}
          accounts={accounts}
          onSyncSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["dre-report", selectedYear] });
          }}
        />
      )}

      <CellEditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onOpenReplicate={() => setIsQuickExpenseOpen(true)}
      />
    </Box>
  );
}
