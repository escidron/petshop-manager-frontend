import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  X,
  Users,
  RefreshCw,
  Plus,
  Trash2,
  HeartPulse,
  Bus,
  Coffee,
  ShoppingBag,
  Send,
  Calendar,
  Save,
  Info,
} from "lucide-react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPayrollProfiles,
  updatePayrollProfile,
  getPayrollSummary,
  syncPayrollToDRE,
  calculateThirteenth,
  calculateVacation,
  calculateFGTS,
  calculateINSSProgressive,
  getINSSBracketDetails,
  type CustomBenefitItem,
} from "../../api/services/payroll";
import { type DREAccount } from "../../api/services/financial";
import MoneyInput from "./MoneyInput";
import { toast } from "react-toastify";

interface PayrollModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  accounts: DREAccount[];
  onSyncSuccess?: () => void;
}

const fmtBRL = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return "R$ 0,00";
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  bather: "Banhista",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Motorista / Entregador",
  other: "Outro",
  manager: "Gerente",
  admin: "Administrador",
};

const formatRole = (role?: string) => {
  if (!role) return "Outro";
  const lower = role.toLowerCase().trim();
  return ROLE_LABELS[lower] || role;
};

export const PayrollModal: React.FC<PayrollModalProps> = ({
  open,
  onClose,
  year: initialYear,
  accounts,
  onSyncSuccess,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const currentYear = useMemo(() => dayjs().year(), []);
  const currentMonth = useMemo(() => dayjs().month() + 1, []); // 1-12

  // Escopo de meses para lançamento no DRE
  const [scopeMode, setScopeMode] = useState<"from_current" | "full_year" | "custom">("from_current");
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
    if (initialYear === dayjs().year()) {
      const cur = dayjs().month() + 1;
      return Array.from({ length: 12 - cur + 1 }, (_, i) => cur + i);
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  });

  useEffect(() => {
    setSelectedYear(initialYear);
    if (initialYear === dayjs().year()) {
      const cur = dayjs().month() + 1;
      setScopeMode("from_current");
      setSelectedMonths(Array.from({ length: 12 - cur + 1 }, (_, i) => cur + i));
    } else {
      setScopeMode("full_year");
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  }, [open, initialYear]);

  const handleSelectFromCurrent = () => {
    setScopeMode("from_current");
    if (selectedYear === currentYear) {
      setSelectedMonths(
        Array.from({ length: 12 - currentMonth + 1 }, (_, i) => currentMonth + i),
      );
    } else {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    }
  };

  const handleSelectFullYear = () => {
    setScopeMode("full_year");
    setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleToggleMonth = (monthNumber: number) => {
    setScopeMode("custom");
    setSelectedMonths((prev) => {
      if (prev.includes(monthNumber)) {
        return prev.filter((m) => m !== monthNumber);
      } else {
        return [...prev, monthNumber].sort((a, b) => a - b);
      }
    });
  };

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [searchEmployee, setSearchEmployee] = useState<string>("");

  // Form State para o colaborador selecionado
  const [formState, setFormState] = useState<{
    base_salary: number;
    thirteenth_salary: number;
    vacation_provision: number;
    fgts_amount: number;
    inss_amount: number;
    transport_voucher: number;
    food_voucher: number;
    meal_voucher: number;
    health_insurance: number;
    other_benefits: number;
    other_benefits_description: string;
    custom_benefits: CustomBenefitItem[];
    notes: string;
    admission_date: string | null;
    resignation_date: string | null;
    is_active: boolean;
  }>({
    base_salary: 0,
    thirteenth_salary: 0,
    vacation_provision: 0,
    fgts_amount: 0,
    inss_amount: 0,
    transport_voucher: 0,
    food_voucher: 0,
    meal_voucher: 0,
    health_insurance: 0,
    other_benefits: 0,
    other_benefits_description: "",
    custom_benefits: [],
    notes: "",
    admission_date: null,
    resignation_date: null,
    is_active: true,
  });

  // Mapeamento de contas DRE customizado (3 linhas consolidadas)
  const [accountMapping, setAccountMapping] = useState<{
    salaries?: number;
    charges?: number;
    benefits?: number;
  }>({});

  // Query: Colaboradores e perfis de folha
  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["payroll-profiles"],
    queryFn: getPayrollProfiles,
    enabled: open,
  });

  // Query: Resumo consolidado da folha
  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ["payroll-summary"],
    queryFn: getPayrollSummary,
    enabled: open,
  });

  // Inicializar seleção do primeiro colaborador quando carregar
  useEffect(() => {
    if (profiles.length > 0 && selectedEmployeeId === null) {
      setSelectedEmployeeId(profiles[0].employee_id);
    }
  }, [profiles, selectedEmployeeId]);

  // Carregar dados do colaborador selecionado no form
  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.employee_id === selectedEmployeeId);
  }, [profiles, selectedEmployeeId]);

  useEffect(() => {
    if (selectedProfile) {
      let initialCustomBenefits = selectedProfile.custom_benefits
        ? [...selectedProfile.custom_benefits]
        : [];
      if (
        initialCustomBenefits.length === 0 &&
        ((selectedProfile.other_benefits ?? 0) > 0 ||
          (selectedProfile.other_benefits_description &&
            selectedProfile.other_benefits_description.trim().length > 0))
      ) {
        initialCustomBenefits = [
          {
            name:
              selectedProfile.other_benefits_description ||
              "Outros Benefícios",
            amount: selectedProfile.other_benefits || 0,
          },
        ];
      }

      setFormState({
        base_salary: selectedProfile.base_salary ?? 0,
        thirteenth_salary: selectedProfile.thirteenth_salary ?? 0,
        vacation_provision: selectedProfile.vacation_provision ?? 0,
        fgts_amount: selectedProfile.fgts_amount ?? 0,
        inss_amount:
          selectedProfile.inss_amount && selectedProfile.inss_amount > 0
            ? selectedProfile.inss_amount
            : (selectedProfile.base_salary ?? 0) > 0
              ? calculateINSSProgressive(selectedProfile.base_salary)
              : 0,
        transport_voucher: selectedProfile.transport_voucher ?? 0,
        food_voucher: selectedProfile.food_voucher ?? 0,
        meal_voucher: selectedProfile.meal_voucher ?? 0,
        health_insurance: selectedProfile.health_insurance ?? 0,
        other_benefits: 0,
        other_benefits_description: "",
        custom_benefits: initialCustomBenefits,
        notes: selectedProfile.notes || "",
        admission_date: selectedProfile.admission_date || null,
        resignation_date: selectedProfile.resignation_date || null,
        is_active: selectedProfile.is_active ?? true,
      });
    }
  }, [selectedProfile]);

  // Pré-preencher mapping padrão baseado nas 3 linhas consolidadas do sistema
  useEffect(() => {
    if (accounts.length > 0) {
      const salAccount =
        accounts.find((a) => a.system_source === "payroll_salaries") ||
        accounts.find((a) => a.name.toLowerCase().includes("salário"));
      const chargesAccount =
        accounts.find(
          (a) =>
            a.system_source === "payroll_charges" ||
            a.system_source === "payroll_inss",
        ) ||
        accounts.find(
          (a) =>
            a.name.toLowerCase().includes("encargo") ||
            a.name.toLowerCase().includes("inss"),
        );
      const benAccount =
        accounts.find((a) => a.system_source === "payroll_benefits") ||
        accounts.find((a) => a.name.toLowerCase().includes("benefício"));

      setAccountMapping((prev) => ({
        salaries: prev.salaries || salAccount?.id,
        charges: prev.charges || chargesAccount?.id,
        benefits: prev.benefits || benAccount?.id,
      }));
    }
  }, [accounts]);

  // Cálculos em tempo real para o colaborador ativo
  const liveCalculations = useMemo(() => {
    const customBenefitsSum = formState.custom_benefits.reduce(
      (acc, curr) => acc + (curr.amount || 0),
      0,
    );
    const totalBenefits =
      formState.transport_voucher +
      formState.food_voucher +
      formState.meal_voucher +
      formState.health_insurance +
      formState.other_benefits +
      customBenefitsSum;

    const totalSalariesAndProvisions =
      formState.base_salary +
      formState.thirteenth_salary +
      formState.vacation_provision;
    const totalTaxes = formState.inss_amount + formState.fgts_amount;
    const totalMonthlyCost =
      totalSalariesAndProvisions + totalTaxes + totalBenefits;

    const overheadAmount = totalMonthlyCost - formState.base_salary;
    const overheadPercentage =
      formState.base_salary > 0
        ? (overheadAmount / formState.base_salary) * 100
        : 0;

    return {
      customBenefitsSum,
      totalBenefits,
      totalSalariesAndProvisions,
      totalTaxes,
      totalMonthlyCost,
      overheadAmount,
      overheadPercentage,
    };
  }, [formState]);

  // Detalhes dinâmicos da faixa e alíquota de INSS (Tabela Oficial 2026)
  const inssDetails = useMemo(() => {
    return getINSSBracketDetails(formState.base_salary, formState.inss_amount);
  }, [formState.base_salary, formState.inss_amount]);

  // Ao alterar o Salário Base, preenche automaticamente 13º, Férias, FGTS e INSS na hora
  const handleBaseSalaryChange = (newBaseSalary: number) => {
    const thirteenth = calculateThirteenth(newBaseSalary);
    const vacation = calculateVacation(newBaseSalary, 1.3);
    const fgts = calculateFGTS(newBaseSalary, 0.08);
    const inss = calculateINSSProgressive(newBaseSalary);

    setFormState((prev) => ({
      ...prev,
      base_salary: newBaseSalary,
      thirteenth_salary: thirteenth,
      vacation_provision: vacation,
      fgts_amount: fgts,
      inss_amount: inss,
    }));
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncToDRE = async () => {
    if (selectedMonths.length === 0) {
      toast.warning(
        "Selecione pelo menos um mês de competência para lançar a folha no DRE.",
      );
      return;
    }

    try {
      setIsSyncing(true);

      // 1. Salva automaticamente o colaborador selecionado
      if (selectedEmployeeId) {
        await updatePayrollProfile(selectedEmployeeId, formState);
      }

      // 2. Busca lista atualizada de perfis para calcular o valor real total
      const latestProfiles = await getPayrollProfiles();
      const activeProfiles = latestProfiles.filter(
        (p) => p.is_active && p.employee_is_active,
      );
      const totalCost = activeProfiles.reduce(
        (sum, p) => sum + (p.total_monthly_cost || 0),
        0,
      );

      if (totalCost <= 0) {
        toast.warning(
          "A folha de pagamento está com valor R$ 0,00. Informe o salário base de pelo menos um colaborador antes de lançar no DRE.",
        );
        setIsSyncing(false);
        return;
      }

      // 3. Executa a sincronização para o DRE com os meses selecionados
      const result = await syncPayrollToDRE({
        year: selectedYear,
        months: selectedMonths,
        account_mapping: accountMapping,
      });

      const monthLabel =
        result.months_updated.length === 12
          ? `ano completo de ${result.year}`
          : `${result.months_updated.length} meses (${result.months_updated
              .map((m) => MONTH_NAMES[m - 1])
              .join(", ")})`;

      toast.success(
        `Folha de ${fmtBRL(totalCost)}/mês lançada com sucesso no DRE para ${monthLabel}! (${result.entries_created_or_updated} lançamentos)`,
      );

      // Invalida todos os caches do DRE e Folha
      await queryClient.invalidateQueries({ queryKey: ["payroll-profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["dre-report"] });
      await queryClient.invalidateQueries({ queryKey: ["dre-accounts"] });

      if (onSyncSuccess) onSyncSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Erro ao lançar folha no DRE.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  const handleExplicitSaveEmployee = async () => {
    if (!selectedEmployeeId) return;
    setIsSavingEmployee(true);
    try {
      await updatePayrollProfile(selectedEmployeeId, formState);
      toast.success("Dados do colaborador e vigência salvos com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["payroll-profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Erro ao salvar dados do colaborador.");
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const vigenciaStatusChip = useMemo(() => {
    if (!formState.admission_date) {
      return (
        <Chip
          label="Vigente o ano todo"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
        />
      );
    }
    const adm = dayjs(formState.admission_date);
    const admYear = adm.year();
    const admMonth = adm.format("MMMM");

    if (admYear > selectedYear) {
      return (
        <Chip
          label={`Entra apenas em ${adm.format("MM/YYYY")}`}
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
        />
      );
    }
    if (admYear === selectedYear) {
      return (
        <Chip
          label={`Entra em ${admMonth}/${admYear} (${adm.date()}º dia - proporcional)`}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
        />
      );
    }
    return (
      <Chip
        label={`Admitido em ${adm.format("DD/MM/YYYY")}`}
        size="small"
        color="success"
        variant="outlined"
        sx={{ fontWeight: 700, fontSize: "0.72rem", height: 22 }}
      />
    );
  }, [formState.admission_date, formState.resignation_date, selectedYear]);

  const handleSelectEmployee = async (newEmployeeId: number) => {
    if (newEmployeeId === selectedEmployeeId) return;

    // Se o colaborador atualmente ativo tem salário digitado, auto-salva antes de trocar
    if (selectedEmployeeId && formState.base_salary > 0) {
      try {
        await updatePayrollProfile(selectedEmployeeId, formState);
        queryClient.invalidateQueries({ queryKey: ["payroll-profiles"] });
        queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      } catch (e) {
        console.error("Auto-save on switch employee error", e);
      }
    }

    setSelectedEmployeeId(newEmployeeId);
  };

  // Filtragem da lista de colaboradores
  const filteredProfiles = useMemo(() => {
    if (!searchEmployee.trim()) return profiles;
    const q = searchEmployee.toLowerCase();
    return profiles.filter(
      (p) =>
        p.employee_name.toLowerCase().includes(q) ||
        p.employee_role.toLowerCase().includes(q),
    );
  }, [profiles, searchEmployee]);

  // Benefícios customizados adicionais
  const handleAddCustomBenefit = () => {
    setFormState((prev) => ({
      ...prev,
      custom_benefits: [...prev.custom_benefits, { name: "", amount: 0 }],
    }));
  };

  const handleUpdateCustomBenefit = (
    index: number,
    field: "name" | "amount",
    value: any,
  ) => {
    setFormState((prev) => {
      const next = [...prev.custom_benefits];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, custom_benefits: next };
    });
  };

  const handleRemoveCustomBenefit = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      custom_benefits: prev.custom_benefits.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: 24,
          },
        },
      }}
    >
      {/* ── HEADER DO MODAL ───────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              display: "flex",
            }}
          >
            <Users size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Gestão de Folha de Pagamento & Benefícios
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gerencie remunerações, encargos (13º, férias, FGTS, INSS) e
              benefícios com integração automática ao DRE.
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "text.secondary" }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* ── CORPO PRINCIPAL: MASTER-DETAIL SPLIT ──────────────────────────── */}
      <DialogContent
        sx={{ p: 0, display: "flex", flex: 1, overflow: "hidden" }}
      >
        {/* Painel Esquerdo: Lista de Colaboradores */}
        <Box
          sx={{
            width: { xs: "100%", md: 310 },
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Box
            sx={{
              p: 2,
              pb: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              size="small"
              placeholder="Buscar colaborador..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { borderRadius: 2, fontSize: "0.875rem" },
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 1,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                {filteredProfiles.length} COLABORADOR
                {filteredProfiles.length === 1 ? "" : "ES"}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  refetchProfiles();
                  refetchSummary();
                }}
                title="Recarregar"
              >
                <RefreshCw size={14} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
            {isLoadingProfiles ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredProfiles.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum colaborador encontrado.
                </Typography>
              </Box>
            ) : (
              filteredProfiles.map((p) => {
                const isSelected = p.employee_id === selectedEmployeeId;
                return (
                  <Paper
                    key={p.employee_id}
                    elevation={0}
                    onClick={() => handleSelectEmployee(p.employee_id)}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.08)
                        : "background.paper",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "primary.light",
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.action.hover, 0.05),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color={isSelected ? "primary.main" : "text.primary"}
                        sx={{ textTransform: "capitalize" }}
                      >
                        {p.employee_name}
                      </Typography>
                      <Chip
                        label={p.is_active ? "Ativo" : "Inativo"}
                        size="small"
                        color={p.is_active ? "success" : "default"}
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {formatRole(p.employee_role)}
                    </Typography>

                    {p.admission_date && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.68rem" }}
                      >
                        Desde {dayjs(p.admission_date).format("DD/MM/YYYY")}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.primary"
                      >
                        {fmtBRL(p.total_monthly_cost || p.base_salary)}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.65rem", ml: 0.5 }}
                        >
                          /mês
                        </Typography>
                      </Typography>
                      {p.overhead_percentage > 0 && (
                        <Chip
                          label={`+${p.overhead_percentage.toFixed(0)}%`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            backgroundColor: alpha(
                              theme.palette.warning.main,
                              0.15,
                            ),
                            color: theme.palette.warning.dark,
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        </Box>

        {/* Painel Direito: Formulário de Remuneração e Benefícios */}
        <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
          {selectedProfile ? (
            <Box>
              {/* Header do Colaborador Selecionado */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2.5,
                  pb: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {selectedProfile.employee_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cargo: {formatRole(selectedProfile.employee_role)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formState.is_active}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))
                        }
                        size="small"
                        color="success"
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={
                          formState.is_active
                            ? "success.main"
                            : "text.secondary"
                        }
                      >
                        {formState.is_active
                          ? "Ativo na Folha"
                          : "Inativo na Folha"}
                      </Typography>
                    }
                  />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Ano:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 105 }}>
                      <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        {[initialYear - 1, initialYear, initialYear + 1].map((y) => (
                          <MenuItem key={y} value={y} sx={{ fontWeight: 600 }}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>

              {/* ── CARD DE VIGÊNCIA NO DRE (COMPACTO & ESTRUTURADO) ──────────── */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  mb: 2.5,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                {/* Linha Superior: Título + Tooltip + Badge de Status */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        p: 0.6,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Calendar size={16} />
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="text.primary"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                    >
                      Vigência do Colaborador no DRE
                    </Typography>
                    <Tooltip
                      title="Define em quais meses o custo do colaborador é computado no DRE, com cálculo proporcional de dias no mês de entrada ou saída."
                      arrow
                      placement="top"
                    >
                      <Box sx={{ display: "flex", alignItems: "center", cursor: "help", color: "text.disabled", "&:hover": { color: "primary.main" } }}>
                        <Info size={14} />
                      </Box>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {vigenciaStatusChip}
                  </Box>
                </Box>

                {/* Linha dos Campos de Data: 2 Colunas Espaçosas */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  {/* Campo Admissão */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5, fontSize: "0.75rem" }}
                    >
                      Data de Admissão:
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                      <DatePicker
                        value={formState.admission_date ? dayjs(formState.admission_date) : null}
                        onChange={(newVal) => {
                          setFormState((prev) => ({
                            ...prev,
                            admission_date: newVal && newVal.isValid() ? newVal.format("YYYY-MM-DD") : null,
                          }));
                        }}
                        format="DD/MM/YYYY"
                        dayOfWeekFormatter={(day: Dayjs) => {
                          const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
                          return days[day.day()];
                        }}
                        slotProps={{
                          popper: {
                            sx: {
                              "& .MuiDayCalendar-weekDayLabel": {
                                color: "#374151 !important",
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                textTransform: "capitalize",
                              },
                              "& .MuiPickersDay-root": {
                                color: "#1e293b !important",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                "&.Mui-selected": {
                                  color: "#ffffff !important",
                                  bgcolor: "#313485 !important",
                                  fontWeight: 800,
                                },
                              },
                              "& .MuiPickersCalendarHeader-label": {
                                color: "#111827 !important",
                                fontWeight: 700,
                                textTransform: "capitalize",
                              },
                              "& .MuiPickersArrowSwitcher-button": {
                                color: "#475569 !important",
                              },
                            },
                          },
                          desktopPaper: {
                            sx: {
                              borderRadius: 2.5,
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                              border: "1px solid #E5E7EB",
                            },
                          },
                          textField: {
                            size: "small",
                            fullWidth: true,
                            placeholder: "DD/MM/AAAA",
                            sx: {
                              bgcolor: "#ffffff",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                height: 38,
                                fontSize: "0.85rem",
                                fontWeight: 600,
                              },
                              "& .MuiInputBase-input": {
                                py: 0.75,
                                px: 1.25,
                                fontSize: "0.85rem",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>

                  {/* Campo Desligamento */}
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        Data de Saída (Opcional):
                      </Typography>
                      {formState.resignation_date && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setFormState((prev) => ({ ...prev, resignation_date: null }))}
                          sx={{
                            fontSize: "0.7rem",
                            py: 0,
                            px: 0.5,
                            minWidth: 0,
                            textTransform: "none",
                            color: "error.main",
                            fontWeight: 700,
                            "&:hover": { bgcolor: "error.lighter" },
                          }}
                        >
                          Limpar (Em atividade)
                        </Button>
                      )}
                    </Box>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                      <DatePicker
                        value={formState.resignation_date ? dayjs(formState.resignation_date) : null}
                        onChange={(newVal) => {
                          setFormState((prev) => ({
                            ...prev,
                            resignation_date: newVal && newVal.isValid() ? newVal.format("YYYY-MM-DD") : null,
                          }));
                        }}
                        format="DD/MM/YYYY"
                        dayOfWeekFormatter={(day: Dayjs) => {
                          const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
                          return days[day.day()];
                        }}
                        slotProps={{
                          popper: {
                            sx: {
                              "& .MuiDayCalendar-weekDayLabel": {
                                color: "#374151 !important",
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                textTransform: "capitalize",
                              },
                              "& .MuiPickersDay-root": {
                                color: "#1e293b !important",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                "&.Mui-selected": {
                                  color: "#ffffff !important",
                                  bgcolor: "#313485 !important",
                                  fontWeight: 800,
                                },
                              },
                              "& .MuiPickersCalendarHeader-label": {
                                color: "#111827 !important",
                                fontWeight: 700,
                                textTransform: "capitalize",
                              },
                              "& .MuiPickersArrowSwitcher-button": {
                                color: "#475569 !important",
                              },
                            },
                          },
                          desktopPaper: {
                            sx: {
                              borderRadius: 2.5,
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                              border: "1px solid #E5E7EB",
                            },
                          },
                          textField: {
                            size: "small",
                            fullWidth: true,
                            placeholder: "Em atividade (colaborador ativo)",
                            sx: {
                              bgcolor: "#ffffff",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                height: 38,
                                fontSize: "0.85rem",
                                fontWeight: 600,
                              },
                              "& .MuiInputBase-input": {
                                py: 0.75,
                                px: 1.25,
                                fontSize: "0.85rem",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>
              </Paper>

              {/* ── SEÇÃO 1: SALÁRIO BASE & PROVISÕES ───────────────────────── */}
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="text.secondary"
                sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                1. Salário Base e Provisões Mensais
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Salário Base Mensal (Bruto)
                  </Typography>
                  <MoneyInput
                    value={formState.base_salary}
                    onChange={handleBaseSalaryChange}
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Salário contratual registrado
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Provisão 13º Salário
                  </Typography>
                  <MoneyInput
                    value={formState.thirteenth_salary}
                    onChange={(val) =>
                      setFormState((prev) => ({
                        ...prev,
                        thirteenth_salary: val,
                      }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Salário / 12 meses
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    Provisão Férias + 1/3
                  </Typography>
                  <MoneyInput
                    value={formState.vacation_provision}
                    onChange={(val) =>
                      setFormState((prev) => ({
                        ...prev,
                        vacation_provision: val,
                      }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    (Salário * 1.30) / 12 meses
                  </Typography>
                </Box>
              </Box>

              {/* ── SEÇÃO 2: ENCARGOS TRABALHISTAS ─────────────────────────── */}
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="text.secondary"
                sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                2. Encargos Trabalhistas e Tributos
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    FGTS (8%)
                  </Typography>
                  <MoneyInput
                    value={formState.fgts_amount}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, fgts_amount: val }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    8% sobre o salário base mensal
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    INSS / Encargos
                  </Typography>
                  <MoneyInput
                    value={formState.inss_amount}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, inss_amount: val }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 0.5,
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={
                        inssDetails.isCustom
                          ? "warning.main"
                          : inssDetails.nominalRate > 0
                            ? "primary.main"
                            : "text.secondary"
                      }
                      sx={{
                        display: "block",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {inssDetails.displayText}
                    </Typography>
                    {inssDetails.isCustom && formState.base_salary > 0 && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            inss_amount: inssDetails.calculatedAmount,
                          }))
                        }
                        sx={{
                          fontSize: "0.68rem",
                          p: 0,
                          minWidth: 0,
                          textTransform: "none",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        Recalcular
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* ── SEÇÃO 3: BENEFÍCIOS ─────────────────────────── */}
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="text.secondary"
                sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                3. Benefícios
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Bus size={14} color={theme.palette.text.secondary} />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Vale Transporte
                    </Typography>
                  </Box>
                  <MoneyInput
                    value={formState.transport_voucher}
                    onChange={(val) =>
                      setFormState((prev) => ({
                        ...prev,
                        transport_voucher: val,
                      }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ShoppingBag
                      size={14}
                      color={theme.palette.text.secondary}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Vale Alimentação (VA)
                    </Typography>
                  </Box>
                  <MoneyInput
                    value={formState.food_voucher}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, food_voucher: val }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Coffee size={14} color={theme.palette.text.secondary} />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Vale Refeição (VR)
                    </Typography>
                  </Box>
                  <MoneyInput
                    value={formState.meal_voucher}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, meal_voucher: val }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <HeartPulse
                      size={14}
                      color={theme.palette.text.secondary}
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Plano de Saúde
                    </Typography>
                  </Box>
                  <MoneyInput
                    value={formState.health_insurance}
                    onChange={(val) =>
                      setFormState((prev) => ({
                        ...prev,
                        health_insurance: val,
                      }))
                    }
                    fullWidth
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              {/* Benefícios Adicionais Dinâmicos (exibidos apenas ao clicar em adicionar) */}
              {formState.custom_benefits.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 0.8,
                      alignItems: "center",
                      pr: { xs: 0, sm: 5 },
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ flex: 1, minWidth: 140 }}
                    >
                      Valor (R$)
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ flex: 2 }}
                    >
                      Descrição do Benefício Adicional
                    </Typography>
                  </Box>
                  {formState.custom_benefits.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        gap: 2,
                        mb: 1.5,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 140 }}>
                        <MoneyInput
                          value={item.amount}
                          onChange={(val) =>
                            handleUpdateCustomBenefit(idx, "amount", val)
                          }
                          fullWidth
                        />
                      </Box>
                      <TextField
                        size="small"
                        placeholder="Ex: Seguro de Vida, Ajuda de Custo, Auxílio Farmácia..."
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateCustomBenefit(idx, "name", e.target.value)
                        }
                        sx={{ flex: 2 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveCustomBenefit(idx)}
                        sx={{ flexShrink: 0 }}
                        title="Remover benefício"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<Plus size={14} />}
                onClick={handleAddCustomBenefit}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  mb: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                {formState.custom_benefits.length === 0
                  ? "Adicionar benefício adicional"
                  : "Adicionar outro benefício"}
              </Button>

              {/* ── CARD RESUMO DO COLABORADOR ATIVO ────────────────────────── */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.15),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    color="primary.main"
                  >
                    CUSTO MENSAL REAL DESTE COLABORADOR
                  </Typography>
                  <Chip
                    label={`Sobrecusto +${liveCalculations.overheadPercentage.toFixed(1)}%`}
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 800 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr 1fr",
                      sm: "repeat(4, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", fontWeight: 700 }}
                    >
                      Salários & Provisões
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={800}
                      color="text.primary"
                    >
                      {fmtBRL(liveCalculations.totalSalariesAndProvisions)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.68rem" }}
                    >
                      (Salário Base + 13º + Férias)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", fontWeight: 700 }}
                    >
                      Encargos Trabalhistas
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={800}
                      color="text.primary"
                    >
                      {fmtBRL(liveCalculations.totalTaxes)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.68rem" }}
                    >
                      (INSS + FGTS)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", fontWeight: 700 }}
                    >
                      Benefícios a Funcionários
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={800}
                      color="text.primary"
                    >
                      {fmtBRL(liveCalculations.totalBenefits)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.68rem" }}
                    >
                      (VT + VA + VR + Saúde + Outros)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="primary.main"
                      fontWeight={700}
                      sx={{ display: "block" }}
                    >
                      CUSTO TOTAL EMPRESA
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      color="primary.main"
                    >
                      {fmtBRL(liveCalculations.totalMonthlyCost)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={isSavingEmployee ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
                    disabled={isSavingEmployee}
                    onClick={handleExplicitSaveEmployee}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2 }}
                  >
                    Salvar Dados do Colaborador
                  </Button>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                Selecione um colaborador ao lado para editar sua remuneração.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* ── FOOTER: CONSOLIDAÇÃO DA EMPRESA & LANÇAMENTO NO DRE ───────────── */}
      <Box
        sx={{
          p: 2.5,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: alpha(theme.palette.background.paper, 1),
        }}
      >
        {/* Strip de Totais Globais da Empresa - 3 Linhas Consolidadas Juntas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: 2.5,
            backgroundColor: alpha(theme.palette.action.hover, 0.04),
            border: "1px solid",
            borderColor: "divider",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontWeight: 700 }}
            >
              Salários & Provisões ({summary?.active_employees_count || 0}{" "}
              ativos)
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
            >
              {fmtBRL(summary?.total_salaries_and_provisions)}/mês
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.68rem" }}
            >
              (Salário Base + 13º + Férias)
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontWeight: 700 }}
            >
              Encargos Trabalhistas
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
            >
              {fmtBRL(
                summary?.total_charges ??
                  (summary?.total_inss || 0) + (summary?.total_fgts || 0),
              )}
              /mês
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.68rem" }}
            >
              (INSS + FGTS)
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontWeight: 700 }}
            >
              Benefícios a Funcionários
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
            >
              {fmtBRL(summary?.total_benefits)}/mês
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.68rem" }}
            >
              (VT + VA + VR + Saúde + Outros)
            </Typography>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.3),
              textAlign: { xs: "left", sm: "right" },
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="success.dark"
              sx={{ display: "block" }}
            >
              FOLHA GLOBAL CONSOLIDADA
            </Typography>
            <Typography variant="h6" fontWeight={800} color="success.dark">
              {fmtBRL(summary?.total_monthly_cost)}
              <Typography
                component="span"
                variant="caption"
                color="success.dark"
                sx={{ ml: 0.5, fontWeight: 700 }}
              >
                /mês
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* Seletor de Escopo de Meses para Aplicação no DRE */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Calendar size={16} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight={700}>
                Período de Aplicação no DRE ({selectedYear})
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant={scopeMode === "from_current" ? "contained" : "outlined"}
                color="primary"
                onClick={handleSelectFromCurrent}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  py: 0.25,
                  px: 1.25,
                  borderRadius: 1.5,
                  fontWeight: 600,
                }}
              >
                A partir deste mês ({MONTH_NAMES[currentMonth - 1]} a Dez)
              </Button>
              <Button
                size="small"
                variant={scopeMode === "full_year" ? "contained" : "outlined"}
                color="inherit"
                onClick={handleSelectFullYear}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  py: 0.25,
                  px: 1.25,
                  borderRadius: 1.5,
                  fontWeight: 600,
                }}
              >
                Ano Completo (Jan a Dez)
              </Button>
            </Box>
          </Box>

          {/* Chips interativos dos 12 Meses */}
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
            {MONTH_NAMES.map((name, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonths.includes(mNum);
              const isPast = selectedYear === currentYear && mNum < currentMonth;
              return (
                <Chip
                  key={mNum}
                  label={name}
                  size="small"
                  onClick={() => handleToggleMonth(mNum)}
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "filled" : "outlined"}
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    opacity: isPast && !isSelected ? 0.6 : 1,
                    fontSize: "0.75rem",
                    transition: "all 0.15s ease",
                  }}
                />
              );
            })}
          </Box>

          {/* Mensagem explicativa de proteção do passado */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.72rem" }}
          >
            <Info size={13} style={{ flexShrink: 0 }} />
            {selectedMonths.length === 12 ? (
              <span>
                <strong>Atenção:</strong> Serão atualizados todos os 12 meses de {selectedYear}.
              </span>
            ) : selectedMonths.length > 0 ? (
              <span>
                Serão atualizados <strong>{selectedMonths.length} meses</strong> ({selectedMonths.map((m) => MONTH_NAMES[m - 1]).join(", ")}). Os meses anteriores não selecionados <strong>permanecerão intactos</strong>, preservando o histórico contábil fechado.
              </span>
            ) : (
              <span style={{ color: theme.palette.error.main }}>
                Nenhum mês selecionado. Escolha pelo menos um mês para lançar.
              </span>
            )}
          </Typography>
        </Paper>

        {/* Linha Final de Ações: Lançar no DRE */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            * Ao lançar no DRE, o custo de cada colaborador é distribuído mês a mês considerando sua data de admissão e desligamento com cálculo proporcional de dias.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
            >
              Fechar
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleSyncToDRE}
              disabled={isSyncing || selectedMonths.length === 0}
              startIcon={
                isSyncing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Send size={16} />
                )
              }
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
              }}
            >
              {selectedMonths.length === 12
                ? `Lançar Folha no DRE (Ano Completo ${selectedYear})`
                : selectedMonths.length > 0
                ? `Lançar Folha no DRE (${selectedMonths.length} meses de ${selectedYear})`
                : `Selecione os meses para lançar`}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PayrollModal;
