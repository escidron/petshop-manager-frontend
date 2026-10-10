import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Users,
  Repeat,
  Calendar,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  batchUpsertDREEntries,
  type DREAccount,
  type DREGroupType,
  type DREEntryUpsert,
  type DRERowData,
} from "../../api/services/financial";
import MoneyInput from "./MoneyInput";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
  year: number;
  accounts: DREAccount[];
  reportRows?: DRERowData[];
  onOpenPayroll?: () => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const GROUP_TABS: { value: DREGroupType; label: string }[] = [
  { value: "fixed_expense", label: "Despesas Fixas" },
  { value: "variable_expense", label: "Despesas Variáveis" },
  { value: "financial_expense", label: "Despesas Financeiras" },
  { value: "financial_revenue", label: "Receitas Financeiras" },
  { value: "cmv", label: "Custos Diretos (CMV)" },
  { value: "gross_revenue", label: "Outras Receitas" },
];

const fmtBRL = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface AccountExpenseRowProps {
  account: DREAccount;
  defaultValue: number;
  monthsMap: Record<number, number>;
  isExpanded: boolean;
  isDirty: boolean;
  onDefaultChange: (accountId: number, val: number) => void;
  onMonthChange: (accountId: number, month: number, val: number) => void;
  onReplicateAll: (accountId: number) => void;
  onToggleExpand: (accountId: number) => void;
}

const AccountExpenseRow = React.memo(function AccountExpenseRow({
  account,
  defaultValue,
  monthsMap,
  isExpanded,
  isDirty,
  onDefaultChange,
  onMonthChange,
  onReplicateAll,
  onToggleExpand,
}: AccountExpenseRowProps) {
  const theme = useTheme();

  const totalAnnual = useMemo(() => {
    let sum = 0;
    for (let m = 1; m <= 12; m++) {
      sum += monthsMap[m] !== undefined ? monthsMap[m] : defaultValue;
    }
    return sum;
  }, [monthsMap, defaultValue]);

  const monthlyAverage = totalAnnual / 12;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.75,
        border: "1px solid",
        borderColor: isDirty ? "primary.main" : "divider",
        borderRadius: 2.5,
        transition: "all 0.15s ease",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 220 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {account.code && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                [{account.code}]
              </Typography>
            )}
            <Typography variant="subtitle2" fontWeight={700}>
              {account.name}
            </Typography>
            {isDirty && (
              <Typography variant="caption" color="primary.main" fontWeight={700}>
                (alterado)
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            Total anual: <strong style={{ color: totalAnnual > 0 ? theme.palette.primary.main : "inherit" }}>{fmtBRL(totalAnnual)}</strong>
            {" • "}
            Média: <strong>{fmtBRL(monthlyAverage)}</strong>/mês
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: 1,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: 150 } }}>
            <MoneyInput
              value={defaultValue}
              onChange={(val) => onDefaultChange(account.id, val)}
              placeholder="0,00"
              sx={{ width: "100%" }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => onReplicateAll(account.id)}
            startIcon={<Repeat size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              borderRadius: 2,
              whiteSpace: "nowrap",
              height: 40,
              px: 1.5,
              borderColor: alpha(theme.palette.primary.main, 0.35),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                borderColor: "primary.main",
              },
            }}
          >
            Replicar 12x
          </Button>

          <Button
            size="small"
            variant={isExpanded ? "contained" : "outlined"}
            color={isExpanded ? "primary" : "inherit"}
            onClick={() => onToggleExpand(account.id)}
            endIcon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              borderRadius: 2,
              whiteSpace: "nowrap",
              height: 40,
              px: 1.5,
              ...(isExpanded
                ? { bgcolor: "primary.main", color: "#fff", boxShadow: "none" }
                : { border: "1px solid", borderColor: "divider", color: "text.primary" }),
            }}
          >
            {isExpanded ? "Ocultar" : "Ajustar"}
          </Button>
        </Box>
      </Box>

      {/* Meses detalhados - exibidos ao expandir */}
      {isExpanded && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Calendar size={15} color={theme.palette.primary.main} />
              <Typography variant="caption" fontWeight={700} color="text.primary">
                Ajuste individual mês a mês:
              </Typography>
            </Box>

            <Button
              size="small"
              variant="text"
              color="primary"
              onClick={() => onReplicateAll(account.id)}
              startIcon={<RotateCcw size={13} />}
              sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, p: 0.5 }}
            >
              Preencher todos os 12 meses com {fmtBRL(defaultValue)}
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(6, 1fr)",
              },
              gap: 1,
            }}
          >
            {MONTH_NAMES.map((mName, mIdx) => {
              const mNum = mIdx + 1;
              const mVal = monthsMap[mNum] ?? defaultValue ?? 0;
              return (
                <Box
                  key={mName}
                  sx={{
                    p: 0.85,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    "&:hover": {
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ fontSize: "0.72rem", textTransform: "uppercase", display: "block", mb: 0.5 }}
                  >
                    {mName.slice(0, 3)}
                  </Typography>
                  <MoneyInput
                    value={mVal}
                    onChange={(val) => onMonthChange(account.id, mNum, val)}
                    size="small"
                    sx={{
                      width: "100%",
                      "& .MuiInputBase-root": {
                        px: 0.5,
                        height: 34,
                        fontSize: mVal >= 100000 ? "0.68rem" : mVal >= 10000 ? "0.72rem" : "0.75rem",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "inherit",
                        fontWeight: 600,
                        py: 0.5,
                        px: 0.25,
                      },
                      "& .MuiInputAdornment-root": {
                        mr: 0.35,
                      },
                      "& .MuiInputAdornment-root .MuiTypography-root": {
                        fontSize: "0.70rem",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          {/* Resumo da conta expandida */}
          <Box
            sx={{
              mt: 1.5,
              pt: 1.25,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Média mensal: <strong style={{ color: theme.palette.text.primary }}>{fmtBRL(monthlyAverage)}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total anual ({account.name}): <strong style={{ color: theme.palette.primary.main }}>{fmtBRL(totalAnnual)}</strong>
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
});

export default function QuickExpenseModal({
  open,
  onClose,
  year,
  accounts,
  reportRows = [],
  onOpenPayroll,
}: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DREGroupType>("fixed_expense");

  // Inicialização instantânea dos valores do relatório
  const [valuesByAccount, setValuesByAccount] = useState<Record<number, Record<number, number>>>(() => {
    const initialMap: Record<number, Record<number, number>> = {};
    for (const row of reportRows) {
      if (row.account_id && !row.is_system) {
        initialMap[row.account_id] = { ...row.monthly_amounts };
      }
    }
    return initialMap;
  });

  const [yearDefaultValues, setYearDefaultValues] = useState<Record<number, number>>(() => {
    const initialYearDefaults: Record<number, number> = {};
    for (const row of reportRows) {
      if (row.account_id && !row.is_system) {
        const amounts = Object.values(row.monthly_amounts || {});
        const firstNonZero = amounts.find((v) => v > 0);
        initialYearDefaults[row.account_id] = firstNonZero || 0;
      }
    }
    return initialYearDefaults;
  });

  // Rastreia apenas as contas alteradas pelo usuário
  const [dirtyAccountIds, setDirtyAccountIds] = useState<Set<number>>(new Set());
  // Contas expandidas com detalhamento dos 12 meses
  const [expandedAccounts, setExpandedAccounts] = useState<Record<number, boolean>>({});

  const batchMutation = useMutation({
    mutationFn: batchUpsertDREEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-report", year] });
      toast.success("Lançamentos salvos com sucesso!");
      onClose();
    },
    onError: () => {
      toast.error("Erro ao salvar lançamentos.");
    },
  });

  const markDirty = useCallback((accountId: number) => {
    setDirtyAccountIds((prev) => (prev.has(accountId) ? prev : new Set(prev).add(accountId)));
  }, []);

  const handleDefaultChange = useCallback((accountId: number, val: number) => {
    markDirty(accountId);
    setYearDefaultValues((prev) => ({ ...prev, [accountId]: val }));

    setValuesByAccount((prev) => {
      const currentMap = prev[accountId] || {};
      const amounts = Object.values(currentMap);
      const allSameOrEmpty =
        amounts.length === 0 ||
        amounts.every((v) => v === amounts[0]);

      if (allSameOrEmpty) {
        const newMap: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) {
          newMap[m] = val;
        }
        return { ...prev, [accountId]: newMap };
      }
      return prev;
    });
  }, [markDirty]);

  const handleMonthChange = useCallback((accountId: number, month: number, val: number) => {
    markDirty(accountId);
    setValuesByAccount((prev) => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] || {}),
        [month]: val,
      },
    }));
  }, [markDirty]);

  const handleReplicateAll = useCallback((accountId: number) => {
    markDirty(accountId);
    const val = yearDefaultValues[accountId] || 0;
    setValuesByAccount((prev) => {
      const monthsMap: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) {
        monthsMap[m] = val;
      }
      return { ...prev, [accountId]: monthsMap };
    });
    const acc = accounts.find((a) => a.id === accountId);
    toast.success(`Valor de ${fmtBRL(val)} replicado para os 12 meses${acc ? ` de "${acc.name}"` : ""}!`);
  }, [yearDefaultValues, accounts, markDirty]);

  const handleToggleExpand = useCallback((accountId: number) => {
    setExpandedAccounts((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  }, []);

  const handleSave = () => {
    const entriesToSave: DREEntryUpsert[] = [];

    for (const accId of dirtyAccountIds) {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc || acc.is_system || !acc.is_active) continue;

      const accMonths = valuesByAccount[accId] || {};
      const fallbackVal = yearDefaultValues[accId] ?? 0;

      for (let m = 1; m <= 12; m++) {
        const amount = accMonths[m] !== undefined ? accMonths[m] : fallbackVal;
        entriesToSave.push({
          account_id: accId,
          competence_year: year,
          competence_month: m,
          amount: amount,
        });
      }
    }

    if (entriesToSave.length === 0) {
      toast.info("Nenhuma alteração pendente para salvar.");
      onClose();
      return;
    }

    batchMutation.mutate(entriesToSave);
  };

  const activeAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        a.group_type === activeTab &&
        !a.is_system &&
        a.is_active &&
        !a.system_source?.startsWith("payroll_")
    );
  }, [accounts, activeTab]);

  const isAllExpanded = useMemo(() => {
    if (activeAccounts.length === 0) return false;
    return activeAccounts.every((acc) => Boolean(expandedAccounts[acc.id]));
  }, [activeAccounts, expandedAccounts]);

  const handleToggleExpandAll = useCallback(() => {
    setExpandedAccounts((prev) => {
      const nextState = !isAllExpanded;
      const updated: Record<number, boolean> = { ...prev };
      for (const acc of activeAccounts) {
        updated[acc.id] = nextState;
      }
      return updated;
    });
  }, [activeAccounts, isAllExpanded]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxWidth: 1060, width: "100%" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Lançar Receitas & Despesas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preencha ou ajuste os valores do ano de {year} pelas categorias do seu plano de contas.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* ── ABAS POR GRUPO DO PLANO DE CONTAS ──────────────────────────── */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}
        >
          {GROUP_TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} sx={{ fontWeight: 600, textTransform: "none" }} />
          ))}
        </Tabs>

        {/* ── BANNER INFORMATIVO: FOLHA DE PAGAMENTO AUTOMATIZADA ────────── */}
        {activeTab === "fixed_expense" && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.2),
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  Salários, Encargos e Benefícios são 100% Automáticos
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Essas 3 contas são calculadas colaborador por colaborador (com 13º, férias, FGTS, INSS e benefícios) na Gestão da Folha.
                </Typography>
              </Box>
            </Box>
            {onOpenPayroll && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<Users size={14} />}
                onClick={() => {
                  onClose();
                  onOpenPayroll();
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  boxShadow: 1,
                }}
              >
                Abrir Gestão da Folha
              </Button>
            )}
          </Paper>
        )}

        {/* ── BARRA DE CONTROLE: EXPANDIR/RECOLHER TODOS E STATUS ──────── */}
        {activeAccounts.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              px: 0.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {activeAccounts.length} {activeAccounts.length === 1 ? "conta disponível" : "contas disponíveis"} neste grupo
              {dirtyAccountIds.size > 0 && (
                <>
                  {" • "}
                  <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                    {dirtyAccountIds.size} alterada(s)
                  </span>
                </>
              )}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleToggleExpandAll}
              startIcon={isAllExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: "0.78rem",
                fontWeight: 600,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {isAllExpanded ? "Recolher todos os meses" : "Expandir todos os meses"}
            </Button>
          </Box>
        )}

        {/* ── LISTA DE CONTAS MEMOIZADAS ─────────────────────────────────── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: "55vh", overflowY: "auto", pr: 0.5 }}>
          {activeAccounts.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">
                Nenhuma conta manual ativa cadastrada neste grupo.
              </Typography>
            </Box>
          ) : (
            activeAccounts.map((acc) => (
              <AccountExpenseRow
                key={acc.id}
                account={acc}
                defaultValue={yearDefaultValues[acc.id] ?? 0}
                monthsMap={valuesByAccount[acc.id] || {}}
                isExpanded={Boolean(expandedAccounts[acc.id])}
                isDirty={dirtyAccountIds.has(acc.id)}
                onDefaultChange={handleDefaultChange}
                onMonthChange={handleMonthChange}
                onReplicateAll={handleReplicateAll}
                onToggleExpand={handleToggleExpand}
              />
            ))
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={batchMutation.isPending || dirtyAccountIds.size === 0}
          startIcon={batchMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
        >
          {batchMutation.isPending
            ? "Salvando..."
            : dirtyAccountIds.size > 0
            ? `Salvar (${dirtyAccountIds.size} conta${dirtyAccountIds.size > 1 ? "s" : ""})`
            : "Salvar Lançamentos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
