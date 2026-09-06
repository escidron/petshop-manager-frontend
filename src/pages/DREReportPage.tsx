import React, { useState } from "react";
import {
  Box,
  Paper,
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
  Switch,
  FormControlLabel,
  Chip,
  Card,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Download,
  Printer,
  DollarSign,
  PieChart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
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
import MoneyInput from "../features/financial/MoneyInput";
import { toast } from "react-toastify";

const MONTH_HEADERS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const fmtBRL = (val: number) => {
  if (!val && val !== 0) return "-";
  if (val === 0) return "R$ 0,00";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const fmtPct = (val: number) => {
  if (!val && val !== 0) return "-";
  return `${val.toFixed(2).replace(".", ",")}%`;
};

export default function DREReportPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showPercentages, setShowPercentages] = useState<boolean>(false);
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

  const handlePrint = () => {
    window.print();
  };

  const summary = dreData?.summary;
  const isNetProfitPositive = (summary?.net_profit_total ?? 0) >= 0;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        p: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 4 },
      }}
    >
      {/* ── CABEÇALHO & AÇÕES ─────────────────────────────────────────────── */}
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
            <Typography variant="h5" fontWeight={800} color="text.primary">
              DRE Gerencial
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

          <FormControlLabel
            control={
              <Switch
                checked={showPercentages}
                onChange={(e) => setShowPercentages(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Mostrar %
              </Typography>
            }
            sx={{ mr: 0.5 }}
          />

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<DollarSign size={16} />}
            onClick={() => setIsQuickExpenseOpen(true)}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            Lançar Despesas
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

      {/* ── CARDS DE RESUMO EXECUTIVO (KPIs) COMPACTOS ─────────────────── */}
      {summary && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: 2,
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
                {fmtBRL(summary.gross_revenue_total)}
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
                {fmtBRL(summary.gross_margin_total)}
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
                {fmtBRL(summary.ebitda_total)}
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
                {fmtBRL(summary.net_profit_total)}
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
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
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
            "&::-webkit-scrollbar": { height: 7 },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.15)",
              borderRadius: 4,
            },
          }}
        >
          <Table
            size="small"
            sx={{
              width: "100%",
              minWidth: 1200,
              "& td, & th": { whiteSpace: "nowrap" },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                {/* Coluna Fixa: Nome da Conta */}
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: "primary.main",
                    color: "white",
                    minWidth: 280,
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                  }}
                >
                  CONTA / CATEGORIA DRE
                </TableCell>

                {/* Coluna Total Acumulado */}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: "primary.main",
                    color: "white",
                    minWidth: 130,
                    borderLeft: "1px solid rgba(255,255,255,0.2)",
                    borderRight: "2px solid rgba(255,255,255,0.3)",
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
                      minWidth: 85,
                      borderLeft: idx > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
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
                        bgcolor: "#F1F5F9",
                        borderTop: "1px solid #E2E8F0",
                        borderBottom: "1px solid #E2E8F0",
                        cursor: "pointer",
                        "& td": { bgcolor: "#F1F5F9" },
                        "&:hover, &:hover td": { bgcolor: "#E2E8F0" },
                      }}
                      onClick={() => toggleGroup(group.group_type)}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          color: "#1E293B",
                          position: "sticky",
                          left: 0,
                          zIndex: 5,
                          bgcolor: "#F1F5F9",
                          py: 1,
                          borderRight: "1px solid #E2E8F0",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {isCollapsed ? <ChevronRight size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                          <span style={{ letterSpacing: "0.2px" }}>{group.title}</span>
                          <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontWeight: 500 }}>
                            ({group.rows.length} {group.rows.length === 1 ? "conta" : "contas"})
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Total do Grupo */}
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 800,
                          color: "#1E293B",
                          fontSize: "0.85rem",
                          py: 1,
                          borderLeft: "1px solid #E2E8F0",
                          borderRight: "2px solid #CBD5E1",
                        }}
                      >
                        {showPercentages ? fmtPct(sub.total_percentage) : fmtBRL(sub.total_amount)}
                      </TableCell>

                      {/* Meses do Grupo */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const val = sub.monthly_amounts[m] || 0;
                        const pct = sub.monthly_percentages[m] || 0;
                        return (
                          <TableCell
                            key={m}
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: "#1E293B",
                              fontSize: "0.825rem",
                              py: 1,
                            }}
                          >
                            {showPercentages ? fmtPct(pct) : fmtBRL(val)}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Linhas das Contas do Grupo (se não estiver recolhido) */}
                    {!isCollapsed &&
                      group.rows.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "&:nth-of-type(even)": { bgcolor: "#F8FAFC" },
                          }}
                        >
                          {/* Coluna Nome da Conta */}
                          <TableCell
                            sx={{
                              fontSize: "0.825rem",
                              pl: 4,
                              position: "sticky",
                              left: 0,
                              zIndex: 4,
                              bgcolor: "background.paper",
                              borderRight: "1px solid #E2E8F0",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {row.code && (
                                  <Typography variant="caption" color="text.secondary">
                                    [{row.code}]
                                  </Typography>
                                )}
                                <Typography variant="body2" fontWeight={500} color="text.primary">
                                  {row.name}
                                </Typography>
                              </Box>
                              {row.is_system ? (
                                <Tooltip title="Alimentado automaticamente pelas operações do sistema">
                                  <Chip label="Auto" size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem", borderColor: "divider" }} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Clique na célula para editar direto ou duplo clique para anotações">
                                  <Chip label="Manual" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "#F1F5F9", color: "text.secondary" }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>

                          {/* Total da Linha */}
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.825rem",
                              bgcolor: "#F8FAFC",
                              borderRight: "2px solid #E2E8F0",
                              color: "text.primary",
                            }}
                          >
                            {showPercentages ? fmtPct(row.total_percentage) : fmtBRL(row.total_amount)}
                          </TableCell>

                          {/* Meses da Linha (Dinâmicos: Edição Inline na própria célula!) */}
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                            const val = row.monthly_amounts[m] || 0;
                            const pct = row.monthly_percentages[m] || 0;
                            const isEditable = !row.is_system && Boolean(row.account_id);
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
                                        fontSize: "0.8rem",
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
                                  if (isEditable) {
                                    setEditingCell({
                                      accountId: row.account_id!,
                                      month: m,
                                      value: val,
                                    });
                                  }
                                }}
                                onDoubleClick={() => {
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
                                  cursor: isEditable ? "pointer" : "default",
                                  position: "relative",
                                  transition: "background-color 0.15s",
                                  "&:hover": isEditable
                                    ? {
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        fontWeight: 700,
                                      }
                                    : undefined,
                                }}
                              >
                                {showPercentages ? fmtPct(pct) : fmtBRL(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}

                    {/* Linha de Resultado Intermediário: MARGEM BRUTA */}
                    {group.group_type === "cmv" && (
                      <TableRow
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderTop: "2px solid",
                          borderTopColor: alpha(theme.palette.primary.main, 0.25),
                          borderBottom: "1.5px solid",
                          borderBottomColor: alpha(theme.palette.primary.main, 0.2),
                          "& td": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            fontSize: "0.85rem",
                            position: "sticky",
                            left: 0,
                            zIndex: 5,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            py: 1.25,
                            borderRight: "1px solid",
                            borderRightColor: alpha(theme.palette.primary.main, 0.2),
                          }}
                        >
                          (=) RECEITA LÍQUIDA / MARGEM BRUTA
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            fontSize: "0.875rem",
                            borderRight: "2px solid",
                            borderRightColor: alpha(theme.palette.primary.main, 0.25),
                          }}
                        >
                          {showPercentages
                            ? fmtPct(summary?.gross_margin_pct ?? 0)
                            : fmtBRL(summary?.gross_margin_total ?? 0)}
                        </TableCell>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const rev = dreData?.groups.find((g) => g.group_type === "gross_revenue")?.subtotal_row.monthly_amounts[m] || 0;
                          const cmv = dreData?.groups.find((g) => g.group_type === "cmv")?.subtotal_row.monthly_amounts[m] || 0;
                          const marg = rev - cmv;
                          const pct = rev > 0 ? (marg / rev) * 100 : 0;
                          return (
                            <TableCell key={m} align="right" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.825rem" }}>
                              {showPercentages ? fmtPct(pct) : fmtBRL(marg)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )}

                    {/* Linha de Resultado Intermediário: EBITDA */}
                    {group.group_type === "variable_expense" && (
                      <TableRow
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderTop: "2px solid",
                          borderTopColor: alpha(theme.palette.primary.main, 0.25),
                          borderBottom: "1.5px solid",
                          borderBottomColor: alpha(theme.palette.primary.main, 0.2),
                          "& td": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            fontSize: "0.85rem",
                            position: "sticky",
                            left: 0,
                            zIndex: 5,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            py: 1.25,
                            borderRight: "1px solid",
                            borderRightColor: alpha(theme.palette.primary.main, 0.2),
                          }}
                        >
                          (=) RESULTADO OPERACIONAL (EBITDA)
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            fontSize: "0.875rem",
                            borderRight: "2px solid",
                            borderRightColor: alpha(theme.palette.primary.main, 0.25),
                          }}
                        >
                          {showPercentages
                            ? fmtPct(summary?.ebitda_pct ?? 0)
                            : fmtBRL(summary?.ebitda_total ?? 0)}
                        </TableCell>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const rev = dreData?.groups.find((g) => g.group_type === "gross_revenue")?.subtotal_row.monthly_amounts[m] || 0;
                          const cmv = dreData?.groups.find((g) => g.group_type === "cmv")?.subtotal_row.monthly_amounts[m] || 0;
                          const fix = dreData?.groups.find((g) => g.group_type === "fixed_expense")?.subtotal_row.monthly_amounts[m] || 0;
                          const varExp = dreData?.groups.find((g) => g.group_type === "variable_expense")?.subtotal_row.monthly_amounts[m] || 0;
                          const ebit = rev - cmv - fix - varExp;
                          const pct = rev > 0 ? (ebit / rev) * 100 : 0;
                          return (
                            <TableCell key={m} align="right" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.825rem" }}>
                              {showPercentages ? fmtPct(pct) : fmtBRL(ebit)}
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
                      bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                      borderTop: "3px solid",
                      borderTopColor: isNetProfitPositive ? "#10B981" : "#F43F5E",
                      borderBottom: "1.5px solid",
                      borderBottomColor: isNetProfitPositive ? "#A7F3D0" : "#FECDD3",
                      "& td": {
                        bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        color: isNetProfitPositive ? "#065F46" : "#991B1B",
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        bgcolor: isNetProfitPositive ? "#ECFDF5" : "#FEF2F2",
                        py: 1.25,
                        borderRight: "1px solid",
                        borderRightColor: isNetProfitPositive ? "#A7F3D0" : "#FECDD3",
                      }}
                    >
                      (=) RESULTADO LÍQUIDO DO EXERCÍCIO
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        color: isNetProfitPositive ? "#065F46" : "#991B1B",
                        borderLeft: "1px solid",
                        borderLeftColor: isNetProfitPositive ? "#A7F3D0" : "#FECDD3",
                        borderRight: "2px solid",
                        borderRightColor: isNetProfitPositive ? "#6EE7B7" : "#FDA4AF",
                      }}
                    >
                      {showPercentages
                        ? fmtPct(summary.net_margin_pct)
                        : fmtBRL(summary.net_profit_total)}
                    </TableCell>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const netRow = dreData?.all_rows.find((r) => r.id === "result-net-profit");
                      const val = netRow?.monthly_amounts[m] || 0;
                      const pct = netRow?.monthly_percentages[m] || 0;
                      const isPositive = val >= 0;
                      return (
                        <TableCell
                          key={m}
                          align="right"
                          sx={{
                            fontWeight: 900,
                            fontSize: "0.85rem",
                            color: isPositive ? "#065F46" : "#991B1B",
                          }}
                        >
                          {showPercentages ? fmtPct(pct) : fmtBRL(val)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Linha de Margem Líquida Percentual */}
                  <TableRow
                    sx={{
                      bgcolor: isNetProfitPositive ? "#F0FDF4" : "#FFF1F2",
                      "& td": {
                        bgcolor: isNetProfitPositive ? "#F0FDF4" : "#FFF1F2",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.825rem",
                        color: isNetProfitPositive ? "#047857" : "#B91C1C",
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        bgcolor: isNetProfitPositive ? "#F0FDF4" : "#FFF1F2",
                        py: 0.85,
                        borderRight: "1px solid",
                        borderRightColor: isNetProfitPositive ? "#BBF7D0" : "#FECDD3",
                      }}
                    >
                      RESULTADO EM % (MARGEM LÍQUIDA)
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        color: isNetProfitPositive ? "#047857" : "#B91C1C",
                        borderRight: "2px solid",
                        borderRightColor: isNetProfitPositive ? "#86EFAC" : "#FCA5A5",
                      }}
                    >
                      {fmtPct(summary.net_margin_pct)}
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
                            fontWeight: 800,
                            fontSize: "0.825rem",
                            color: isPositive ? "#047857" : "#B91C1C",
                          }}
                        >
                          {fmtPct(pct)}
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
        />
      )}

      <AccountManagementModal
        open={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
        year={selectedYear}
      />

      <CellEditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onOpenReplicate={() => setIsQuickExpenseOpen(true)}
      />
    </Box>
  );
}
