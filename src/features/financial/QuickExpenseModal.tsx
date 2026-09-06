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
  Tooltip,
} from "@mui/material";
import { X, Save, Copy, ChevronDown, ChevronRight } from "lucide-react";
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
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const GROUP_TABS: { value: DREGroupType; label: string }[] = [
  { value: "fixed_expense", label: "Despesas Fixas" },
  { value: "variable_expense", label: "Despesas Variáveis" },
  { value: "financial_result", label: "Resultado Financeiro" },
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
        transition: "border-color 0.15s ease",
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
        <Box sx={{ minWidth: 240 }}>
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
            {isExpanded
              ? `Total no ano: ${fmtBRL(totalAnnual)} • Média mensal: ${fmtBRL(monthlyAverage)}`
              : "Valor mensal padrão (ou clique na seta para ajustar mês a mês)"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
          <MoneyInput
            value={defaultValue}
            onChange={(val) => onDefaultChange(account.id, val)}
            placeholder="0,00"
            sx={{ width: { xs: "100%", sm: 160 } }}
          />

          <Tooltip title="Replicar este valor para todos os 12 meses">
            <IconButton
              size="small"
              onClick={() => onReplicateAll(account.id)}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
            >
              <Copy size={16} />
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            variant="text"
            onClick={() => onToggleExpand(account.id)}
            sx={{ minWidth: 36, p: 0.5 }}
            title={isExpanded ? "Ocultar meses" : "Ver / Ajustar cada mês"}
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Button>
        </Box>
      </Box>

      {/* Meses detalhados - exibidos ao clicar no chevron */}
      {isExpanded && (
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: "1px dashed",
            borderColor: "divider",
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
            gap: 1.5,
          }}
        >
          {MONTH_NAMES.map((mName, mIdx) => {
            const mNum = mIdx + 1;
            const mVal = monthsMap[mNum] ?? defaultValue ?? 0;
            return (
              <Box key={mName}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                  {mName.slice(0, 3)}
                </Typography>
                <MoneyInput
                  value={mVal}
                  onChange={(val) => onMonthChange(account.id, mNum, val)}
                  size="small"
                />
              </Box>
            );
          })}
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
}: Props) {
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

    // Ao digitar no campo base, já preenche todos os 12 meses da conta
    setValuesByAccount((prev) => {
      const monthsMap: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) {
        monthsMap[m] = val;
      }
      return { ...prev, [accountId]: monthsMap };
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
    toast.info("Valor replicado para os 12 meses!");
  }, [yearDefaultValues, markDirty]);

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
      (a) => a.group_type === activeTab && !a.is_system && a.is_active
    );
  }, [accounts, activeTab]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Lançar Despesas & Custos Operacionais
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
