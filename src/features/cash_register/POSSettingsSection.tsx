import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Monitor,
  Building2,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Star,
  AlertTriangle,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCashRegisters,
  createCashRegister,
  updateCashRegister,
  listCashDestinationAccounts,
  createCashDestinationAccount,
  updateCashDestinationAccount,
  deleteCashDestinationAccount,
} from "../../api/services/cash";
import { updateTenant } from "../../api/services/tenants";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import type {
  CashRegisterResponse,
  CashDestinationAccountResponse,
} from "./types";
import dayjs from "dayjs";

const ACCOUNT_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  internal_cash: { label: "Caixa Interno", color: "#1E40AF", bg: "#EFF6FF" },
  bank_account: { label: "Conta Bancária", color: "#065F46", bg: "#ECFDF5" },
  safe: { label: "Cofre", color: "#92400E", bg: "#FEF3C7" },
  other: { label: "Outro", color: "#374151", bg: "#F3F4F6" },
};

export default function POSSettingsSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { tenant, setTenant } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // ── 1. Discount Policy State ──────────────────────────────────────────────
  const [discountEnabled, setDiscountEnabled] = useState<boolean>(
    tenant?.allow_discount ?? true
  );
  const [discountInput, setDiscountInput] = useState<string>(() => {
    const val = tenant?.max_discount_percentage ?? 100;
    return Number.isInteger(val) ? String(val) : String(val).replace(".", ",");
  });
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    if (tenant) {
      setDiscountEnabled(tenant.allow_discount ?? true);
      const val = tenant.max_discount_percentage ?? 100;
      setDiscountInput(Number.isInteger(val) ? String(val) : String(val).replace(".", ","));
    }
  }, [tenant?.allow_discount, tenant?.max_discount_percentage]);

  const parseDiscountInput = (raw: string): number => {
    const normalized = raw.trim().replace(",", ".");
    if (!normalized || isNaN(parseFloat(normalized))) return 0;
    const num = parseFloat(normalized);
    return Math.min(100, Math.max(0, Math.round(num * 100) / 100));
  };

  const handleDiscountBlur = () => {
    const finalVal = parseDiscountInput(discountInput);
    setDiscountInput(Number.isInteger(finalVal) ? String(finalVal) : String(finalVal).replace(".", ","));
  };

  const handleToggleDiscount = async (enabled: boolean) => {
    if (!tenant) return;
    setDiscountEnabled(enabled);
    setSavingDiscount(true);
    const finalVal = parseDiscountInput(discountInput);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        allow_discount: enabled,
        max_discount_percentage: enabled ? finalVal : 0,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success(
        enabled ? "Descontos no caixa ativados!" : "Descontos no caixa desativados!"
      );
    } catch (error) {
      console.error("Failed to toggle discount:", error);
      toast.error("Erro ao alterar configuração de desconto.");
      setDiscountEnabled(!enabled);
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleSaveDiscountValue = async () => {
    if (!tenant) return;
    const finalVal = parseDiscountInput(discountInput);
    setDiscountInput(Number.isInteger(finalVal) ? String(finalVal) : String(finalVal).replace(".", ","));
    setSavingDiscount(true);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        allow_discount: discountEnabled,
        max_discount_percentage: discountEnabled ? finalVal : 0,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success("Limite de desconto atualizado com sucesso!");
    } catch (error) {
      console.error("Failed to save discount value:", error);
      toast.error("Erro ao atualizar o limite de desconto.");
    } finally {
      setSavingDiscount(false);
    }
  };

  // ── 2. Cash Registers Queries & Mutations ─────────────────────────────────
  const { data: registers = [], isLoading: loadingRegisters } = useQuery({
    queryKey: ["cash-registers-settings"],
    queryFn: () => listCashRegisters(true),
  });

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegisterResponse | null>(null);
  const [registerName, setRegisterName] = useState("");

  const saveRegisterMutation = useMutation({
    mutationFn: async () => {
      if (!registerName.trim()) {
        throw new Error("Informe o nome do caixa.");
      }
      if (editingRegister) {
        return updateCashRegister(editingRegister.id, { name: registerName.trim() });
      }
      return createCashRegister({ name: registerName.trim() });
    },
    onSuccess: () => {
      toast.success(
        editingRegister ? "Caixa atualizado com sucesso!" : "Caixa criado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["cash-registers-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      setRegisterModalOpen(false);
      setEditingRegister(null);
      setRegisterName("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.message || "Erro ao salvar caixa.");
    },
  });

  const toggleRegisterActiveMutation = useMutation({
    mutationFn: async ({ registerId, isActive }: { registerId: number; isActive: boolean }) => {
      return updateCashRegister(registerId, { is_active: isActive });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Caixa ativado!" : "Caixa desativado!");
      queryClient.invalidateQueries({ queryKey: ["cash-registers-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao alterar status do caixa.");
    },
  });

  // ── 3. Destination Accounts Queries & Mutations ───────────────────────────
  const { data: destinationAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["cash-destination-accounts-settings"],
    queryFn: () => listCashDestinationAccounts(true),
  });

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashDestinationAccountResponse | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"internal_cash" | "bank_account" | "safe" | "other">("internal_cash");
  const [accountIsDefault, setAccountIsDefault] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState<CashDestinationAccountResponse | null>(null);

  const openNewAccountModal = () => {
    setEditingAccount(null);
    setAccountName("");
    setAccountType("internal_cash");
    setAccountIsDefault(false);
    setAccountModalOpen(true);
  };

  const openEditAccountModal = (acc: CashDestinationAccountResponse) => {
    setEditingAccount(acc);
    setAccountName(acc.name);
    setAccountType(acc.account_type);
    setAccountIsDefault(acc.is_default);
    setAccountModalOpen(true);
  };

  const saveAccountMutation = useMutation({
    mutationFn: async () => {
      if (!accountName.trim()) {
        throw new Error("Informe o nome da conta.");
      }
      if (editingAccount) {
        return updateCashDestinationAccount(editingAccount.id, {
          name: accountName.trim(),
          account_type: accountType,
          is_default: accountIsDefault,
        });
      }
      return createCashDestinationAccount({
        name: accountName.trim(),
        account_type: accountType,
        is_default: accountIsDefault,
      });
    },
    onSuccess: () => {
      toast.success(
        editingAccount ? "Conta atualizada com sucesso!" : "Conta criada com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts"] });
      setAccountModalOpen(false);
      setEditingAccount(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.message || "Erro ao salvar conta.");
    },
  });

  const toggleAccountActiveMutation = useMutation({
    mutationFn: async ({ accountId, isActive }: { accountId: number; isActive: boolean }) => {
      return updateCashDestinationAccount(accountId, { is_active: isActive });
    },
    onSuccess: () => {
      toast.success("Status da conta atualizado!");
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao atualizar conta.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return deleteCashDestinationAccount(accountId);
    },
    onSuccess: () => {
      toast.success("Conta removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cash-destination-accounts"] });
      setAccountToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao excluir conta.");
    },
  });

  return (
    <Stack spacing={{ xs: 2.5, sm: 3.5 }}>
      {/* ── CARD 1: TERMINAIS DE CAIXA (PDV) ────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#ffffff",
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Monitor size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                Terminais de Caixa
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                Cadastre os terminais físicos e estações de atendimento para abertura e fechamento de caixa.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={() => {
              setEditingRegister(null);
              setRegisterName("");
              setRegisterModalOpen(true);
            }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              px: 2,
              whiteSpace: "nowrap",
            }}
          >
            Novo Terminal
          </Button>
        </Box>

        {/* Visualização Desktop: Tabela */}
        <TableContainer sx={{ border: "1px solid #F1F5F9", borderRadius: 2.5, display: { xs: "none", md: "block" } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 800, color: "#334155", py: 1.5 }}>Nome do Terminal</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Cadastrado em</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingRegisters ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : registers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#64748B" }}>
                    Nenhum terminal cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                registers.map((reg) => (
                  <TableRow key={reg.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0F172A" }}>
                      {reg.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reg.is_active ? "Ativo" : "Inativo"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: reg.is_active ? "#DCFCE7" : "#F1F5F9",
                          color: reg.is_active ? "#166534" : "#64748B",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#64748B", fontSize: "0.85rem" }}>
                      {dayjs(reg.created_at).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                        <Tooltip title="Editar Nome">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingRegister(reg);
                              setRegisterName(reg.name);
                              setRegisterModalOpen(true);
                            }}
                            sx={{ color: "#64748B", "&:hover": { color: "#0F172A" } }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        {registers.length > 1 && (
                          <Tooltip title={reg.is_active ? "Desativar" : "Ativar"}>
                            <Switch
                              size="small"
                              checked={reg.is_active}
                              onChange={(e) =>
                                toggleRegisterActiveMutation.mutate({
                                  registerId: reg.id,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Visualização Mobile: Cards */}
        <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.25 }}>
          {loadingRegisters ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : registers.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum terminal cadastrado.
              </Typography>
            </Paper>
          ) : (
            registers.map((reg) => (
              <Paper
                key={reg.id}
                elevation={0}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  border: "1.5px solid",
                  borderColor: "divider",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="#0F172A">
                      {reg.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                      Cadastrado em {dayjs(reg.created_at).format("DD/MM/YYYY")}
                    </Typography>
                  </Box>
                  <Chip
                    label={reg.is_active ? "Ativo" : "Inativo"}
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      bgcolor: reg.is_active ? "#DCFCE7" : "#F1F5F9",
                      color: reg.is_active ? "#166534" : "#64748B",
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit2 size={14} />}
                    onClick={() => {
                      setEditingRegister(reg);
                      setRegisterName(reg.name);
                      setRegisterModalOpen(true);
                    }}
                    sx={{ fontSize: "0.75rem", py: 0.4, px: 1.5, borderRadius: 1.5 }}
                  >
                    Editar
                  </Button>
                  {registers.length > 1 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Status
                      </Typography>
                      <Switch
                        size="small"
                        checked={reg.is_active}
                        onChange={(e) =>
                          toggleRegisterActiveMutation.mutate({
                            registerId: reg.id,
                            isActive: e.target.checked,
                          })
                        }
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Paper>

      {/* ── CARD 2: CONTAS DE ORIGEM & DESTINO ──────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#ffffff",
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Building2 size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                Contas de Origem & Destino
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                Cadastre contas bancárias, cofres e caixas administrativos utilizados nas retiradas e abastecimentos.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={openNewAccountModal}
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              px: 2,
              whiteSpace: "nowrap",
            }}
          >
            Nova Conta
          </Button>
        </Box>

        {/* Visualização Desktop: Tabela */}
        <TableContainer sx={{ border: "1px solid #F1F5F9", borderRadius: 2.5, display: { xs: "none", md: "block" } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 800, color: "#334155", py: 1.5 }}>Nome da Conta</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Padrão</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingAccounts ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : destinationAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#64748B" }}>
                    Nenhuma conta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                destinationAccounts.map((acc) => {
                  const typeMeta = ACCOUNT_TYPE_LABELS[acc.account_type] || ACCOUNT_TYPE_LABELS.other;
                  return (
                    <TableRow key={acc.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "#0F172A" }}>
                        {acc.name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeMeta.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: typeMeta.bg,
                            color: typeMeta.color,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {acc.is_default ? (
                          <Chip
                            icon={<Star size={12} fill="#D97706" color="#D97706" />}
                            label="Padrão"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              bgcolor: "#FEF3C7",
                              color: "#92400E",
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="#94A3B8">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={acc.is_active ? "Ativa" : "Inativa"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: acc.is_active ? "#DCFCE7" : "#F1F5F9",
                            color: acc.is_active ? "#166534" : "#64748B",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5 }}>
                          <Tooltip title="Editar Conta">
                            <IconButton
                              size="small"
                              onClick={() => openEditAccountModal(acc)}
                              sx={{ color: "#64748B", "&:hover": { color: "#0F172A" } }}
                            >
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>

                          {destinationAccounts.length > 1 && (
                            <Tooltip title={acc.is_active ? "Desativar" : "Ativar"}>
                              <Switch
                                size="small"
                                checked={acc.is_active}
                                onChange={(e) =>
                                  toggleAccountActiveMutation.mutate({
                                    accountId: acc.id,
                                    isActive: e.target.checked,
                                  })
                                }
                              />
                            </Tooltip>
                          )}

                          {destinationAccounts.length > 1 && (
                            <Tooltip title="Excluir Conta">
                              <IconButton
                                size="small"
                                onClick={() => setAccountToDelete(acc)}
                                sx={{ color: "#DC2626", "&:hover": { color: "#991B1B" } }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Visualização Mobile: Cards */}
        <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.25 }}>
          {loadingAccounts ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : destinationAccounts.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum destino cadastrado.
              </Typography>
            </Paper>
          ) : (
            destinationAccounts.map((acc) => {
              const typeMeta = ACCOUNT_TYPE_LABELS[acc.account_type] || ACCOUNT_TYPE_LABELS.other;
              return (
                <Paper
                  key={acc.id}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {acc.name}
                        </Typography>
                        {acc.is_default && (
                          <Chip
                            icon={<Star size={11} fill="#D97706" color="#D97706" />}
                            label="Padrão"
                            size="small"
                            sx={{
                              height: 20,
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              bgcolor: "#FEF3C7",
                              color: "#92400E",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                        <Chip
                          label={typeMeta.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            height: 22,
                            bgcolor: typeMeta.bg,
                            color: typeMeta.color,
                          }}
                        />
                        <Chip
                          label={acc.is_active ? "Ativa" : "Inativa"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            height: 22,
                            bgcolor: acc.is_active ? "#DCFCE7" : "#F1F5F9",
                            color: acc.is_active ? "#166534" : "#64748B",
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Actions Bar */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {acc.is_active ? "Ativa" : "Inativa"}
                      </Typography>
                      {destinationAccounts.length > 1 && (
                        <Switch
                          size="small"
                          checked={acc.is_active}
                          onChange={(e) =>
                            toggleAccountActiveMutation.mutate({
                              accountId: acc.id,
                              isActive: e.target.checked,
                            })
                          }
                        />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => openEditAccountModal(acc)}
                        sx={{ color: "text.secondary", border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 0.75 }}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      {destinationAccounts.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => setAccountToDelete(acc)}
                          sx={{ color: "#DC2626", border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 0.75 }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      </Paper>

      {/* ── CARD 3: POLÍTICAS DE DESCONTO NO CAIXA ──────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#ffffff",
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                bgcolor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Percent size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A">
                Políticas de Desconto no Caixa
              </Typography>
              <Typography variant="body2" color="#64748B">
                Controle a concessão de descontos durante a realização de vendas no PDV.
              </Typography>
            </Box>
          </Box>

          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                  Permitir Desconto no Caixa
                </Typography>
                <Typography variant="caption" color="#64748B">
                  Habilita o campo de desconto (em % ou valor) na finalização de vendas do PDV.
                </Typography>
              </Box>
              <Switch
                checked={discountEnabled}
                onChange={(e) => handleToggleDiscount(e.target.checked)}
                disabled={savingDiscount}
                color="primary"
              />
            </Box>

            {discountEnabled && (
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "#F8FAFC",
                  borderRadius: 2.5,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                    Limite Máximo de Desconto Permitido (%)
                  </Typography>
                  <Typography variant="caption" color="#64748B">
                    Operadores e funcionários não poderão conceder descontos acima deste percentual.
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
                  <TextField
                    type="text"
                    inputMode="decimal"
                    size="small"
                    placeholder="0"
                    value={discountInput}
                    disabled={savingDiscount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                        setDiscountInput(val);
                      }
                    }}
                    onBlur={handleDiscountBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                        handleSaveDiscountValue();
                      }
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end" sx={{ mr: 0.5 }}>
                            <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.85rem" }}>
                              %
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                      htmlInput: {
                        style: {
                          textAlign: "right",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          padding: "6px 8px",
                        },
                      },
                    }}
                    sx={{
                      width: { xs: 90, sm: 105 },
                      bgcolor: "#ffffff",
                      borderRadius: 1.5,
                      "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveDiscountValue}
                    loading={savingDiscount}
                    sx={{ py: 0.75, px: 2.5, fontWeight: 700, borderRadius: 2, flex: { xs: 1, sm: "none" } }}
                  >
                    Salvar Limite
                  </Button>
                </Box>
              </Box>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* ── MODAL: CRIAR / EDITAR TERMINAL DE CAIXA ─────────────────────────── */}
      <Dialog
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            pt: 2.5,
            pb: 1.5,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Typography variant="h6" fontWeight={800} color="#0F172A">
            {editingRegister ? "Editar Terminal de Caixa" : "Novo Terminal de Caixa"}
          </Typography>
          <IconButton size="small" onClick={() => setRegisterModalOpen(false)} sx={{ color: "#64748B" }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: "20px !important", pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="#64748B" lineHeight={1.5}>
            Informe o nome do terminal (ex: <em>Caixa Principal</em>, <em>Caixa 2 - Banho & Tosa</em>).
          </Typography>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.75, fontWeight: 700, fontSize: "0.85rem", color: "#334155" }}>
              Nome do Caixa / Terminal
            </FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="Ex: Caixa 2"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              autoFocus
              sx={{
                bgcolor: "#ffffff",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          <Button variant="outlined" onClick={() => setRegisterModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => saveRegisterMutation.mutate()}
            loading={saveRegisterMutation.isPending}
          >
            Salvar Terminal
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: CRIAR / EDITAR CONTA DE DESTINO / ORIGEM ────────────────── */}
      <Dialog
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            pt: 2.5,
            pb: 1.5,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Typography variant="h6" fontWeight={800} color="#0F172A">
            {editingAccount ? "Editar Conta de Destino" : "Nova Conta de Destino"}
          </Typography>
          <IconButton size="small" onClick={() => setAccountModalOpen(false)} sx={{ color: "#64748B" }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: "20px !important", pb: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.75, fontWeight: 700, fontSize: "0.85rem", color: "#334155" }}>
              Nome da Conta / Destino
            </FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="Ex: Conta Itaú, Cofre Principal, Gaveta Reserva"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoFocus
              sx={{
                bgcolor: "#ffffff",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          </FormControl>

          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.75, fontWeight: 700, fontSize: "0.85rem", color: "#334155" }}>
              Tipo de Conta
            </FormLabel>
            <Select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="internal_cash">Caixa Interno / Administrativo</MenuItem>
              <MenuItem value="bank_account">Conta Bancária (PIX / Transferência)</MenuItem>
              <MenuItem value="safe">Cofre de Segurança</MenuItem>
              <MenuItem value="other">Outro / Despesas Gerais</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={accountIsDefault}
                  onChange={(e) => setAccountIsDefault(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#1E293B">
                    Conta Padrão
                  </Typography>
                  <Typography variant="caption" color="#64748B">
                    Será selecionada automaticamente em novas sangrias e suprimentos.
                  </Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          <Button variant="outlined" onClick={() => setAccountModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => saveAccountMutation.mutate()}
            loading={saveAccountMutation.isPending}
          >
            Salvar Conta
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: CONFIRMAR EXCLUSÃO DE CONTA ──────────────────────────────── */}
      <Dialog
        open={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            pt: 2.5,
            pb: 1.5,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <AlertTriangle size={22} color="#DC2626" />
          <Typography variant="h6" fontWeight={800} color="#DC2626">
            Excluir Conta
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: "20px !important", pb: 2 }}>
          <Typography variant="body2" color="#334155" lineHeight={1.6}>
            Tem certeza de que deseja excluir a conta <strong>"{accountToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="caption" color="#64748B" display="block" mt={1}>
            Esta conta não estará mais disponível para novas sangrias e suprimentos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          <Button variant="outlined" onClick={() => setAccountToDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (accountToDelete) {
                deleteAccountMutation.mutate(accountToDelete.id);
              }
            }}
            loading={deleteAccountMutation.isPending}
          >
            Excluir Conta
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
