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
  Modal,
  Backdrop,
  Fade,
  CircularProgress,
  IconButton,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Settings,
  CreditCard,
  User,
  CheckCircle2,
  TrendingUp,
  X,
  Lock,
  QrCode,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";
import Skeleton from "@mui/material/Skeleton";
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
  addPaymentMethod,
  createCheckout,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  cancelSubscription,
  listCharges,
  updateChargeCard,
} from "../api/services/subscriptions";
import CheckoutForm from "../features/billing/CheckoutForm";
import PaymentMethodCard from "../features/billing/PaymentMethodCard";
import PixQrCode from "../features/billing/PixQrCode";
import type { PaymentMethod, CheckoutPixResponse, SubscriptionCharge } from "../features/billing/types";
import { Button } from "../components/Button/Button";
import WorkingHoursSettings from "../features/tenants/WorkingHoursSettings";

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
  const [checkoutMode, setCheckoutMode] = useState<"payment" | "setup">("payment");
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [useNewCard, setUseNewCard] = useState<boolean>(false);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
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
  const [chargeToUpdateCard, _setChargeToUpdateCard] = useState<SubscriptionCharge | null>(null);
  const [openUpdateCardDialog, setOpenUpdateCardDialog] = useState(false);
  const [updateCardLoading, setUpdateCardLoading] = useState(false);
  const [selectedPixCharge, _setSelectedPixCharge] = useState<SubscriptionCharge | null>(null);
  const [openPixModal, setOpenPixModal] = useState(false);

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

  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<"card" | "pix" | null>(null);
  const [checkoutStartAt, setCheckoutStartAt] = useState<string | null>(null);

  const handlePaymentMethodChange = (method: "card" | "pix") => {
    if (!tenant?.id || method === paymentMethod) return;
    if (tenant?.subscription?.status === "active") {
      setPendingPaymentMethod(method);
    } else {
      confirmPaymentMethodChange(method);
    }
  };

  const confirmPaymentMethodChange = async (method: "card" | "pix") => {
    if (!tenant?.id) return;
    setPendingPaymentMethod(null);

    // PIX → Cartão com assinatura ativa: precisa criar subscription no Pagarme
    // com start_at = current_period_end para não sobrepor o período já pago
    if (method === "card" && tenant?.subscription?.payment_method === "pix" && tenant?.subscription?.status === "active") {
      const startAt = tenant.subscription.current_period_end;
      setCheckoutStartAt(startAt);
      setCheckoutMode("payment");
      setCheckoutError(null);
      setPixData(null);
      setOpenCheckout(true);
      return;
    }

    setPaymentMethod(method);
    setSavingPaymentMethod(true);
    try {
      await updateSubscription(tenant.id, method);
      await checkAuth();
    } catch {
      setPaymentMethod(paymentMethod); // revert on error
    } finally {
      setSavingPaymentMethod(false);
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
    setLoadingCards(true);
    try {
      const methods = await listPaymentMethods();
      setSavedCards(methods);
    } finally {
      setLoadingCards(false);
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

  

  const handleSetDefault = async (pmId: string) => {
    await setDefaultPaymentMethod(pmId);
    setSavedCards((prev) =>
      prev.map((c) => ({ ...c, is_default: c.id === pmId }))
    );
    toast.success("Cartão padrão atualizado!");
  };

  const handleRemoveCard = async (pmId: string) => {
    await removePaymentMethod(pmId);
    setSavedCards((prev) => prev.filter((c) => c.id !== pmId));
    toast.success("Cartão removido.");
  };

  // Limpa os dados sensíveis imediatamente ao trocar de tenant,
  // evitando que cartões/cobranças de um tenant apareçam em outro.
  useEffect(() => {
    setSavedCards([]);
    setCharges([]);
    setSelectedCardId("");
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
  const isTrialing = tenant?.subscription?.plan?.code === "FREE_TRIAL" || tenant?.subscription?.status === "trialing";
  const showPaymentMethodSection = !!tenant?.subscription && tenant.subscription.plan?.code !== "FREE_TRIAL" && tenant.subscription.status !== "trialing";

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

  const handleOpenCheckout = () => {
    setCheckoutMode("payment");
    setCheckoutError(null);
    setPixData(null);
    setOpenCheckout(true);

    if (paymentMethod === "pix" && tenant?.document) {
      const doc = maskDocument(tenant.document);
      setPixDocument(doc);
      handleGeneratePix(doc);
    } else {
      setPixDocument(tenant?.document ? maskDocument(tenant.document) : "");
      if (savedCards.length > 0) {
        const defaultCard = savedCards.find((c) => c.is_default) || savedCards[0];
        setSelectedCardId(defaultCard.id);
        setUseNewCard(false);
      } else {
        setSelectedCardId("");
        setUseNewCard(true);
      }
    }
  };

  const handleGeneratePix = async (docOverride?: string) => {
    const doc = docOverride ?? pixDocument;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const data = await createCheckout("MONTHLY", "pix", undefined, doc);
      if ("pix_qr_code" in data) {
        setPixData(data as CheckoutPixResponse);
        await checkAuth();
        setAwaitingConfirmation(true);
        setPollCount(0);
      }
    } catch {
      setCheckoutError("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutWithSavedCard = async () => {
    if (!selectedCardId) {
      toast.error("Por favor, selecione um cartão.");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      await createCheckout(
        "MONTHLY",
        "credit_card",
        undefined,
        undefined,
        undefined,
        checkoutStartAt ?? undefined,
        selectedCardId
      );
      setCheckoutStartAt(null);
      toast.success("Pagamento enviado! Aguardando confirmação...");
      await checkAuth();
      setAwaitingConfirmation(true);
      setPollCount(0);
      setOpenCheckout(false);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro ao processar o pagamento com o cartão salvo.";
      setCheckoutError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenSetupCard = () => {
    setCheckoutMode("setup");
    setCheckoutError(null);
    setOpenCheckout(true);
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
      await cancelSubscription();
      toast.success("Assinatura cancelada com sucesso.");
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
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 150,
                      height: 150,
                      background:
                        "radial-gradient(circle, rgba(111,66,193,0.05) 0%, rgba(255,255,255,0) 70%)",
                      borderRadius: "50%",
                    }}
                  />
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Plano Atual
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={800}
                          sx={{ mt: 0.5 }}
                        >
                          {tenant?.subscription?.plan?.name || "Sem Assinatura"}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          isTrialing ? "PERÍODO DE TESTE" :
                          tenant?.subscription?.status === "active"
                            ? (tenant.subscription.current_period_end && new Date(tenant.subscription.current_period_end) < new Date() ? "EXPIRADO" : "ATIVO")
                            :
                          tenant?.subscription?.status === "incomplete" ? "PAGAMENTO PENDENTE" :
                          tenant?.subscription?.status === "pending" ? "AGUARDANDO PAGAMENTO" :
                          tenant?.subscription?.status === "past_due" ? "PAGAMENTO ATRASADO" :
                          tenant?.subscription?.status === "canceled" ? "CANCELADO" :
                          tenant?.subscription?.status === "failed" ? "FALHA NO PAGAMENTO" :
                          "PENDENTE"
                        }
                        color={
                          tenant?.subscription?.status === "active" ? "success" :
                          isTrialing ? "secondary" :
                          "error"
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    {isTrialing && (
                      <Box
                        sx={{
                          bgcolor: "rgba(111,66,193,0.03)",
                          p: 3,
                          borderRadius: 3,
                          border: "1px solid rgba(111,66,193,0.1)",
                        }}
                      >
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body2" fontWeight={700} color={trialDays === 0 ? "error" : "inherit"}>
                              {trialDays === 0
                                ? dayjs(tenant?.subscription?.trial_ends_at).isBefore(dayjs())
                                  ? "Seu período de teste expirou"
                                  : `Seu teste grátis acaba hoje às ${dayjs(tenant?.subscription?.trial_ends_at).format("HH:mm")}`
                                : `Faltam ${trialDays} ${trialDays === 1 ? "dia" : "dias"} para o fim do teste`}
                            </Typography>
                            {trialDays > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {dayjs(tenant?.subscription?.trial_ends_at).format(
                                  "DD/MM/YYYY",
                                )}
                              </Typography>
                            )}
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(trialDays / 14) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: "rgba(0,0,0,0.05)",
                            }}
                          />
                          <Typography variant="caption" color="text.primary">
                            Ao final desse período, você precisará escolher um
                            plano para continuar usando o PetControle.
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    <Divider />

                    {awaitingConfirmation && (
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: "rgba(111,66,193,0.04)",
                          border: "1px solid rgba(111,66,193,0.15)",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={20} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Aguardando confirmação do pagamento
                          </Typography>
                          <Typography variant="caption" color="text.primary">
                            Isso pode levar alguns segundos...
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {!awaitingConfirmation && (tenant?.subscription?.plan?.code === "FREE_TRIAL" ||
                      tenant?.subscription?.status === "incomplete" ||
                      tenant?.subscription?.status === "pending" ||
                      tenant?.subscription?.status === "failed" ||
                      tenant?.subscription?.status === "past_due" ||
                      tenant?.subscription?.status === "canceled" ||
                      (tenant?.subscription?.status === "active" &&
                        !!tenant.subscription.current_period_end &&
                        new Date(tenant.subscription.current_period_end) < new Date())) && (
                      <Box>
                        <Typography variant="h6" fontWeight={800} gutterBottom>
                          {tenant?.subscription?.status === "incomplete" || tenant?.subscription?.status === "pending"
                            ? "Complete o pagamento"
                            : tenant?.subscription?.status === "past_due" || tenant?.subscription?.status === "failed"
                            ? "Regularize seu pagamento"
                            : tenant?.subscription?.status === "canceled"
                            ? "Reative sua assinatura"
                            : tenant?.subscription?.status === "active"
                            ? "Renove sua assinatura"
                            : "Faça o Upgrade agora"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mb: 3 }}
                        >
                          {tenant?.subscription?.status === "incomplete" || tenant?.subscription?.status === "pending"
                            ? "Seu cadastro foi criado. Insira os dados do cartão para ativar."
                            : tenant?.subscription?.status === "past_due" || tenant?.subscription?.status === "failed"
                            ? "Houve uma falha no pagamento. Tente novamente com outro cartão."
                            : tenant?.subscription?.status === "active"
                            ? "Seu período atual expirou. Renove para continuar usando o PetControle."
                            : "Desbloqueie todos os recursos, clientes ilimitados e suporte prioritário."}
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={handleOpenCheckout}
                          disabled={checkoutLoading}
                          startIcon={<TrendingUp size={18} />}
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                        >
                          {checkoutLoading ? "Carregando..." : tenant?.subscription?.status === "active" ? "Renovar Plano Mensal (R$ 99,90)" : "Assinar Plano Mensal (R$ 99,90)"}
                        </Button>
                      </Box>
                    )}

                    {tenant?.subscription?.plan?.code === "MONTHLY" && tenant?.subscription?.status === "active" &&
                      tenant.subscription.current_period_end && new Date(tenant.subscription.current_period_end) >= new Date() && (
                      <Box>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            bgcolor: "rgba(76, 175, 80, 0.05)",
                            border: "1px solid rgba(76, 175, 80, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <CheckCircle2 color="#4caf50" size={24} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={800}>
                              Você está no Plano Profissional
                            </Typography>
                            <Typography variant="caption" color="text.primary">
                              Sua assinatura está ativa e você tem acesso total a
                              todos os recursos.
                            </Typography>
                            {(() => {
                              if (tenant?.subscription?.payment_method === "pix") {
                                return (
                                  <Typography variant="caption" color="text.primary" display="block" sx={{ mt: 0.5 }}>
                                    Próxima cobrança em{" "}
                                    {dayjs(tenant?.subscription?.current_period_end).format("DD/MM/YYYY")}{" "}
                                    • Pagamento via PIX
                                  </Typography>
                                );
                              }
                              const defaultCard = savedCards.find((c) => c.is_default);
                              if (!defaultCard) return null;
                              return (
                                <Typography variant="caption" color="text.primary" display="block" sx={{ mt: 0.5 }}>
                                  Próxima cobrança em{" "}
                                  {dayjs(tenant?.subscription?.current_period_end).format("DD/MM/YYYY")}{" "}
                                  • {defaultCard.brand.toUpperCase()} •••• {defaultCard.last4}
                                </Typography>
                              );
                            })()}
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => setOpenCancelModal(true)}
                          sx={{ borderRadius: 2 }}
                        >
                          Cancelar Assinatura
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                {showPaymentMethodSection && (
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Stack spacing={3}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          Método de Pagamento
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant={
                              paymentMethod === "card" ? "contained" : "text"
                            }
                            onClick={() => handlePaymentMethodChange("card")}
                            startIcon={<CreditCard size={16} />}
                            disabled={savingPaymentMethod}
                            sx={{ borderRadius: 2 }}
                          >
                            Cartão
                          </Button>
                          <Button
                            size="small"
                            variant={
                              paymentMethod === "pix" ? "contained" : "text"
                            }
                            onClick={() => handlePaymentMethodChange("pix")}
                            startIcon={<QrCode size={16} />}
                            disabled={savingPaymentMethod}
                            sx={{ borderRadius: 2 }}
                          >
                            PIX
                          </Button>
                        </Stack>
                      </Box>

                      {paymentMethod === "card" ? (
                        <Box>
                          {loadingCards ? (
                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                              {[0, 1].map((i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: "12px 16px",
                                    borderRadius: 3,
                                    border: "1px solid #E0E0E0",
                                  }}
                                >
                                  <Skeleton variant="rounded" width={54} height={34} sx={{ flexShrink: 0 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width={160} height={18} />
                                    <Skeleton variant="text" width={90} height={14} />
                                  </Box>
                                  <Skeleton variant="circular" width={30} height={30} sx={{ flexShrink: 0 }} />
                                </Box>
                              ))}
                            </Stack>
                          ) : savedCards.length > 0 ? (
                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                              {savedCards.map((card) => (
                                <PaymentMethodCard
                                  key={card.id}
                                  card={card}
                                  onSetDefault={handleSetDefault}
                                  onRemove={handleRemoveCard}
                                />
                              ))}
                            </Stack>
                          ) : (
                            <Box
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  p: 2.5,
                                  borderRadius: 2,
                                  bgcolor: "rgba(0,0,0,0.02)",
                                  border: "1px dashed rgba(0,0,0,0.12)",
                                  mb: 2,
                                }}
                              >
                                <CreditCard size={22} color="#bbb" />
                                <Typography variant="body2" color="text.primary">
                                  Nenhum cartão cadastrado.
                                </Typography>
                              </Box>
                          )}
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<Plus size={16} />}
                            onClick={
                              tenant?.subscription?.status === "incomplete" || tenant?.subscription?.status === "pending"
                                ? handleOpenCheckout
                                : handleOpenSetupCard
                            }
                            disabled={checkoutLoading}
                            sx={{ borderRadius: 2 }}
                          >
                            {tenant?.subscription?.status === "incomplete" || tenant?.subscription?.status === "pending"
                              ? "Ativar assinatura com cartão"
                              : "Adicionar Cartão"}
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Stack
                            spacing={2}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: "rgba(111,66,193,0.03)",
                              border: "1px solid rgba(111,66,193,0.1)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  p: 1,
                                  bgcolor: "primary.main",
                                  borderRadius: 1.5,
                                  color: "white",
                                  display: "flex",
                                }}
                              >
                                <QrCode size={24} />
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  Pagamento via PIX selecionado
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.primary"
                                >
                                  As faturas serão geradas mensalmente com QR Code
                                  para pagamento.
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                )}

                {/* Encerrar conta — card simples no fim da coluna de cobrança */}
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Encerrar conta
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        Remove permanentemente todos os seus dados.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setDeleteAccountPassword("");
                        setDeleteAccountStep(1);
                        setOpenDeleteAccount(true);
                      }}
                      sx={{ borderRadius: 2, whiteSpace: "nowrap" }}
                    >
                      Encerrar Conta
                    </Button>
                  </Box>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: "primary.main",
                  color: "white",
                }}
              >
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={800}>
                    Por que assinar?
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      "Clientes e Pets ilimitados",
                      "Agenda inteligente sem conflitos",
                      "Relatórios financeiros avançados",
                      "Automação básica de WhatsApp",
                      "Suporte prioritário via chat",
                      "Backup diário automático",
                    ].map((feat, i) => (
                      <Box
                        key={i}
                        sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
                      >
                        <CheckCircle2 size={18} color="#90caf9" />
                        <Typography variant="body2">{feat}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block" }}
                    >
                      "O PetControle mudou a forma como gerencio meu banho e
                      tosa. Economizo pelo menos 5h por semana."
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, fontWeight: 700, display: "block" }}
                    >
                      — Maria S., Pet d'Aline
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* --- HISTÓRICO DE FATURAS --- */}
          <Paper sx={{ mt: 4, p: 4, borderRadius: 4 }}>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={800}>
                Histórico de Faturas
              </Typography>
              <Divider />
              {loadingCharges ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : charges.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.primary">
                    Nenhuma fatura encontrada.
                  </Typography>
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
                        border: "1px solid #E0E0E0",
                        bgcolor: "rgba(0,0,0,0.01)",
                        flexWrap: "wrap",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      <Grid container spacing={2} alignItems="center" sx={{ flex: 1, minWidth: "280px" }}>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">
                            Data
                          </Typography>
                          <Typography variant="body2" fontWeight={600} mt={0.5}>
                            {dayjs(charge.created_at).format("DD/MM/YYYY")}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">
                            Método de Pagamento
                          </Typography>
                          <Typography variant="body2" sx={{ textTransform: "uppercase", fontWeight: 600 }} mt={0.5}>
                            {charge.payment_method === "card"
                              ? `Cartão de Crédito ${
                                  charge.card_brand
                                    ? `(${charge.card_brand.toUpperCase()} •••• ${charge.card_last_four})`
                                    : ""
                                }`
                              : "PIX"}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block">
                            Valor
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="primary.main" mt={0.5}>
                            {(charge.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                            Status
                          </Typography>
                          {getChargeStatusChip(charge.status)}
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
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

      {/* --- MODAL DE CHECKOUT --- */}
      <Modal
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openCheckout}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", sm: 900 },
              bgcolor: "background.paper",
              borderRadius: 4,
              boxShadow: 24,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "primary.main",
                p: 3,
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Lock size={20} />
                <Typography variant="h6" fontWeight={700}>
                  {checkoutMode === "setup" ? "Adicionar Cartão" : "Assinar Plano Mensal"}
                </Typography>
              </Stack>
              <IconButton onClick={() => setOpenCheckout(false)} sx={{ color: "white" }}>
                <X size={20} />
              </IconButton>
            </Box>

            <Box sx={{ p: 4 }}>
              {checkoutError ? (
                <Box>
                  <Typography color="error" variant="body2" sx={{ mb: 3 }}>
                    {checkoutError}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={() => setOpenCheckout(false)} sx={{ flex: 1 }}>
                      Fechar
                    </Button>
                    <Button variant="contained" onClick={() => setCheckoutError(null)} sx={{ flex: 1 }}>
                      Tentar Novamente
                    </Button>
                  </Stack>
                </Box>
              ) : checkoutLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* Selector of payment method inside the modal */}
                  {checkoutMode === "payment" && !pixData && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                      <Stack direction="row" spacing={1} sx={{ bgcolor: "rgba(0,0,0,0.03)", p: 0.5, borderRadius: 2.5 }}>
                        <Button
                          size="small"
                          variant={paymentMethod === "card" ? "contained" : "text"}
                          onClick={() => setPaymentMethod("card")}
                          startIcon={<CreditCard size={14} />}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 0.75,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: paymentMethod === "card" ? "primary.main" : "transparent",
                            color: paymentMethod === "card" ? "white" : "text.primary",
                            "&:hover": {
                              bgcolor: paymentMethod === "card" ? "primary.dark" : "rgba(0,0,0,0.05)",
                            }
                          }}
                        >
                          Cartão de Crédito
                        </Button>
                        <Button
                          size="small"
                          variant={paymentMethod === "pix" ? "contained" : "text"}
                          onClick={() => setPaymentMethod("pix")}
                          startIcon={<QrCode size={14} />}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 0.75,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: paymentMethod === "pix" ? "primary.main" : "transparent",
                            color: paymentMethod === "pix" ? "white" : "text.primary",
                            "&:hover": {
                              bgcolor: paymentMethod === "pix" ? "primary.dark" : "rgba(0,0,0,0.05)",
                            }
                          }}
                        >
                          PIX
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  {checkoutMode === "payment" && paymentMethod === "pix" && !checkoutStartAt ? (
                    pixData ? (
                      <PixQrCode
                        qrCode={pixData.pix_qr_code}
                        qrCodeUrl={pixData.pix_qr_code_url}
                        expiresAt={pixData.expires_at}
                        onClose={() => setOpenCheckout(false)}
                      />
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                          Informe seu CPF ou CNPJ para gerar o QR Code PIX.
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                          <TextField
                            fullWidth
                            value={pixDocument}
                            onChange={(e) => {
                              setPixDocument(maskDocument(e.target.value));
                            }}
                            placeholder="000.000.000-00"
                            size="small"
                          />
                          <Button
                            variant="contained"
                            disabled={pixDocument.replace(/\D/g, "").length < 11}
                            onClick={() => handleGeneratePix()}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            Gerar PIX
                          </Button>
                        </Box>
                      </Box>
                    )
                  ) : checkoutMode === "payment" && paymentMethod === "card" && savedCards.length > 0 && !useNewCard ? (
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Selecione um cartão salvo para assinar:
                      </Typography>
                      <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {savedCards.map((card) => {
                          const isSelected = selectedCardId === card.id;
                          const brand = card.brand.toLowerCase();
                          const brandLabel = brand === "visa" ? "VISA" : brand === "mastercard" ? "MASTER" : brand.toUpperCase();
                          const brandColor = brand === "visa" ? "#1A1F71" : brand === "mastercard" ? "#A50808" : "#313485";
                          const brandBg = brand === "visa" ? "#DDE1F5" : brand === "mastercard" ? "#FAD7D7" : "#E0E0F0";

                          return (
                            <Box
                              key={card.id}
                              onClick={() => setSelectedCardId(card.id)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                borderRadius: 3,
                                border: isSelected
                                  ? "2.5px solid #313485"
                                  : "1px solid #C5C7D4",
                                bgcolor: isSelected ? "#F0F0FA" : "#FAFAFA",
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  borderColor: "#313485",
                                  bgcolor: "#F5F5FC",
                                },
                              }}
                            >
                              {/* Custom Radio Button */}
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  border: isSelected ? "6px solid #313485" : "2px solid #C5C7D4",
                                  bgcolor: "white",
                                  flexShrink: 0,
                                  transition: "all 0.1s ease-in-out",
                                }}
                              />

                              {/* Brand badge */}
                              <Box
                                sx={{
                                  minWidth: 54,
                                  height: 34,
                                  borderRadius: 1.5,
                                  bgcolor: brandBg,
                                  border: `1px solid ${brandColor}22`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  px: 1,
                                  flexShrink: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    color: brandColor,
                                    letterSpacing: 0.5,
                                    fontSize: "0.62rem",
                                    lineHeight: 1,
                                  }}
                                >
                                  {brandLabel}
                                </Typography>
                              </Box>

                              {/* Card details */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    noWrap
                                    sx={{ color: "#1A1A2E" }}
                                  >
                                    •••• •••• •••• {card.last4}
                                  </Typography>
                                  {card.is_default && (
                                    <Chip
                                      label="Padrão"
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.62rem",
                                        fontWeight: 700,
                                        bgcolor: "#313485",
                                        color: "#fff",
                                        "& .MuiChip-label": { px: 0.8 },
                                      }}
                                    />
                                  )}
                                </Stack>
                                <Typography sx={{ fontSize: "0.72rem", color: "#555570", mt: 0.2 }}>
                                  Expira {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>

                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleCheckoutWithSavedCard}
                        sx={{ py: 1.5, fontSize: "1rem", fontWeight: 700, borderRadius: 2, mb: 2 }}
                      >
                        Confirmar Assinatura
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setUseNewCard(true)}
                        sx={{ py: 1, fontSize: "0.875rem", borderRadius: 2 }}
                      >
                        Usar outro cartão de crédito
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <CheckoutForm
                        buttonLabel={checkoutMode === "setup" ? "Adicionar Cartão" : "Confirmar Assinatura"}
                        defaultDocument={tenant?.document}
                        onSuccess={async (cardToken, document, billingAddress) => {
                          setCheckoutLoading(true);
                          try {
                            if (checkoutMode === "setup") {
                              await addPaymentMethod(cardToken, billingAddress, document);
                              toast.success("Cartão salvo com sucesso!");
                              await fetchCards();
                            } else {
                              await createCheckout("MONTHLY", "credit_card", cardToken, document, billingAddress, checkoutStartAt ?? undefined);
                              setCheckoutStartAt(null);
                              toast.success("Pagamento enviado! Aguardando confirmação...");
                              await checkAuth();
                              setAwaitingConfirmation(true);
                              setPollCount(0);
                            }
                            setOpenCheckout(false);
                          } catch (err: any) {
                            console.error(err);
                            const detail = err.response?.data?.detail || "Erro ao processar pagamento. Tente novamente.";
                            setCheckoutError(typeof detail === "string" ? detail : JSON.stringify(detail));
                          } finally {
                            setCheckoutLoading(false);
                          }
                        }}
                      />
                      {checkoutMode === "payment" && paymentMethod === "card" && savedCards.length > 0 && (
                        <Button
                          variant="text"
                          fullWidth
                          onClick={() => setUseNewCard(false)}
                          sx={{ mt: 1.5, fontSize: "0.875rem", textTransform: "none" }}
                        >
                          Voltar para cartões salvos
                        </Button>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
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
            Tem certeza que deseja cancelar sua assinatura? Você perderá imediatamente o
            acesso a novos agendamentos e o sistema entrará em modo leitura.
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
                  "Sua assinatura será cancelada imediatamente",
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

      {/* --- DIALOG VER QR CODE PIX DA FATURA --- */}
      <Dialog
        open={openPixModal}
        onClose={() => setOpenPixModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
          <Typography variant="h6">QR Code PIX da Fatura</Typography>
          <Box sx={{ cursor: "pointer" }}>
            <X onClick={() => setOpenPixModal(false)} size={24} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPixCharge && (
            <PixQrCode
              qrCode={selectedPixCharge.pix_qr_code || ""}
              qrCodeUrl={selectedPixCharge.pix_qr_code_url || ""}
              expiresAt={selectedPixCharge.expires_at || ""}
              onClose={() => setOpenPixModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
