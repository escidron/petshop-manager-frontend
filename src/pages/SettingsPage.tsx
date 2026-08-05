import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack,
  Divider,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  Menu,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Settings,
  CreditCard,
  User,
  Trash2,
  AlertTriangle,
  Info,
  Users,
  QrCode,
  CheckCircle2,
  Lock,
  Plus,
  X,
  Download,
  Package as PackageIcon,
  Truck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { tenantSchema } from "../features/tenants/schemas";
import type { TenantFormData } from "../features/tenants/types";
import { updateTenant, updateSubscription, deleteAccount } from "../api/services/tenants";
import {
  listTenantUsers,
  createTenantUser,
  removeTenantUser,
  changePassword,
  type TenantUserResponse,
} from "../api/services/users";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { useToast } from "../hooks/useToast";
import { maskPhone, maskDocument } from "../utils/masks";
import {
  listPaymentMethods,
  cancelSubscription,
  refundAndCancelSubscription,
  listCharges,
  updateChargeCard,
  changeSubscriptionToPix,
} from "../api/services/subscriptions";
import CheckoutForm from "../features/billing/CheckoutForm";
import CheckoutStepper from "../features/billing/CheckoutStepper";
import UpdateCardModal from "../features/billing/UpdateCardModal";
import type { PaymentMethod, CheckoutPixResponse, SubscriptionCharge } from "../features/billing/types";
import { Button } from "../components/Button/Button";
import WorkingHoursSettings from "../features/tenants/WorkingHoursSettings";
import { exportClients } from "../api/services/clients";
import { exportProducts } from "../api/services/products";
import { exportServices } from "../api/services/tenant_services";
import { exportPackages } from "../api/services/packages";
import { exportSuppliers } from "../api/services/suppliers";
import { exportEmployees } from "../api/services/employees";

const createUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(40),
  role: z.enum(["owner", "employee"]),
});
type CreateUserFormData = z.infer<typeof createUserSchema>;

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Senha atual é obrigatória"),
    new_password: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres").max(40),
    confirm_password: z.string().min(1, "Confirmação é obrigatória"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = () => {
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(0);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [openTenantEdit, setOpenTenantEdit] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openUpdateCard, setOpenUpdateCard] = useState(false);
  const [manageAnchorEl, setManageAnchorEl] = useState<null | HTMLElement>(null);
  const [openPixConfirmation, setOpenPixConfirmation] = useState(false);
  const [loadingChangeToPix, setLoadingChangeToPix] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [pixDocument, setPixDocument] = useState("");
  const [pixData, setPixData] = useState<CheckoutPixResponse | null>(null);
  const { tenant, user, setTenant, checkAuth } = useAuth();
  const { isOwner } = usePermission();
  const toast = useToast();

  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitValue, setLimitValue] = useState<number>(2);
  const [savingLimit, setSavingLimit] = useState(false);

  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [savingDiscount, setSavingDiscount] = useState(false);

  const handleToggleLimit = async (enabled: boolean) => {
    if (!tenant) return;
    setLimitEnabled(enabled);
    setSavingLimit(true);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        max_simultaneous_appointments: enabled ? Number(limitValue) : null,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success(enabled ? "Limite de agendamentos ativado!" : "Limite de agendamentos desativado!");
    } catch (error) {
      console.error("Failed to toggle limit:", error);
      toast.error("Erro ao alterar configuração de limite.");
      setLimitEnabled(!enabled);
    } finally {
      setSavingLimit(false);
    }
  };

  const handleSaveLimitValue = async () => {
    if (!tenant) return;
    setSavingLimit(true);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        max_simultaneous_appointments: limitEnabled ? Number(limitValue) : null,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success("Limite de agendamentos updated!");
    } catch (error) {
      console.error("Failed to save limit value:", error);
      toast.error("Erro ao atualizar o limite de agendamentos.");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleToggleDiscount = async (enabled: boolean) => {
    if (!tenant) return;
    setDiscountEnabled(enabled);
    setSavingDiscount(true);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        allow_discount: enabled,
        max_discount_percentage: enabled ? Number(discountValue) : 0,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success(enabled ? "Descontos no caixa ativados!" : "Descontos no caixa desativados!");
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
    setSavingDiscount(true);
    try {
      const payload = {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || null,
        allow_discount: discountEnabled,
        max_discount_percentage: discountEnabled ? Number(discountValue) : 0,
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      toast.success("Limite de desconto atualizado!");
    } catch (error) {
      console.error("Failed to save discount value:", error);
      toast.error("Erro ao atualizar o limite de desconto.");
    } finally {
      setSavingDiscount(false);
    }
  };

  const [charges, setCharges] = useState<SubscriptionCharge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [openUpdateCardDialog, setOpenUpdateCardDialog] = useState(false);
  const [updateCardLoading, setUpdateCardLoading] = useState(false);
  const [chargeToUpdateCard, _setChargeToUpdateCard] = useState<SubscriptionCharge | null>(null);


  const [tenantUsers, setTenantUsers] = useState<TenantUserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [openDeleteAccount, setOpenDeleteAccount] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState<1 | 2>(1);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  const [loadingExportClients, setLoadingExportClients] = useState(false);
  const [loadingExportProducts, setLoadingExportProducts] = useState(false);
  const [loadingExportServices, setLoadingExportServices] = useState(false);
  const [loadingExportPackages, setLoadingExportPackages] = useState(false);
  const [loadingExportSuppliers, setLoadingExportSuppliers] = useState(false);
  const [loadingExportUsers, setLoadingExportUsers] = useState(false);

  const {
    control: controlPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const {
    control: controlCreateUser,
    handleSubmit: handleSubmitCreateUser,
    formState: { errors: createUserErrors },
    reset: resetCreateUser,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee" },
  });

  const tabConfig = useMemo(
    () => [
      { id: "general", label: "Geral", icon: <Settings size={18} /> },
      ...(isOwner
        ? [{ id: "billing", label: "Planos e Cobrança", icon: <CreditCard size={18} /> }]
        : []),
      { id: "profile", label: "Perfil", icon: <User size={18} /> },
      ...(isOwner
        ? [{ id: "users", label: "Usuários", icon: <Users size={18} /> }]
        : []),
      ...(isOwner
        ? [{ id: "backup", label: "Exportar Dados", icon: <Download size={18} /> }]
        : []),
    ],
    [isOwner],
  );

  const getTabIndex = useCallback((id: string) => tabConfig.findIndex((t) => t.id === id), [tabConfig]);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">(
    (tenant?.subscription?.payment_method as "card" | "pix") ?? "card",
  );

  useEffect(() => {
    if (tenant?.subscription?.payment_method) {
      setPaymentMethod(tenant.subscription.payment_method as "card" | "pix");
    }
  }, [tenant?.subscription?.payment_method]);

  useEffect(() => {
    if (tenant?.document && !pixDocument) {
      setPixDocument(maskDocument(tenant.document));
    }
  }, [tenant?.document, pixDocument]);

  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<"card" | "pix" | null>(null);
  const [checkoutStartAt, setCheckoutStartAt] = useState<string | null>(null);

  const confirmPaymentMethodChange = async (method: "card" | "pix") => {
    if (!tenant?.id) return;
    setPendingPaymentMethod(null);

    // PIX → Cartão com assinatura ativa: precisa criar subscription no Pagarme
    // com start_at = current_period_end para não sobrepor o período já pago
    if (method === "card" && tenant?.subscription?.payment_method === "pix" && tenant?.subscription?.status === "active") {
      const startAt = tenant.subscription.current_period_end;
      setCheckoutStartAt(startAt);
      setPixData(null);
      setOpenCheckout(true);
      return;
    }

    setPaymentMethod(method);
    try {
      await updateSubscription(tenant.id, method);
      await checkAuth();
    } catch {
      setPaymentMethod(paymentMethod); // revert on error
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      phone: tenant?.phone || "",
      document: tenant?.document || "",
    },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || "",
      });
      setLimitEnabled(tenant.max_simultaneous_appointments !== null && tenant.max_simultaneous_appointments !== undefined);
      setLimitValue(tenant.max_simultaneous_appointments ?? 2);
      setDiscountEnabled(tenant.allow_discount ?? true);
      setDiscountValue(tenant.max_discount_percentage ?? 100);
    }
  }, [tenant, reset]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") {
      setValue(isOwner ? getTabIndex("billing") : 0);
    } else if (tab !== null && !isNaN(Number(tab))) {
      setValue(Number(tab));
    }
  }, [searchParams, isOwner, getTabIndex]);

  useEffect(() => {
    if (!isOwner) return;
    setLoadingUsers(true);
    listTenantUsers()
      .then(setTenantUsers)
      .finally(() => setLoadingUsers(false));
  }, [isOwner]);

  const fetchCards = useCallback(async () => {
    try {
      const methods = await listPaymentMethods();
      setSavedCards(methods);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCharges = useCallback(async () => {
    setLoadingCharges(true);
    try {
      const history = await listCharges();
      setCharges(history);
    } catch (err) {
      console.error("Failed to fetch charges:", err);
    } finally {
      setLoadingCharges(false);
    }
  }, []);

  const handleChangeToPix = async () => {
    setLoadingChangeToPix(true);
    try {
      await changeSubscriptionToPix();
      toast.success("Forma de pagamento alterada para PIX!");
      await checkAuth();
      setOpenPixConfirmation(false);
    } catch (err) {
      toast.error("Erro ao alterar para PIX. Tente novamente.");
    } finally {
      setLoadingChangeToPix(false);
    }
  };

  // Limpa os dados sensíveis imediatamente ao trocar de tenant,
  // evitando que cartões/cobranças de um tenant apareçam em outro.
  useEffect(() => {
    setSavedCards([]);
    setCharges([]);
  }, [tenant?.id]);

  // Busca cartões e cobranças ao abrir a aba de cobrança (ou ao trocar de tenant)
  useEffect(() => {
    if (!isOwner) return;
    const billingIdx = tabConfig.findIndex((t) => t.id === "billing");
    if (value === billingIdx) {
      fetchCards();
      fetchCharges();
    }
  }, [value, isOwner, tabConfig, fetchCards, fetchCharges, tenant?.id]);

  // Polling após pagamento: verifica status a cada 2s até ficar active
  useEffect(() => {
    if (!awaitingConfirmation) return;

    if (tenant?.subscription?.status === "active") {
      setAwaitingConfirmation(false);
      setPollCount(0);
      fetchCards();
      return;
    }

    if (pollCount >= 15) {
      setAwaitingConfirmation(false);
      setPollCount(0);
      return;
    }

    const timer = setTimeout(async () => {
      await checkAuth();
      setPollCount((c) => c + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [awaitingConfirmation, pollCount, tenant?.subscription?.status, checkAuth, fetchCards]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const getTrialDays = () => {
    if (!tenant?.subscription?.trial_ends_at) return 0;
    const expiryDate = dayjs(tenant.subscription.trial_ends_at);
    const daysLeft = Math.ceil(expiryDate.diff(dayjs(), "hour") / 24);
    return daysLeft > 0 ? daysLeft : 0;
  };

  const trialDays = getTrialDays();
  const isTrialing = !tenant?.feature_flags?.free_access && (tenant?.subscription?.plan?.code === "FREE_TRIAL" || tenant?.subscription?.status === "trialing");

  const activePendingPixCharge = useMemo(() => {
    return charges.find(c => c.payment_method === "pix" && c.status === "pending" && c.pix_qr_code);
  }, [charges]);

  const getChargeStatusChip = (status: string) => {
    const mapping: Record<string, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
      paid: { label: "Paga", color: "success" },
      captured: { label: "Paga", color: "success" },
      pending: { label: "Pendente", color: "warning" },
      waiting_capture: { label: "Aguardando Captura", color: "info" },
      authorized_pending_capture: { label: "Autorizada (Pendente Captura)", color: "info" },
      not_authorized: { label: "Não Autorizada", color: "error" },
      failed: { label: "Falhou", color: "error" },
      refunded: { label: "Estornada", color: "default" },
      voided: { label: "Cancelada", color: "default" },
    };
    const conf = mapping[status] || { label: status, color: "default" };
    return <Chip label={conf.label} color={conf.color} size="small" sx={{ fontWeight: 700 }} />;
  };

  const onSaveTenant = async (data: TenantFormData) => {
    if (!tenant) return;
    setSavingTenant(true);
    try {
      const payload = {
        ...data,
        max_simultaneous_appointments: limitEnabled ? Number(limitValue) : null
      };
      const updatedTenant = await updateTenant(tenant.id, payload);
      setTenant({ ...tenant, ...updatedTenant });
      setOpenTenantEdit(false);
      toast.success("Informações da empresa atualizadas!");
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast.error("Erro ao atualizar informações da empresa.");
    } finally {
      setSavingTenant(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setChangingPassword(true);
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      setOpenChangePassword(false);
      resetPasswordForm();
      toast.success("Senha alterada com sucesso!");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Senha atual incorreta.";
      toast.error(message || "Senha atual incorreta.");
    } finally {
      setChangingPassword(false);
    }
  };

  const onDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await removeTenantUser(userToDelete.id);
      setTenantUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      toast.success("Usuário removido com sucesso!");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao remover usuário.";
      toast.error(message || "Erro ao remover usuário.");
    } finally {
      setDeletingUser(false);
    }
  };

  const onCreateUser = async (data: CreateUserFormData) => {
    setCreatingUser(true);
    try {
      const newUser = await createTenantUser(data);
      setTenantUsers((prev) => [...prev, newUser]);
      setOpenCreateUser(false);
      resetCreateUser();
      toast.success("Usuário criado com sucesso!");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao criar usuário. Verifique os dados e tente novamente.";
      toast.error(message || "Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount(deleteAccountPassword);
      toast.success("Conta encerrada. Até mais!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao encerrar a conta.";
      toast.error(message || "Erro ao encerrar a conta. Tente novamente.");
      setDeletingAccount(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      if (tenant?.subscription?.eligible_for_refund) {
        await refundAndCancelSubscription();
        toast.success("Assinatura cancelada e valor estornado com sucesso.");
      } else {
        await cancelSubscription();
        toast.success("Assinatura cancelada com sucesso.");
      }
      await checkAuth(); // Updates tenant state
      setOpenCancelModal(false);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao cancelar a assinatura. Tente novamente.";
      toast.error(message || "Erro ao cancelar a assinatura. Tente novamente.");
    } finally {
      setCancelingSubscription(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary.main">
            Configurações
          </Typography>
          <Typography variant="body1" color="text.primary">
            Gerencie as preferências da sua conta, empresa e assinaturas.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            sx={{
              "& .MuiTab-root": { color: "text.primary", fontWeight: 600 },
              "& .Mui-selected": { color: "primary.main !important" },
            }}
            indicatorColor="primary"
          >
            {tabConfig.map((tab) => (
              <Tab
                key={tab.id}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        {/* --- ABA GERAL --- */}
        <CustomTabPanel value={value} index={getTabIndex("general")}>
          <Stack spacing={3}>
            
            {/* CARD 1: Dados Gerais */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
                  Dados Gerais
                </Typography>
                <Typography variant="body2" color="text.primary" mb={1}>
                  Dados cadastrais do seu estabelecimento.
                </Typography>
                <Divider sx={{ mb: 1 }} />
                
                <Grid container spacing={3} sx={{ bgcolor: "action.hover", p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        Nome do Petshop
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {tenant?.name}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        Telefone
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {maskPhone(tenant?.phone) || "Não informado"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.primary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        CPF / CNPJ
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {tenant?.document ? maskDocument(tenant.document) : "Não informado"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenTenantEdit(true)}
                  sx={{ alignSelf: "flex-start", mt: 1, px: 3 }}
                >
                  Editar Informações
                </Button>
              </Stack>
            </Paper>

            {/* CARD 2: Agendamento Online */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
                  Agendamento Online
                </Typography>
                <Typography variant="body2" color="text.primary" mb={1}>
                  Configure as políticas de concorrência e capacidade de agendamentos online.
                </Typography>
                <Divider sx={{ mb: 1 }} />

                <Stack spacing={2} sx={{ bgcolor: "action.hover", p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={limitEnabled}
                          disabled={savingLimit}
                          onChange={(e) => handleToggleLimit(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          Limitar agendamentos simultâneos
                        </Typography>
                      }
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 400 }}>
                      Ative para configurar a capacidade de agendamentos que a loja suporta atender no mesmo horário. Se desativado, o agendamento online ficará livre sem bloqueio de concorrência.
                    </Typography>
                  </Box>

                  {limitEnabled && (
                    <Stack spacing={1.5} sx={{ mt: 1, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                      <FormControl fullWidth>
                        <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 700, fontSize: "0.75rem" }}>
                          Limite de agendamentos por horário
                        </FormLabel>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <TextField
                            type="number"
                            size="small"
                            value={limitValue}
                            disabled={savingLimit}
                            onChange={(e) => setLimitValue(Math.max(1, parseInt(e.target.value) || 1))}
                            slotProps={{ htmlInput: { min: 1 } }}
                            sx={{ 
                              width: 80,
                              "& .MuiInputBase-input": { py: 0.5, fontWeight: 700, fontSize: "0.875rem" }
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleSaveLimitValue}
                            disabled={savingLimit}
                            sx={{ py: 0.5, px: 2 }}
                          >
                            {savingLimit ? <CircularProgress size={16} color="inherit" /> : "Salvar Limite"}
                          </Button>
                        </Box>
                      </FormControl>

                      <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500 }}>
                        Ex: se for {limitValue}, o horário será bloqueado para novos agendamentos online se já houver {limitValue} pets agendados nesse mesmo intervalo na loja inteira.
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* CARD 3: Políticas de Caixa */}
            {isOwner && (
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
                    Políticas de Caixa
                  </Typography>
                  <Typography variant="body2" color="text.primary" mb={1}>
                    Defina limites de descontos e permissões para operadores de caixa.
                  </Typography>
                  <Divider sx={{ mb: 1 }} />

                  <Stack spacing={2} sx={{ bgcolor: "action.hover", p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={discountEnabled}
                            disabled={savingDiscount}
                            onChange={(e) => handleToggleDiscount(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            Permitir descontos no Caixa
                          </Typography>
                        }
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 400 }}>
                        Ative para permitir que operadores de caixa dêem descontos em vendas. Você pode definir a porcentagem máxima permitida.
                      </Typography>
                    </Box>

                    {discountEnabled && (
                      <Stack spacing={1.5} sx={{ mt: 1, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                        <FormControl fullWidth>
                          <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 700, fontSize: "0.75rem" }}>
                            Desconto máximo permitido (%)
                          </FormLabel>
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <TextField
                              type="number"
                              size="small"
                              value={discountValue}
                              disabled={savingDiscount}
                              onChange={(e) => setDiscountValue(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 } }}
                              sx={{ 
                                width: 80,
                                "& .MuiInputBase-input": { py: 0.5, fontWeight: 700, fontSize: "0.875rem" }
                              }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleSaveDiscountValue}
                              disabled={savingDiscount}
                              sx={{ py: 0.5, px: 2 }}
                            >
                              {savingDiscount ? <CircularProgress size={16} color="inherit" /> : "Salvar Limite"}
                            </Button>
                          </Box>
                        </FormControl>

                        <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500 }}>
                          Operadores de caixa não poderão conceder descontos maiores que {discountValue}% do valor total da venda.
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* CARD 4: Horário de Funcionamento */}
            {isOwner && (
              <WorkingHoursSettings />
            )}

          </Stack>
        </CustomTabPanel>

        {/* --- ABA PLANOS E COBRANÇA (owner only) --- */}
        {isOwner && <CustomTabPanel value={value} index={getTabIndex("billing")}>
          <Stack spacing={4}>

            {/* ---- Cabeçalho ---- */}
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                {tenant?.subscription?.status === "active" ? "Planos disponíveis" : "Escolha um plano"}
              </Typography>
              <Typography variant="body2" color="text.primary">
                {tenant?.subscription?.status === "active" 
                  ? "Confira nossos planos. Em breve teremos novidades!" 
                  : "Escolha o plano ideal para o tamanho do seu pet shop."}
              </Typography>
            </Box>

            {/* ---- Estado: PIX pendente inline ---- */}
            {activePendingPixCharge && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "warning.light",
                  bgcolor: "rgba(255,193,7,0.04)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {tenant?.subscription?.plan?.name || "Plano Mensal"}
                    </Typography>
                    <Chip label="Aguardando pagamento" color="warning" size="small" sx={{ fontWeight: 700, mt: 0.5 }} />
                  </Box>
                  <Typography variant="caption" color="text.primary">
                    PIX gerado em {dayjs(activePendingPixCharge.created_at).format("DD/MM/YYYY [às] HH:mm")}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  {/* mini QR preview */}
                  <Box sx={{ p: 1, bgcolor: "white", borderRadius: 2, border: "1px solid", borderColor: "divider", display: "inline-flex" }}>
                    <Box sx={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* QRCodeSVG inline mini */}
                      <QrCode size={60} color="#1E2A6E" />
                    </Box>
                  </Box>
                  <Stack spacing={0.5} justifyContent="center">
                    <Typography variant="body2" fontWeight={700}>R$ 99,90/mês</Typography>
                    {activePendingPixCharge.expires_at && (
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.4, borderRadius: 2, bgcolor: "rgba(255,193,7,0.12)", border: "1px solid rgba(255,193,7,0.25)" }}>
                        <Typography variant="caption" fontWeight={700} color="warning.dark">
                          Expira em: {dayjs(activePendingPixCharge.expires_at).format("HH:mm")}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={() => setOpenCheckout(true)}
                    startIcon={<QrCode size={16} />}
                    sx={{ fontWeight: 700 }}
                  >
                    Continuar pagamento
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setOpenCancelModal(true)}
                    sx={{ fontWeight: 600 }}
                  >
                    Cancelar cobrança
                  </Button>
                </Stack>
              </Box>
            )}

            {/* ---- Estado: Assinatura Ativa ---- */}
            {!activePendingPixCharge && tenant?.subscription?.plan?.code === "MONTHLY" &&
              tenant?.subscription?.status === "active" &&
              tenant.subscription.current_period_end &&
              new Date(tenant.subscription.current_period_end) >= new Date() && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "success.light",
                  bgcolor: "rgba(76,175,80,0.04)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      {tenant.subscription.plan.name}
                    </Typography>
                    <Chip label="Ativo" color="success" size="small" sx={{ fontWeight: 700, mt: 0.5 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => setManageAnchorEl(e.currentTarget)}
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    Gerenciar assinatura
                  </Button>
                  <Menu
                    anchorEl={manageAnchorEl}
                    open={Boolean(manageAnchorEl)}
                    onClose={() => setManageAnchorEl(null)}
                  >
                    <MenuItem onClick={() => { 
                      setManageAnchorEl(null); 
                      if (tenant.subscription?.payment_method === "pix") {
                        confirmPaymentMethodChange("card");
                      } else {
                        setOpenUpdateCard(true); 
                      }
                    }}>
                      {tenant.subscription.payment_method === "pix" ? "Mudar para Cartão de Crédito" : "Alterar cartão de crédito"}
                    </MenuItem>
                    {tenant.subscription.payment_method !== "pix" && (
                      <MenuItem onClick={() => { setManageAnchorEl(null); setOpenPixConfirmation(true); }}>
                        Mudar para PIX
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => { setManageAnchorEl(null); setOpenCancelModal(true); }}>
                      Cancelar assinatura
                    </MenuItem>
                  </Menu>
                </Box>
                <Stack spacing={0.5} sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    Próxima renovação: <strong>{dayjs(tenant.subscription.current_period_end).format("DD/MM/YYYY")}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Forma de pagamento: <strong>
                      {tenant.subscription.payment_method === "pix" 
                        ? "PIX" 
                        : (() => {
                            const defaultCard = savedCards.find((c) => c.is_default);
                            return defaultCard 
                              ? `Cartão de Crédito (${defaultCard.brand.toUpperCase()} •••• ${defaultCard.last4})` 
                              : "Cartão de Crédito";
                          })()}
                    </strong>
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* ---- Período de trial ---- */}
            {isTrialing && !activePendingPixCharge && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "rgba(111,66,193,0.03)",
                  border: "1px solid rgba(111,66,193,0.12)",
                }}
              >
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={700} color={trialDays === 0 ? "error" : "inherit"}>
                      {trialDays === 0
                        ? dayjs(tenant?.subscription?.trial_ends_at).isBefore(dayjs())
                          ? "Seu período de teste expirou"
                          : `Seu teste grátis acaba hoje às ${dayjs(tenant?.subscription?.trial_ends_at).format("HH:mm")}`
                        : `Faltam ${trialDays} ${trialDays === 1 ? "dia" : "dias"} para o fim do teste`}
                    </Typography>
                    {trialDays > 0 && (
                      <Typography variant="caption" color="text.primary">
                        {dayjs(tenant?.subscription?.trial_ends_at).format("DD/MM/YYYY")}
                      </Typography>
                    )}
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(trialDays / 14) * 100}
                    sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.05)" }}
                  />
                  <Typography variant="caption" color="text.primary">
                    Ao final desse período, você precisará escolher um plano para continuar usando o PetControle.
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* ---- Aguardando confirmação polling ---- */}
            {awaitingConfirmation && (
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(111,66,193,0.04)", border: "1px solid rgba(111,66,193,0.15)", display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={20} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Aguardando confirmação do pagamento</Typography>
                  <Typography variant="caption" color="text.primary">Isso pode levar alguns segundos...</Typography>
                </Box>
              </Box>
            )}

            {/* ---- Plan cards ---- */}
            {!activePendingPixCharge && !awaitingConfirmation && (
              <Grid container spacing={2} alignItems="stretch">
                {/* Plano Mensal — único funcional */}
                {([
                  {
                    id: "MONTHLY",
                    name: "Plano Mensal",
                    price: "R$ 99,90",
                    description: "Ideal para pet shops que estão começando.",
                    features: ["Clientes e pets ilimitados", "Agenda inteligente", "Relatórios financeiros", "Suporte via chat"],
                    highlight: false,
                    disabled: false,
                  },
                  {
                    id: "PROFESSIONAL",
                    name: "Plano Profissional",
                    price: "R$ 159,90",
                    description: "Recursos avançados para pet shops em crescimento.",
                    features: ["Tudo do Plano Mensal", "WhatsApp automático", "Backup diário", "Suporte prioritário"],
                    highlight: true,
                    disabled: true,
                  },
                  {
                    id: "PREMIUM",
                    name: "Plano Premium",
                    price: "R$ 239,90",
                    description: "Para pet shops que querem o máximo.",
                    features: ["Tudo do Plano Profissional", "Multiunidades", "Relatórios avançados", "Onboarding personalizado"],
                    highlight: false,
                    disabled: true,
                  },
                ] as const).map((plan) => (
                  <Grid key={plan.id} size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        height: "100%",
                        border: "1.5px solid",
                        borderColor: plan.highlight ? "primary.main" : "divider",
                        borderRadius: 3,
                        p: 3,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        transition: "box-shadow 0.2s",
                        boxShadow: plan.highlight ? "0 0 0 3px rgba(49,52,133,0.08)" : "none",
                        opacity: plan.disabled ? 0.7 : 1,
                      }}
                    >
                      {plan.highlight && (
                        <Chip
                          label="Mais escolhido"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: -12,
                            left: "50%",
                            transform: "translateX(-50%)",
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                      {plan.disabled && (
                        <Chip
                          label="Em breve"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            bgcolor: "rgba(0,0,0,0.06)",
                            fontWeight: 700,
                            fontSize: "0.68rem",
                          }}
                        />
                      )}

                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {plan.name}
                        </Typography>
                        <Typography variant="caption" color="text.primary">
                          {plan.description}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="h5" fontWeight={900} color="primary.main">
                          {plan.price}
                          <Typography component="span" variant="body2" color="text.primary" fontWeight={400}> /mês</Typography>
                        </Typography>
                      </Box>

                      <Stack spacing={0.75} sx={{ flex: 1 }}>
                        {plan.features.map((f, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <CheckCircle2 size={15} color="#4caf50" />
                            <Typography variant="caption" color="text.primary">{f}</Typography>
                          </Box>
                        ))}
                      </Stack>

                      <Button
                        variant={plan.highlight ? "contained" : "outlined"}
                        fullWidth
                        disabled={plan.disabled || (plan.id === "MONTHLY" && tenant?.subscription?.status === "active")}
                        onClick={() => {
                          setCheckoutStartAt(null);
                          setOpenCheckout(true);
                        }}
                        sx={{ fontWeight: 700, borderRadius: 2, mt: "auto" }}
                      >
                        {plan.id === "MONTHLY" && tenant?.subscription?.status === "active" ? "Plano atual" : "Escolher plano"}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* ---- Security note ---- */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <Lock size={14} color="#9CA3AF" />
              <Typography variant="caption" color="text.disabled">
                Ambiente seguro. Seus dados estão protegidos.
              </Typography>
            </Box>

          </Stack>

          {/* ---- Histórico de Faturas ---- */}
          <Paper sx={{ mt: 4, p: 4, borderRadius: 4 }}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={800}>Histórico de Faturas</Typography>
              <Divider />
              {loadingCharges ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
              ) : charges.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.primary">Nenhuma fatura encontrada.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {charges.map((charge) => (
                    <Box
                      key={charge.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: charge.status === "pending" ? "warning.light" : "divider",
                        bgcolor: charge.status === "pending" ? "rgba(255,193,7,0.03)" : "rgba(0,0,0,0.01)",
                        flexWrap: "wrap",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      <Grid container spacing={2} alignItems="center" sx={{ flex: 1, minWidth: "280px" }}>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">Data</Typography>
                          <Typography variant="body2" fontWeight={600} mt={0.5}>{dayjs(charge.created_at).format("DD/MM/YYYY")}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">Método de Pagamento</Typography>
                          <Typography variant="body2" sx={{ textTransform: "uppercase", fontWeight: 600 }} mt={0.5}>
                            {charge.payment_method === "card"
                              ? `Cartão de Crédito ${charge.card_brand ? `(${charge.card_brand.toUpperCase()} •••• ${charge.card_last_four})` : ""}`
                              : "PIX"}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">Valor</Typography>
                          <Typography variant="body2" fontWeight={800} color="primary.main" mt={0.5}>
                            {(charge.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>Status</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getChargeStatusChip(charge.status)}
                            {charge.payment_method === "pix" && charge.status === "pending" && charge.pix_qr_code && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setPixData({
                                    pagarme_subscription_id: "",
                                    status: "pending",
                                    pix_qr_code: charge.pix_qr_code || "",
                                    pix_qr_code_url: charge.pix_qr_code_url || "",
                                    expires_at: charge.expires_at || "",
                                  });
                                  setPaymentMethod("pix");
                                  setOpenCheckout(true);
                                }}
                              >
                                Pagar
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Encerrar conta */}
          <Paper sx={{ mt: 3, p: 2.5, borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Encerrar conta</Typography>
                <Typography variant="caption" color="text.primary">Remove permanentemente todos os seus dados.</Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => { setDeleteAccountPassword(""); setDeleteAccountStep(1); setOpenDeleteAccount(true); }}
                sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
              >
                Encerrar Conta
              </Button>
            </Box>
          </Paper>



        </CustomTabPanel>}

        {/* --- ABA PERFIL --- */}
        <CustomTabPanel value={value} index={getTabIndex("profile")}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={40} color="white" />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {user?.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: "rgba(0,0,0,0.05)",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      mt: 1,
                      display: "inline-block",
                      fontWeight: 700,
                    }}
                  >
                    {user?.role === "owner" ? "PROPRIETÁRIO" : "FUNCIONÁRIO"}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Button
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
                onClick={() => setOpenChangePassword(true)}
              >
                Alterar Senha
              </Button>
            </Stack>
          </Paper>
        </CustomTabPanel>

        {/* --- ABA USUÁRIOS (owner only) --- */}
        {isOwner && (
          <CustomTabPanel value={value} index={getTabIndex("users")}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Usuários do Sistema
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Gerencie quem tem acesso ao PetControle.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => setOpenCreateUser(true)}
                >
                  Novo Usuário
                </Button>
              </Box>

              {loadingUsers ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                  {tenantUsers.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.primary">
                        Nenhum usuário cadastrado ainda.
                      </Typography>
                    </Box>
                  ) : (
                    tenantUsers.map((u, i) => (
                      <React.Fragment key={u.id}>
                        <Box
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 2 }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor:
                                  u.role === "owner"
                                    ? "primary.main"
                                    : "secondary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <User size={20} color="white" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" color="text.primary">
                                {u.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip
                              label={
                                u.role === "owner" ? "Proprietário" : "Funcionário"
                              }
                              color={u.role === "owner" ? "primary" : "default"}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                            {u.id !== Number(user?.id) && (
                              <IconButton
                                size="small"
                                onClick={() => setUserToDelete(u)}
                                sx={{ color: "error.main" }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                        {i < tenantUsers.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  )}
                </Paper>
              )}
            </Stack>
          </CustomTabPanel>
        )}

        {/* --- ABA BACKUP (owner only) --- */}
        {isOwner && (
          <CustomTabPanel value={value} index={getTabIndex("backup")}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Exportar Dados
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Você é dono dos seus dados. Aqui você tem a facilidade de exportar e baixar os registros completos da sua empresa a qualquer momento.
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <Users size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Clientes e Pets</Typography>
                        <Typography variant="caption" color="text.primary">Cadastros completos</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="outlined" 
                      startIcon={!loadingExportClients && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportClients}
                      onClick={async () => {
                        setLoadingExportClients(true);
                        try {
                          const blob = await exportClients();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_clientes_pets.xlsx";
                          a.click();
                          window.URL.revokeObjectURL(url);
                          toast.success("Download iniciado!");
                        } catch (e) {
                          toast.error("Erro ao exportar clientes e pets.");
                        } finally {
                          setLoadingExportClients(false);
                        }
                      }}
                    >
                      {loadingExportClients ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <Lock size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Produtos</Typography>
                        <Typography variant="caption" color="text.primary">Inventário e valores</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="outlined" 
                      startIcon={!loadingExportProducts && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportProducts}
                      onClick={async () => {
                        setLoadingExportProducts(true);
                        try {
                          const blob = await exportProducts();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_produtos.xlsx";
                          a.click();
                          window.URL.revokeObjectURL(url);
                          toast.success("Download iniciado!");
                        } catch (e) {
                          toast.error("Erro ao exportar produtos.");
                        } finally {
                          setLoadingExportProducts(false);
                        }
                      }}
                    >
                      {loadingExportProducts ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <Settings size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Serviços</Typography>
                        <Typography variant="caption" color="text.primary">Tabela de preços</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="outlined" 
                      startIcon={!loadingExportServices && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportServices}
                      onClick={async () => {
                        setLoadingExportServices(true);
                        try {
                          const blob = await exportServices();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_servicos.xlsx";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } catch (error) {
                          console.error(error);
                          toast.error("Erro ao exportar serviços.");
                        } finally {
                          setLoadingExportServices(false);
                        }
                      }}
                    >
                      {loadingExportServices ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>

                {/* PACOTES */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <PackageIcon size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Pacotes</Typography>
                        <Typography variant="caption" color="text.primary">Planos e combos</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      variant="outlined"
                      startIcon={!loadingExportPackages && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportPackages}
                      onClick={async () => {
                        setLoadingExportPackages(true);
                        try {
                          const blob = await exportPackages();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_pacotes.xlsx";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } catch (error) {
                          console.error(error);
                          toast.error("Erro ao exportar pacotes.");
                        } finally {
                          setLoadingExportPackages(false);
                        }
                      }}
                    >
                      {loadingExportPackages ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>

                {/* FORNECEDORES */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <Truck size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Fornecedores</Typography>
                        <Typography variant="caption" color="text.primary">Contatos de compra</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      variant="outlined"
                      startIcon={!loadingExportSuppliers && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportSuppliers}
                      onClick={async () => {
                        setLoadingExportSuppliers(true);
                        try {
                          const blob = await exportSuppliers();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_fornecedores.xlsx";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } catch (error) {
                          console.error(error);
                          toast.error("Erro ao exportar fornecedores.");
                        } finally {
                          setLoadingExportSuppliers(false);
                        }
                      }}
                    >
                      {loadingExportSuppliers ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>

                {/* FUNCIONÁRIOS */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box sx={{ p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                        <Users size={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Funcionários</Typography>
                        <Typography variant="caption" color="text.primary">Equipe / Prestadores</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                      variant="outlined"
                      startIcon={!loadingExportUsers && <Download size={18} />}
                      fullWidth
                      disabled={loadingExportUsers}
                      onClick={async () => {
                        setLoadingExportUsers(true);
                        try {
                          const blob = await exportEmployees();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "backup_funcionarios.xlsx";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } catch (error) {
                          console.error(error);
                          toast.error("Erro ao exportar funcionários.");
                        } finally {
                          setLoadingExportUsers(false);
                        }
                      }}
                    >
                      {loadingExportUsers ? <CircularProgress size={20} color="inherit" /> : "Exportar Excel"}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </CustomTabPanel>
        )}
      </Stack>

      {/* --- DIALOG CRIAR USUÁRIO --- */}
      <Dialog
        open={openCreateUser}
        onClose={() => !creatingUser && setOpenCreateUser(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
        >
          <Typography variant="h5">Novo Usuário</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X
              onClick={() => !creatingUser && setOpenCreateUser(false)}
              size={24}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmitCreateUser(onCreateUser)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Nome
                </FormLabel>
                <Controller
                  name="name"
                  control={controlCreateUser}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      error={!!createUserErrors.name}
                      helperText={createUserErrors.name?.message}
                      placeholder="Nome completo"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  E-mail
                </FormLabel>
                <Controller
                  name="email"
                  control={controlCreateUser}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      error={!!createUserErrors.email}
                      helperText={createUserErrors.email?.message}
                      placeholder="email@exemplo.com"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Senha
                </FormLabel>
                <Controller
                  name="password"
                  control={controlCreateUser}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type="password"
                      error={!!createUserErrors.password}
                      helperText={createUserErrors.password?.message}
                      placeholder="Mínimo 6 caracteres"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Função
                </FormLabel>
                <Controller
                  name="role"
                  control={controlCreateUser}
                  render={({ field }) => (
                    <Select {...field} size="small">
                      <MenuItem value="employee">Funcionário</MenuItem>
                      <MenuItem value="owner">Proprietário</MenuItem>
                    </Select>
                  )}
                />
                <Stack direction="row" alignItems="flex-start" spacing={0.75} sx={{ mt: 0.75 }}>
                  <Info size={14} style={{ marginTop: 1, flexShrink: 0, color: "inherit" }} />
                  <Typography variant="caption" color="text.primary" sx={{ opacity: 0.7, lineHeight: 1.5 }}>
                    <strong>Funcionário</strong> tem acesso limitado às operações do dia a dia como: caixa, clientes, pets e estoque.{" "}
                    <strong>Proprietário</strong> tem acesso administrativo completo, incluindo financeiro, relatórios, comissões e configurações do sistema.
                  </Typography>
                </Stack>
              </FormControl>

              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}
              >
                <Button
                  variant="text"
                  onClick={() => setOpenCreateUser(false)}
                  disabled={creatingUser}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={creatingUser}
                >
                  {creatingUser ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Criar Usuário"
                  )}
                </Button>
              </Box>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG CONFIRMAR EXCLUSÃO --- */}
      <Dialog
        open={!!userToDelete}
        onClose={() => !deletingUser && setUserToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remover Usuário</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover{" "}
            <strong>{userToDelete?.name}</strong> do sistema? O acesso será
            revogado imediatamente.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button
              variant="text"
              onClick={() => setUserToDelete(null)}
              disabled={deletingUser}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onDeleteUser}
              disabled={deletingUser}
            >
              {deletingUser ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Remover"
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG ALTERAR SENHA --- */}
      <Dialog
        open={openChangePassword}
        onClose={() => !changingPassword && setOpenChangePassword(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
        >
          <Typography variant="h5">Alterar Senha</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X
              onClick={() => !changingPassword && setOpenChangePassword(false)}
              size={24}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmitPassword(onChangePassword)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Senha Atual
                </FormLabel>
                <Controller
                  name="current_password"
                  control={controlPassword}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type="password"
                      error={!!passwordErrors.current_password}
                      helperText={passwordErrors.current_password?.message}
                      placeholder="Sua senha atual"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Nova Senha
                </FormLabel>
                <Controller
                  name="new_password"
                  control={controlPassword}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type="password"
                      error={!!passwordErrors.new_password}
                      helperText={passwordErrors.new_password?.message}
                      placeholder="Mínimo 6 caracteres"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Confirmar Nova Senha
                </FormLabel>
                <Controller
                  name="confirm_password"
                  control={controlPassword}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      type="password"
                      error={!!passwordErrors.confirm_password}
                      helperText={passwordErrors.confirm_password?.message}
                      placeholder="Repita a nova senha"
                    />
                  )}
                />
              </FormControl>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setOpenChangePassword(false);
                    resetPasswordForm();
                  }}
                  disabled={changingPassword}
                >
                  Cancelar
                </Button>
                <Button variant="contained" type="submit" disabled={changingPassword}>
                  {changingPassword ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </Box>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- CHECKOUT STEPPER (novo modal) --- */}
      <CheckoutStepper
        open={openCheckout}
        onClose={() => {
          setOpenCheckout(false);
          setPixData(null);
          // Refresh charges when closed
          fetchCharges();
          checkAuth();
        }}
        onSuccess={() => {
          setAwaitingConfirmation(true);
          setPollCount(0);
          checkAuth();
          fetchCharges();
          fetchCards();
        }}
        planId="MONTHLY"
        tenantDocument={tenant?.document}
        existingPixData={pixData ? {
          pix_qr_code: pixData.pix_qr_code,
          pix_qr_code_url: pixData.pix_qr_code_url,
          expires_at: pixData.expires_at,
        } : activePendingPixCharge ? {
          pix_qr_code: activePendingPixCharge.pix_qr_code!,
          pix_qr_code_url: activePendingPixCharge.pix_qr_code_url,
          expires_at: activePendingPixCharge.expires_at,
        } : null}
        startAt={checkoutStartAt}
      />
      {/* --- MODAL DE EDIÇÃO DO TENANT --- */}
      <Dialog
        open={openTenantEdit}
        onClose={() => !savingTenant && setOpenTenantEdit(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
        >
          <Typography variant="h5">Editar Empresa</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X
              onClick={() => !savingTenant && setOpenTenantEdit(false)}
              size={24}
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <form onSubmit={handleSubmit(onSaveTenant)}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Nome do Petshop
                </FormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="Nome da sua empresa"
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Telefone de Contato
                </FormLabel>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={maskPhone(field.value)}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      placeholder="(00) 00000-0000"
                      onChange={(e) =>
                        field.onChange(maskPhone(e.target.value))
                      }
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  CPF ou CNPJ (Opcional)
                </FormLabel>
                <Controller
                  name="document"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value || ""}
                      error={!!errors.document}
                      helperText={errors.document?.message}
                      placeholder="000.000.000-00"
                      onChange={(e) =>
                        field.onChange(maskDocument(e.target.value))
                      }
                    />
                  )}
                />
              </FormControl>


              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 1,
                }}
              >
                <Button
                  variant="text"
                  onClick={() => setOpenTenantEdit(false)}
                  disabled={savingTenant}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={savingTenant}
                >
                  {savingTenant ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </Box>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
      {/* --- DIALOG CONFIRMAR TROCA DE MÉTODO DE PAGAMENTO --- */}
      <Dialog
        open={pendingPaymentMethod !== null}
        onClose={() => setPendingPaymentMethod(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Trocar método de pagamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
            {pendingPaymentMethod === "pix"
              ? "Você está trocando para PIX. A partir do próximo vencimento, você receberá um QR Code para pagar sua mensalidade manualmente."
              : (() => {
                  const periodEnd = tenant?.subscription?.current_period_end;
                  const formatted = periodEnd ? new Intl.DateTimeFormat("pt-BR").format(new Date(periodEnd)) : null;
                  return formatted
                    ? `Sua assinatura via PIX está paga até ${formatted}. No próximo passo, adicione um cartão, a cobrança automática começará nessa data, sem cobrar em duplicidade.`
                    : "Você está trocando para Cartão de Crédito. A próxima cobrança será debitada automaticamente no cartão cadastrado.";
                })()}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button variant="text" onClick={() => setPendingPaymentMethod(null)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={() => pendingPaymentMethod && confirmPaymentMethodChange(pendingPaymentMethod)}
            >
              {pendingPaymentMethod === "card" && tenant?.subscription?.payment_method === "pix"
                ? "Continuar e adicionar cartão"
                : `Sim, trocar para ${pendingPaymentMethod === "pix" ? "PIX" : "Cartão"}`}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      {/* --- DIALOG CANCELAR ASSINATURA --- */}
      <Dialog
        open={openCancelModal}
        onClose={() => !cancelingSubscription && setOpenCancelModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancelar Assinatura</DialogTitle>
        <DialogContent>
          <Typography>
            {tenant?.subscription?.eligible_for_refund 
              ? "Tem certeza que deseja cancelar sua assinatura? Como está dentro do prazo de 7 dias do primeiro pagamento, o valor será integralmente estornado."
              : "Tem certeza que deseja cancelar sua assinatura? Você perderá imediatamente o acesso a novos agendamentos e o sistema entrará em modo leitura."
            }
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button
              variant="text"
              onClick={() => setOpenCancelModal(false)}
              disabled={cancelingSubscription}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription}
            >
              {cancelingSubscription ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Sim, cancelar"
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG ENCERRAR CONTA --- */}
      <Dialog
        open={openDeleteAccount}
        onClose={() => !deletingAccount && setOpenDeleteAccount(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AlertTriangle size={20} color="#d32f2f" />
          <Typography variant="h6" fontWeight={700} component="span">
            {deleteAccountStep === 1 ? "Encerrar Conta" : "Confirmar encerramento"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {deleteAccountStep === 1 ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.primary">
                Ao encerrar sua conta, as seguintes ações serão realizadas de forma <strong>permanente e irreversível</strong>:
              </Typography>
              <Stack spacing={1} sx={{ pl: 1 }}>
                {[
                  "Todos os clientes, pets e histórico de atendimentos serão deletados",
                  "Agendamentos, vendas e registros financeiros serão removidos",
                  tenant?.subscription?.eligible_for_refund 
                    ? "Sua assinatura será cancelada e o valor pago estornado"
                    : "Sua assinatura será cancelada imediatamente (sem estorno)",
                  "Não será possível recuperar os dados após a exclusão",
                ].map((item, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <Typography variant="body2" color="error" sx={{ mt: 0.1 }}>•</Typography>
                    <Typography variant="body2" color="text.primary">{item}</Typography>
                  </Box>
                ))}
              </Stack>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
                <Button variant="text" onClick={() => setOpenDeleteAccount(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setDeleteAccountStep(2)}
                >
                  Entendo, continuar
                </Button>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.primary">
                Esta ação é <strong>irreversível</strong>. Digite sua senha para confirmar o encerramento da conta.
              </Typography>
              <TextField
                type="password"
                size="small"
                fullWidth
                autoFocus
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                disabled={deletingAccount}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deleteAccountPassword) handleDeleteAccount();
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
                <Button
                  variant="text"
                  onClick={() => setDeleteAccountStep(1)}
                  disabled={deletingAccount}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deleteAccountPassword}
                  startIcon={!deletingAccount ? <Trash2 size={16} /> : undefined}
                >
                  {deletingAccount ? <CircularProgress size={20} color="inherit" /> : "Encerrar minha conta"}
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DIALOG ALTERAR CARTÃO DE COBRANÇA FALHA --- */}
      <Dialog
        open={openUpdateCardDialog}
        onClose={() => !updateCardLoading && setOpenUpdateCardDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
          <Typography variant="h5">Pagar com outro cartão</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X onClick={() => !updateCardLoading && setOpenUpdateCardDialog(false)} size={24} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {updateCardLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <CheckoutForm
              buttonLabel="Pagar Fatura"
              defaultDocument={tenant?.document}
              onSuccess={async (cardToken, document, billingAddress) => {
                if (!chargeToUpdateCard) return;
                setUpdateCardLoading(true);
                try {
                  const res = await updateChargeCard(chargeToUpdateCard.id, cardToken, billingAddress, document);
                  if (res.status === "paid" || res.status === "captured") {
                    toast.success("Pagamento realizado com sucesso!");
                    await checkAuth();
                  } else {
                    toast.warning(`Nova tentativa falhou. Status da fatura: ${res.status}`);
                  }
                  setOpenUpdateCardDialog(false);
                  await fetchCharges();
                } catch (err) {
                  toast.error("Erro ao atualizar cartão e cobrar. Verifique os dados.");
                } finally {
                  setUpdateCardLoading(false);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* --- DIALOG DE UPDATE CARD --- */}
      <UpdateCardModal
        open={openUpdateCard}
        onClose={() => setOpenUpdateCard(false)}
        onSuccess={() => {
          checkAuth(); // Recarrega os dados da assinatura
          fetchCards(); // Recarrega a lista de cartões para atualizar o final do cartão na interface
        }}
        tenantDocument={tenant?.document}
      />

      {/* --- DIALOG MUDAR PARA PIX --- */}
      <Dialog open={openPixConfirmation} onClose={() => !loadingChangeToPix && setOpenPixConfirmation(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
          <Typography variant="h6">Mudar para PIX</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X onClick={() => !loadingChangeToPix && setOpenPixConfirmation(false)} size={24} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Tem certeza que deseja mudar o pagamento da sua assinatura para <strong>PIX</strong>? 
          </Typography>
          <Typography variant="body2" color="text.primary" mb={3}>
            A partir da próxima renovação ({dayjs(tenant?.subscription?.current_period_end).format("DD/MM/YYYY")}), 
            você não será mais cobrado no cartão e enviaremos o código PIX na tela para pagamento.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="text"
              onClick={() => setOpenPixConfirmation(false)}
              disabled={loadingChangeToPix}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleChangeToPix}
              disabled={loadingChangeToPix}
            >
              {loadingChangeToPix ? <CircularProgress size={24} color="inherit" /> : "Sim, Mudar para PIX"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
