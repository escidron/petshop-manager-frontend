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
  CircularProgress,
  IconButton,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Settings,
  CreditCard,
  User,
  Trash2,
  AlertTriangle,
  Info,
  Users,
  Lock,
  Plus,
  X,
  Download,
  Package as PackageIcon,
  Truck,
  Home,
  PawPrint,
  ClipboardList,
  Barcode,
  ShoppingBag,
  UserCheck,
  ShoppingCart,
  Percent,
  BarChart2,
  Edit2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePermission, SYSTEM_MODULES } from "../hooks/usePermission";
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
  updateTenantUserPermissions,
  changePassword,
  type TenantUserResponse,
} from "../api/services/users";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { useToast } from "../hooks/useToast";
import { maskPhone, maskDocument, maskCep } from "../utils/masks";
import { getAddressByCep } from "../api/services/address";
import {
  listPaymentMethods,
  cancelSubscription,
  refundAndCancelSubscription,
  listCharges,
  updateChargeCard,
  changeSubscriptionToPix,
  cancelPackage,
  cancelCharge,
} from "../api/services/subscriptions";
import CheckoutForm from "../features/billing/CheckoutForm";
import CheckoutStepper from "../features/billing/CheckoutStepper";
import UpdateCardModal from "../features/billing/UpdateCardModal";
import PixPaymentModal from "../features/billing/PixPaymentModal";
import type { PaymentMethod, CheckoutPixResponse, SubscriptionCharge } from "../features/billing/types";
import { Button } from "../components/Button/Button";
import WorkingHoursSettings from "../features/tenants/WorkingHoursSettings";
import { exportClients } from "../api/services/clients";
import { exportProducts } from "../api/services/products";
import { exportServices } from "../api/services/tenant_services";
import { exportPackages } from "../api/services/packages";
import { exportSuppliers } from "../api/services/suppliers";
import { exportEmployees } from "../api/services/employees";
import BillingAddonsSection from "../features/billing/BillingAddonsSection";
import SubscriptionManagement from "../features/billing/SubscriptionManagement";
import POSSettingsSection from "../features/cash_register/POSSettingsSection";

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
      {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = () => {
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));

  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(0);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [openTenantEdit, setOpenTenantEdit] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openUpdateCard, setOpenUpdateCard] = useState(false);
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
      toast.success("Limite de agendamentos atualizado!");
    } catch (error) {
      console.error("Failed to save limit value:", error);
      toast.error("Erro ao atualizar o limite de agendamentos.");
    } finally {
      setSavingLimit(false);
    }
  };



  const [charges, setCharges] = useState<SubscriptionCharge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [openUpdateCardDialog, setOpenUpdateCardDialog] = useState(false);
  const [updateCardLoading, setUpdateCardLoading] = useState(false);
  const [chargeToUpdateCard, setChargeToUpdateCard] = useState<SubscriptionCharge | null>(null);
  const [openCancelPackageModal, setOpenCancelPackageModal] = useState(false);
  const [cancelingPackage, setCancelingPackage] = useState(false);
  const [openAddCardModal, setOpenAddCardModal] = useState(false);


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

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "dashboard",
    "clients",
    "pets",
    "services",
    "products",
    "packages",
    "pos",
    "inventory",
  ]);
  const [userToEditPermissions, setUserToEditPermissions] = useState<TenantUserResponse | null>(null);
  const [editPermissionsList, setEditPermissionsList] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

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
    watch: watchCreateUser,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee" },
  });

  const watchCreateUserRole = watchCreateUser("role");

  const getModuleIcon = (id: string) => {
    switch (id) {
      case "dashboard":
        return <Home size={18} />;
      case "clients":
        return <Users size={18} />;
      case "pets":
        return <PawPrint size={18} />;
      case "services":
        return <ClipboardList size={18} />;
      case "products":
        return <Barcode size={18} />;
      case "packages":
        return <ShoppingBag size={18} />;
      case "suppliers":
        return <Truck size={18} />;
      case "employees":
        return <UserCheck size={18} />;
      case "pos":
        return <ShoppingCart size={18} />;
      case "inventory":
        return <PackageIcon size={18} />;
      case "commissions":
        return <Percent size={18} />;
      case "reports":
        return <BarChart2 size={18} />;
      case "settings":
        return <Settings size={18} />;
      default:
        return <Settings size={18} />;
    }
  };

  const tabConfig = useMemo(
    () => [
      { id: "general", label: "Geral", icon: <Settings size={16} /> },
      ...(isOwner
        ? [{ id: "pos", label: "PDV / Caixa", icon: <ShoppingCart size={16} /> }]
        : []),
      ...(isOwner
        ? [{ id: "billing", label: "Planos e Assinatura", icon: <CreditCard size={16} /> }]
        : []),
      { id: "profile", label: "Perfil", icon: <User size={16} /> },
      ...(isOwner
        ? [{ id: "users", label: "Usuários", icon: <Users size={16} /> }]
        : []),
      ...(isOwner
        ? [{ id: "backup", label: "Exportar", icon: <Download size={16} /> }]
        : []),
    ],
    [isOwner],
  );

  const getTabIndex = useCallback((id: string) => tabConfig.findIndex((t) => t.id === id), [tabConfig]);

  const [openPixModal, setOpenPixModal] = useState(false);

  useEffect(() => {
    if (tenant?.document && !pixDocument) {
      setPixDocument(maskDocument(tenant.document));
    }
  }, [tenant?.document, pixDocument]);

  const [selectedAddonPkg, setSelectedAddonPkg] = useState<string | null>(null);
  const [openPackageCheckout, setOpenPackageCheckout] = useState(false);
  const [selectedPackageForCheckout, setSelectedPackageForCheckout] = useState<string | null>(null);

  const getCheckoutTitle = () => {
    if (selectedAddonPkg) {
      const pkgNames: Record<string, string> = {
        pkg_200: "Contratar Pacote 200 Mensagens - R$ 37,90/mês",
        pkg_500: "Contratar Pacote 500 Mensagens - R$ 69,90/mês",
        pkg_1000: "Contratar Pacote 1.000 Mensagens - R$ 119,90/mês",
        pkg_2000: "Contratar Pacote 2.000 Mensagens - R$ 199,90/mês",
      };
      return pkgNames[selectedAddonPkg] || "Contratar Pacote de WhatsApp";
    }
    return "Forma de Pagamento & Assinatura";
  };

  const [loadingCep, setLoadingCep] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue: setTenantValue,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      phone: tenant?.phone || "",
      document: tenant?.document || "",
      cep: tenant?.cep || "",
      street: tenant?.street || "",
      number: tenant?.number || "",
      complement: tenant?.complement || "",
      neighborhood: tenant?.neighborhood || "",
      city: tenant?.city || "",
      state: tenant?.state || "",
    },
  });

  const handleCepLookup = async (cepInput: string) => {
    const digits = (cepInput || "").replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      try {
        const address = await getAddressByCep(digits);
        if (address && (address.street || address.neighborhood || address.city)) {
          if (address.street) setTenantValue("street", address.street, { shouldValidate: true });
          if (address.neighborhood) setTenantValue("neighborhood", address.neighborhood, { shouldValidate: true });
          if (address.city) setTenantValue("city", address.city, { shouldValidate: true });
          if (address.state) setTenantValue("state", address.state, { shouldValidate: true });
          return;
        }
      } catch {
        // Fallback direto ao ViaCEP caso o endpoint interno retorne erro
      }

      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        if (data.logradouro) setTenantValue("street", data.logradouro, { shouldValidate: true });
        if (data.bairro) setTenantValue("neighborhood", data.bairro, { shouldValidate: true });
        if (data.localidade) setTenantValue("city", data.localidade, { shouldValidate: true });
        if (data.uf) setTenantValue("state", data.uf, { shouldValidate: true });
      } else {
        toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
      }
    } catch {
      // Ignora erro de busca
    } finally {
      setLoadingCep(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document || "",
        cep: tenant.cep || "",
        street: tenant.street || "",
        number: tenant.number || "",
        complement: tenant.complement || "",
        neighborhood: tenant.neighborhood || "",
        city: tenant.city || "",
        state: tenant.state || "",
      });
      setLimitEnabled(tenant.max_simultaneous_appointments !== null && tenant.max_simultaneous_appointments !== undefined);
      setLimitValue(tenant.max_simultaneous_appointments ?? 2);
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

  const handleCancelPackage = async () => {
    setCancelingPackage(true);
    try {
      await cancelPackage();
      toast.success("Pacote de WhatsApp cancelado com sucesso!");
      await checkAuth();
      await fetchCharges();
      setOpenCancelPackageModal(false);
    } catch {
      toast.error("Erro ao cancelar pacote de WhatsApp.");
    } finally {
      setCancelingPackage(false);
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

  const now = new Date();
  const sub = tenant?.subscription;
  const isSubCanceled = sub?.status === "canceled";

  // Data real do término do período de teste gratuito
  const trialEndDate = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const isTrialDateFuture = Boolean(trialEndDate && trialEndDate.getTime() > now.getTime());

  // Cenário de Antecipação no Trial: O cliente ainda está dentro do período de teste (ex: até 26/09),
  // mas já antecipou o pagamento do próximo ciclo (status = active e current_period_end > trialEndDate)
  const isTrialWithPrepaidCycle = Boolean(
    !tenant?.feature_flags?.free_access &&
    !isSubCanceled &&
    sub?.status === "active" &&
    isTrialDateFuture &&
    sub?.current_period_end &&
    new Date(sub.current_period_end).getTime() > (trialEndDate?.getTime() || 0)
  );

  // Está no período gratuito regular (sem pagamento antecipado confirmado)
  const isTrialActive = Boolean(
    !tenant?.feature_flags?.free_access &&
    !isSubCanceled &&
    !isTrialWithPrepaidCycle &&
    isTrialDateFuture &&
    (sub?.status === "trialing" || sub?.status !== "active")
  );

  const activePendingPixCharge = useMemo(() => {
    return charges.find(c => c.payment_method === "pix" && c.status === "pending" && c.pix_qr_code);
  }, [charges]);

  const activePendingPix = useMemo(() => {
    if (pixData && pixData.pix_qr_code) {
      return {
        qrCode: pixData.pix_qr_code,
        qrCodeUrl: pixData.pix_qr_code_url,
        expiresAt: pixData.expires_at,
        amount: 9990,
        chargeId: (pixData as any).charge_id || (pixData as any).pagarme_subscription_id,
      };
    }
    if (activePendingPixCharge && activePendingPixCharge.pix_qr_code) {
      return {
        qrCode: activePendingPixCharge.pix_qr_code,
        qrCodeUrl: activePendingPixCharge.pix_qr_code_url,
        expiresAt: activePendingPixCharge.expires_at,
        amount: activePendingPixCharge.amount || 9990,
        chargeId: activePendingPixCharge.id,
      };
    }
    return null;
  }, [pixData, activePendingPixCharge]);

  const handleClosePixModal = () => {
    setOpenPixModal(false);
    fetchCharges();
    checkAuth();
  };

  const handleCancelPendingPix = async () => {
    const chargeId = activePendingPix?.chargeId;
    if (!chargeId) {
      setPixData(null);
      setOpenPixModal(false);
      return;
    }
    try {
      await cancelCharge(chargeId);
      toast.success("Cobrança PIX cancelada com sucesso.");
      setPixData(null);
      setOpenPixModal(false);
      await fetchCharges();
      await checkAuth();
    } catch {
      toast.error("Erro ao cancelar cobrança PIX.");
    }
  };



  // Polling automático enquanto o modal PIX está aberto ou há cobrança pendente
  useEffect(() => {
    if (!openPixModal && !activePendingPixCharge) return;

    const interval = setInterval(async () => {
      try {
        const history = await listCharges();
        setCharges(history);
        const hasPaidCharge = history.some(c => c.payment_method === "pix" && (c.status === "paid" || c.status === "captured"));
        if (hasPaidCharge) {
          await checkAuth();
          setOpenPixModal(false);
          setPixData(null);
          toast.success("Pagamento PIX confirmado! Assinatura ativada.");
        }
      } catch {
        // Silencioso
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [openPixModal, activePendingPixCharge, checkAuth, toast]);

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
      const payload = {
        ...data,
        permissions: data.role === "owner" ? undefined : selectedPermissions,
      };
      const newUser = await createTenantUser(payload);
      setTenantUsers((prev) => [...prev, newUser]);
      setOpenCreateUser(false);
      resetCreateUser();
      setSelectedPermissions([
        "dashboard",
        "clients",
        "pets",
        "services",
        "products",
        "packages",
        "pos",
        "inventory",
      ]);
      toast.success("Usuário criado com sucesso!");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao criar usuário. Verifique os dados e tente novamente.";
      toast.error(message || "Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setCreatingUser(false);
    }
  };

  const onSavePermissions = async () => {
    if (!userToEditPermissions) return;
    setSavingPermissions(true);
    try {
      const updated = await updateTenantUserPermissions(
        userToEditPermissions.id,
        editPermissionsList
      );
      setTenantUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, permissions: updated.permissions } : u))
      );
      toast.success("Permissões atualizadas com sucesso!");
      setUserToEditPermissions(null);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error) ? error.response?.data?.detail : "Erro ao atualizar permissões.";
      toast.error(message || "Erro ao atualizar permissões.");
    } finally {
      setSavingPermissions(false);
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
        toast.success(
          isTrialActive
            ? "Período de teste cancelado com sucesso. Nenhuma cobrança futura será realizada."
            : "Assinatura cancelada com sucesso."
        );
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
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(24px + env(safe-area-inset-bottom, 0px))", md: 3 },
      }}
    >
      <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          color="primary.main"
          sx={{ fontSize: { xs: "1.35rem", sm: "1.75rem" }, mb: 0.25 }}
        >
          Configurações
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.82rem", sm: "0.95rem" } }}
        >
          Gerencie as preferências da sua conta, empresa e assinaturas.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, sm: 2.5 } }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons={false}
          TabIndicatorProps={{
            style: {
              backgroundColor: "#313485",
              height: 2.5,
              borderRadius: "2.5px 2.5px 0 0",
            },
          }}
          sx={{
            minHeight: 40,
            "& .MuiTabs-scrollButtons": {
              display: "none",
            },
            "& .MuiTabs-flexContainer": {
              gap: { xs: 0.5, sm: 1 },
            },
            "& .MuiTab-root": {
              minWidth: "auto",
              color: "text.secondary",
              fontWeight: 700,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              minHeight: 40,
              py: 0.75,
              px: { xs: 1.25, sm: 1.75 },
              whiteSpace: "nowrap",
              textTransform: "none",
              gap: 0.75,
            },
            "& .Mui-selected": { color: "primary.main !important" },
          }}
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
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1.5px solid", borderColor: "divider" }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
                  Dados Gerais
                </Typography>
                <Typography variant="body2" color="text.primary" mb={1}>
                  Dados cadastrais do seu estabelecimento.
                </Typography>
                <Divider sx={{ mb: 1 }} />
                
                <Grid container spacing={2} sx={{ bgcolor: "action.hover", p: { xs: 1.75, sm: 2.5 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        Nome do Petshop
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {tenant?.name}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        Telefone
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {maskPhone(tenant?.phone) || "Não informado"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        CPF / CNPJ
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {tenant?.document ? maskDocument(tenant.document) : "Não informado"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                        Endereço
                      </Typography>
                      <Typography variant="body2" fontWeight={700} mt={0.25} color="text.primary">
                        {tenant?.street ? (
                          `${tenant.street}, ${tenant.number || "s/n"}${tenant.complement ? ` (${tenant.complement})` : ""} - ${tenant.neighborhood ? `${tenant.neighborhood}, ` : ""}${tenant.city || ""}${tenant.state ? `/${tenant.state}` : ""}${tenant.cep ? ` - CEP: ${maskCep(tenant.cep)}` : ""}`
                        ) : (
                          "Não informado"
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenTenantEdit(true)}
                  sx={{ width: { xs: "100%", sm: "auto" }, alignSelf: { xs: "stretch", sm: "flex-start" }, mt: 1, px: 3 }}
                >
                  Editar Informações
                </Button>
              </Stack>
            </Paper>

            {/* CARD 2: Agendamento Online */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1.5px solid", borderColor: "divider" }}>
              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span style={{ width: 3, height: 14, backgroundColor: "#6f42c1", borderRadius: 1.5, display: "inline-block" }} />
                  Agendamento Online
                </Typography>
                <Typography variant="body2" color="text.primary" mb={1}>
                  Configure as políticas de concorrência e capacidade de agendamentos online.
                </Typography>
                <Divider sx={{ mb: 1 }} />

                <Stack spacing={2} sx={{ bgcolor: "action.hover", p: { xs: 1.75, sm: 2.5 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
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
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 400 }}>
                      Ative para configurar a capacidade de agendamentos que a loja suporta atender no mesmo horário. Se desativado, o agendamento online ficará livre sem bloqueio de concorrência.
                    </Typography>
                  </Box>

                  {limitEnabled && (
                    <Stack spacing={1.5} sx={{ mt: 1, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                      <FormControl fullWidth>
                        <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 700, fontSize: "0.75rem" }}>
                          Limite de agendamentos por horário
                        </FormLabel>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                          <TextField
                            type="number"
                            size="small"
                            value={limitValue}
                            disabled={savingLimit}
                            onChange={(e) => setLimitValue(Math.max(1, parseInt(e.target.value) || 1))}
                            slotProps={{ htmlInput: { min: 1 } }}
                            sx={{ 
                              width: { xs: 90, sm: 80 },
                              "& .MuiInputBase-input": { py: 0.75, fontWeight: 700, fontSize: "0.875rem" }
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleSaveLimitValue}
                            disabled={savingLimit}
                            sx={{ py: 0.75, px: 2, flex: { xs: 1, sm: "none" } }}
                          >
                            {savingLimit ? <CircularProgress size={16} color="inherit" /> : "Salvar Limite"}
                          </Button>
                        </Box>
                      </FormControl>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500 }}>
                        Ex: se for {limitValue}, o horário será bloqueado para novos agendamentos online se já houver {limitValue} pets agendados nesse mesmo intervalo na loja inteira.
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* CARD 3: Horário de Funcionamento */}
            {isOwner && (
              <WorkingHoursSettings />
            )}

          </Stack>
        </CustomTabPanel>

        {/* --- ABA PDV / CAIXA (owner only) --- */}
        {isOwner && (
          <CustomTabPanel value={value} index={getTabIndex("pos")}>
            <POSSettingsSection />
          </CustomTabPanel>
        )}

        {/* --- ABA PLANOS E COBRANÇA (owner only) --- */}
        {isOwner && <CustomTabPanel value={value} index={getTabIndex("billing")}>
          <Stack spacing={4}>

            {/* ---- Reformulação da Assinatura e Formas de Pagamento (Design Novo) ---- */}
            <SubscriptionManagement
              tenant={tenant}
              savedCards={savedCards}
              charges={charges}
              activePendingPix={activePendingPix}
              autoOpenPix={searchParams.get("action") === "pix" || searchParams.get("openPix") === "1"}
              onOpenCancelModal={() => setOpenCancelModal(true)}
              onRefreshData={async () => {
                await checkAuth();
                await fetchCards();
                await fetchCharges();
              }}
              onToggleInvoices={() => {
                const elem = document.getElementById("billing-invoices-section");
                if (elem) {
                  elem.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />

            {/* ---- Add-ons / Pacotes ---- */}
            <Box sx={{ pt: 1 }}>
              <BillingAddonsSection
                activePackageId={tenant?.subscription?.whatsapp_package_id}
                packageStatus={tenant?.subscription?.whatsapp_package_status as any}
                messagesLimit={tenant?.subscription?.whatsapp_messages_limit}
                messagesUsed={tenant?.subscription?.whatsapp_messages_used}
                periodEnd={tenant?.subscription?.whatsapp_period_end}
                onHirePackage={(pkgId) => {
                  setSelectedPackageForCheckout(pkgId);
                  setOpenPackageCheckout(true);
                }}
                onCancelPackage={() => setOpenCancelPackageModal(true)}
              />
            </Box>

          </Stack>

          {/* ---- Histórico de Faturas ---- */}
          <Paper id="billing-invoices-section" sx={{ mt: 4, p: 4, borderRadius: 4 }}>
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
                                  setOpenCheckout(true);
                                }}
                              >
                                Pagar
                              </Button>
                            )}
                            {charge.payment_method === "card" && charge.status === "failed" && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setChargeToUpdateCard(charge);
                                  setOpenUpdateCardDialog(true);
                                }}
                              >
                                Pagar com outro cartão
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

          {/* Cancelar assinatura / período de teste */}
          {!isSubCanceled && !tenant?.feature_flags?.free_access && tenant?.subscription && (
            <Paper sx={{ mt: 3, p: 2.5, borderRadius: 3, border: "1px solid #FEE2E2", bgcolor: "#FFF5F5" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#991B1B">
                    {isTrialActive ? "Cancelar período de teste" : "Cancelar assinatura"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#B91C1C", display: "block", mt: 0.3 }}>
                    {isTrialActive
                      ? "Ao cancelar o período de teste, qualquer renovação automática programada no cartão será cancelada imediatamente no Pagar.me e nenhuma cobrança futura será realizada."
                      : "Ao cancelar sua assinatura, a renovação automática será interrompida imediatamente e o sistema passará para modo somente leitura."}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setOpenCancelModal(true)}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {isTrialActive ? "Cancelar período de teste" : "Cancelar assinatura"}
                </Button>
              </Box>
            </Paper>
          )}

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
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1.5px solid", borderColor: "divider" }}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 3 },
                  alignItems: "center",
                  flexDirection: { xs: "column", sm: "row" },
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={36} color="white" />
                </Box>
                <Box sx={{ minWidth: 0, width: "100%" }}>
                  <Typography variant="h6" fontWeight={800} noWrap sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role === "owner" ? "PROPRIETÁRIO" : "FUNCIONÁRIO"}
                    size="small"
                    sx={{
                      mt: 1,
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      bgcolor: user?.role === "owner" ? "rgba(49, 52, 133, 0.08)" : "action.hover",
                      color: user?.role === "owner" ? "primary.main" : "text.secondary",
                    }}
                  />
                </Box>
              </Box>
              <Divider />
              <Button
                variant="outlined"
                sx={{ width: { xs: "100%", sm: "auto" }, alignSelf: { xs: "stretch", sm: "flex-start" } }}
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
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                    Usuários do Sistema
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                    Gerencie quem tem acesso ao Data Pet.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => setOpenCreateUser(true)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Novo Usuário
                </Button>
              </Box>

              {loadingUsers ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1.5px solid", borderColor: "divider", overflow: "hidden" }}>
                  {tenantUsers.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        Nenhum usuário cadastrado ainda.
                      </Typography>
                    </Box>
                  ) : (
                    tenantUsers.map((u, i) => (
                      <React.Fragment key={u.id}>
                        <Box
                          sx={{
                            p: { xs: 1.75, sm: 2 },
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            justifyContent: "space-between",
                            gap: { xs: 1.5, sm: 2 },
                          }}
                        >
                          {/* User Info */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: "50%",
                                bgcolor:
                                  u.role === "owner"
                                    ? "primary.main"
                                    : "secondary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <User size={20} color="white" />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                <Typography variant="subtitle2" fontWeight={700} color="#0F172A" noWrap>
                                  {u.name}
                                </Typography>
                                <Chip
                                  label={
                                    u.role === "owner" ? "Proprietário" : "Funcionário"
                                  }
                                  color={u.role === "owner" ? "primary" : "default"}
                                  size="small"
                                  sx={{ height: 20, fontWeight: 700, fontSize: "0.68rem" }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                                {u.email}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Permissions & Actions */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: { xs: "space-between", sm: "flex-end" },
                              gap: 1.25,
                              pt: { xs: 1, sm: 0 },
                              borderTop: { xs: "1px dashed", sm: "none" },
                              borderColor: "divider",
                            }}
                          >
                            {u.role === "owner" ? (
                              <Chip
                                label="Acesso Total"
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
                              />
                            ) : (
                              <Tooltip
                                title={
                                  <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5, color: "white" }}>
                                      Módulos Permitidos:
                                    </Typography>
                                    {SYSTEM_MODULES.filter((m) =>
                                      (
                                        u.permissions || [
                                          "dashboard",
                                          "clients",
                                          "pets",
                                          "services",
                                          "products",
                                          "packages",
                                          "pos",
                                          "inventory",
                                        ]
                                      ).includes(m.id)
                                    ).map((m) => (
                                      <Typography key={m.id} variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.9)" }}>
                                        • {m.label}
                                      </Typography>
                                    ))}
                                  </Box>
                                }
                                arrow
                              >
                                <Chip
                                  label={`${(u.permissions || ["dashboard", "clients", "pets", "services", "products", "packages", "pos", "inventory"]).length} de ${SYSTEM_MODULES.length} módulos`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24, cursor: "help" }}
                                />
                              </Tooltip>
                            )}

                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              {u.role !== "owner" && (
                                <Tooltip title="Personalizar Permissões">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setUserToEditPermissions(u);
                                      setEditPermissionsList(
                                        u.permissions || [
                                          "dashboard",
                                          "clients",
                                          "pets",
                                          "services",
                                          "products",
                                          "packages",
                                          "pos",
                                          "inventory",
                                        ]
                                      );
                                    }}
                                    sx={{
                                      color: "primary.main",
                                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                      "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16) },
                                    }}
                                  >
                                    <Edit2 size={15} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {u.id !== Number(user?.id) && (
                                <Tooltip title="Remover Usuário">
                                  <IconButton
                                    size="small"
                                    onClick={() => setUserToDelete(u)}
                                    sx={{
                                      color: "error.main",
                                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                                      "&:hover": { bgcolor: (theme) => alpha(theme.palette.error.main, 0.16) },
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
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

      {/* --- DIALOG CRIAR USUÁRIO --- */}
      <Dialog
        open={openCreateUser}
        onClose={() => !creatingUser && setOpenCreateUser(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
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
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
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
                    <strong>Funcionário</strong> tem acesso restrito apenas aos módulos marcados abaixo.{" "}
                    <strong>Proprietário</strong> possui acesso irrestrito a todos os módulos e configurações do sistema.
                  </Typography>
                </Stack>
              </FormControl>

              {watchCreateUserRole === "employee" && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Módulos Permitidos
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ opacity: 0.7 }}>
                        Selecione individualmente os itens da barra lateral que este usuário poderá acessar:
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setSelectedPermissions(SYSTEM_MODULES.map((m) => m.id))}
                        sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}
                      >
                        Marcar Todos
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setSelectedPermissions([])}
                        sx={{ fontSize: "0.75rem", py: 0.25, px: 1, color: "text.primary" }}
                      >
                        Desmarcar Todos
                      </Button>
                    </Box>
                  </Box>

                  <Grid container spacing={1}>
                    {SYSTEM_MODULES.map((mod) => {
                      const isChecked = selectedPermissions.includes(mod.id);
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={mod.id}>
                          <Box
                            onClick={() => {
                              setSelectedPermissions((prev) =>
                                prev.includes(mod.id)
                                  ? prev.filter((id) => id !== mod.id)
                                  : [...prev, mod.id]
                              );
                            }}
                            sx={{
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1.25,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: isChecked ? "primary.main" : "divider",
                              bgcolor: isChecked
                                ? (theme) => alpha(theme.palette.primary.main, 0.06)
                                : "background.paper",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                              },
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              size="small"
                              sx={{ p: 0.5, color: isChecked ? "primary.main" : "inherit" }}
                            />
                            <Box
                              sx={{
                                color: isChecked ? "primary.main" : "text.primary",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {getModuleIcon(mod.id)}
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={isChecked ? 700 : 500} noWrap>
                                {mod.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.primary"
                                sx={{ opacity: 0.6, fontSize: "0.65rem", display: "block" }}
                              >
                                {mod.section}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

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

      {/* --- DIALOG EDITAR PERMISSÕES --- */}
      <Dialog
        open={!!userToEditPermissions}
        onClose={() => !savingPermissions && setUserToEditPermissions(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Personalizar Permissões</Typography>
            <Typography variant="caption" color="text.primary" sx={{ opacity: 0.7 }}>
              {userToEditPermissions?.name} ({userToEditPermissions?.email})
            </Typography>
          </Box>
          <Box sx={{ cursor: "pointer" }}>
            <X onClick={() => !savingPermissions && setUserToEditPermissions(null)} size={24} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 0.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.8 }}>
                Marque os itens da barra lateral que este funcionário poderá acessar:
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setEditPermissionsList(SYSTEM_MODULES.map((m) => m.id))}
                  sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}
                >
                  Marcar Todos
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setEditPermissionsList([])}
                  sx={{ fontSize: "0.75rem", py: 0.25, px: 1, color: "text.primary" }}
                >
                  Desmarcar Todos
                </Button>
              </Box>
            </Box>

            <Grid container spacing={1}>
              {SYSTEM_MODULES.map((mod) => {
                const isChecked = editPermissionsList.includes(mod.id);
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={mod.id}>
                    <Box
                      onClick={() => {
                        setEditPermissionsList((prev) =>
                          prev.includes(mod.id)
                            ? prev.filter((id) => id !== mod.id)
                            : [...prev, mod.id]
                        );
                      }}
                      sx={{
                        p: 1.25,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: isChecked ? "primary.main" : "divider",
                        bgcolor: isChecked
                          ? (theme) => alpha(theme.palette.primary.main, 0.06)
                          : "background.paper",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        size="small"
                        sx={{ p: 0.5, color: isChecked ? "primary.main" : "inherit" }}
                      />
                      <Box
                        sx={{
                          color: isChecked ? "primary.main" : "text.primary",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {getModuleIcon(mod.id)}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={isChecked ? 700 : 500} noWrap>
                          {mod.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.primary"
                          sx={{ opacity: 0.6, fontSize: "0.65rem", display: "block" }}
                        >
                          {mod.section}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="text"
            onClick={() => setUserToEditPermissions(null)}
            disabled={savingPermissions}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={onSavePermissions}
            disabled={savingPermissions}
          >
            {savingPermissions ? <CircularProgress size={20} color="inherit" /> : "Salvar Permissões"}
          </Button>
        </DialogActions>
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
        fullScreen={isMobile}
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

      {/* --- MODAL DE EDIÇÃO DO TENANT --- */}
      <Dialog
        open={openTenantEdit}
        onClose={() => !savingTenant && setOpenTenantEdit(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
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

              <Divider sx={{ my: 0.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Endereço do Estabelecimento
                </Typography>
              </Divider>

              {/* CEP com busca automática */}
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  CEP
                </FormLabel>
                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value ? maskCep(field.value) : ""}
                      error={!!errors.cep}
                      helperText={errors.cep?.message || (loadingCep ? "Buscando dados do CEP..." : "")}
                      placeholder="00000-000"
                      disabled={loadingCep}
                      InputProps={{
                        endAdornment: loadingCep ? (
                          <CircularProgress size={18} sx={{ color: "text.secondary", mr: 1 }} />
                        ) : null,
                      }}
                      onBlur={() => handleCepLookup(field.value || "")}
                      onChange={(e) => {
                        const masked = maskCep(e.target.value);
                        field.onChange(masked);
                        if (masked.replace(/\D/g, "").length === 8) {
                          handleCepLookup(masked);
                        }
                      }}
                    />
                  )}
                />
              </FormControl>

              {/* Rua / Logradouro */}
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Logradouro (Rua / Avenida)
                </FormLabel>
                <Controller
                  name="street"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value || ""}
                      error={!!errors.street}
                      helperText={errors.street?.message}
                      placeholder="Ex: Rua Serra de Botucatu"
                    />
                  )}
                />
              </FormControl>

              {/* Número e Complemento */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Número
                    </FormLabel>
                    <Controller
                      name="number"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          value={field.value || ""}
                          error={!!errors.number}
                          helperText={errors.number?.message}
                          placeholder="123 ou S/N"
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Complemento (Opcional)
                    </FormLabel>
                    <Controller
                      name="complement"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          value={field.value || ""}
                          error={!!errors.complement}
                          helperText={errors.complement?.message}
                          placeholder="Sala, Bloco, etc."
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Bairro */}
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Bairro
                </FormLabel>
                <Controller
                  name="neighborhood"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      value={field.value || ""}
                      error={!!errors.neighborhood}
                      helperText={errors.neighborhood?.message}
                      placeholder="Ex: Vila Gomes Cardim"
                    />
                  )}
                />
              </FormControl>

              {/* Cidade e UF */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Cidade
                    </FormLabel>
                    <Controller
                      name="city"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          value={field.value || ""}
                          error={!!errors.city}
                          helperText={errors.city?.message}
                          placeholder="Ex: São Paulo"
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      UF
                    </FormLabel>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          value={field.value || ""}
                          error={!!errors.state}
                          helperText={errors.state?.message}
                          placeholder="SP"
                          inputProps={{ maxLength: 2, style: { textTransform: "uppercase" } }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>


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
      {/* --- DIALOG CANCELAR ASSINATURA --- */}
      <Dialog
        open={openCancelModal}
        onClose={() => !cancelingSubscription && setOpenCancelModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{isTrialActive ? "Cancelar Período de Teste" : "Cancelar Assinatura"}</DialogTitle>
        <DialogContent>
          <Typography>
            {isTrialActive
              ? "Tem certeza que deseja cancelar seu período de teste? Qualquer renovação automática programada no cartão será cancelada imediatamente no Pagar.me, nenhuma cobrança futura será realizada e o sistema entrará em modo leitura."
              : tenant?.subscription?.eligible_for_refund 
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
              ) : isTrialActive ? (
                "Sim, cancelar teste"
              ) : (
                "Sim, cancelar"
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG CANCELAR PACOTE WHATSAPP --- */}
      <Dialog
        open={openCancelPackageModal}
        onClose={() => !cancelingPackage && setOpenCancelPackageModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancelar Pacote de WhatsApp</DialogTitle>
        <DialogContent>
          <Typography color="text.primary">
            Tem certeza que deseja cancelar o pacote de mensagens WhatsApp? A renovação automática será cancelada imediatamente e não haverá novas cobranças.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
            <Button
              variant="text"
              onClick={() => setOpenCancelPackageModal(false)}
              disabled={cancelingPackage}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelPackage}
              disabled={cancelingPackage}
            >
              {cancelingPackage ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Sim, cancelar pacote"
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
        fullScreen={isMobile}
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

      {/* --- MODAL PARA ADICIONAR / CADASTRAR NOVO CARTÃO DE CRÉDITO (SEM COBRANÇA IMEDIATA) --- */}
      <UpdateCardModal
        open={openAddCardModal}
        onClose={() => setOpenAddCardModal(false)}
        tenantDocument={tenant?.document}
        onSuccess={async () => {
          if (tenant?.id && tenant?.subscription?.payment_method !== "card") {
            try {
              await updateSubscription(tenant.id, "card");
            } catch (e) {
              console.error("Erro ao atualizar método de pagamento para cartão:", e);
            }
          }
          await fetchCards();
          await checkAuth();
        }}
      />

      {/* --- STEPPER DE CHECKOUT COMPLETO (Passo a Passo: 1. Pagamento -> 2. Dados -> 3. Concluído) --- */}
      <CheckoutStepper
        open={openCheckout}
        onClose={() => {
          setOpenCheckout(false);
          setSelectedAddonPkg(null);
        }}
        onSuccess={async () => {
          await checkAuth();
          await fetchCards();
          await fetchCharges();
          setOpenCheckout(false);
          setSelectedAddonPkg(null);
        }}
        title={getCheckoutTitle()}
        planId={selectedAddonPkg || (tenant?.subscription?.plan?.code && tenant?.subscription?.plan?.code !== "FREE_TRIAL" ? tenant.subscription.plan.code : "MONTHLY")}
        tenantDocument={tenant?.document}
        savedCards={savedCards}
        existingPixData={pixData ? {
          pix_qr_code: pixData.pix_qr_code,
          pix_qr_code_url: pixData.pix_qr_code_url,
          expires_at: pixData.expires_at,
        } : activePendingPixCharge && activePendingPixCharge.pix_qr_code ? {
          pix_qr_code: activePendingPixCharge.pix_qr_code,
          pix_qr_code_url: activePendingPixCharge.pix_qr_code_url,
          expires_at: activePendingPixCharge.expires_at,
        } : null}
        startAt={null}
      />

      {/* --- MODAL DE CHECKOUT DO PACOTE DE WHATSAPP COM PRORATION (VIA CHECKOUT STEPPER) --- */}
      <CheckoutStepper
        open={openPackageCheckout}
        onClose={() => {
          setOpenPackageCheckout(false);
          setSelectedPackageForCheckout(null);
        }}
        packageCode={selectedPackageForCheckout}
        savedCards={savedCards}
        defaultPaymentMethod={tenant?.subscription?.payment_method as any}
        tenantDocument={tenant?.document}
        onSuccess={async () => {
          await checkAuth();
          await fetchCards();
          await fetchCharges();
          setOpenPackageCheckout(false);
          setSelectedPackageForCheckout(null);
        }}
      />

      {/* --- NOVO MODAL DE PAGAMENTO VIA PIX (Estilo Institucional / Bemprático) --- */}
      {activePendingPix && (
        <PixPaymentModal
          open={openPixModal}
          onClose={handleClosePixModal}
          qrCode={activePendingPix.qrCode}
          qrCodeUrl={activePendingPix.qrCodeUrl}
          expiresAt={activePendingPix.expiresAt}
          amount={activePendingPix.amount}
          chargeId={activePendingPix.chargeId}
          payerName={tenant?.name}
          payerDocument={tenant?.document}
          onCancelCharge={handleCancelPendingPix}
        />
      )}
    </Box>
  );
};

export default SettingsPage;
