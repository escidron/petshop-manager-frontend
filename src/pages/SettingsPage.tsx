import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack,
  Button,
  Divider,
  Grid,
  Chip,
  LinearProgress,
  Modal,
  Backdrop,
  Fade,
  TextField,
  CircularProgress,
  IconButton,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
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
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { maskPhone } from "../utils/masks";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { tenantSchema } from "../features/tenants/schemas";
import type { TenantFormData } from "../features/tenants/types";
import { updateTenant, updateSubscription } from "../api/services/tenants";
import {
  listTenantUsers,
  createTenantUser,
  removeTenantUser,
  changePassword,
  type TenantUserResponse,
} from "../api/services/users";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { toast } from "react-toastify";
import { createCheckout, createSetupIntent, listPaymentMethods, setDefaultPaymentMethod, removePaymentMethod } from "../api/services/subscriptions";
import CheckoutForm from "../features/billing/CheckoutForm";
import PaymentMethodCard from "../features/billing/PaymentMethodCard";
import type { CheckoutResponse, PaymentMethod } from "../features/billing/types";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<"payment" | "setup">("payment");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [savingTenant, setSavingTenant] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const { tenant, user, setTenant, checkAuth } = useAuth();
  const { isOwner } = usePermission();

  const [tenantUsers, setTenantUsers] = useState<TenantUserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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

  const getTabIndex = (id: string) => tabConfig.findIndex((t) => t.id === id);

  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">(
    (tenant?.subscription?.payment_method as "card" | "pix") ?? "card",
  );
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);

  const handlePaymentMethodChange = async (method: "card" | "pix") => {
    if (!tenant?.id || method === paymentMethod) return;
    setPaymentMethod(method);
    setSavingPaymentMethod(true);
    try {
      await updateSubscription(tenant.id, method);
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
    },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        phone: tenant.phone,
      });
    }
  }, [tenant, reset]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") {
      setValue(isOwner ? getTabIndex("billing") : 0);
    } else if (tab !== null && !isNaN(Number(tab))) {
      setValue(Number(tab));
    }
  }, [searchParams, isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    setLoadingUsers(true);
    listTenantUsers()
      .then(setTenantUsers)
      .finally(() => setLoadingUsers(false));
  }, [isOwner]);

  const fetchCards = async () => {
    setLoadingCards(true);
    try {
      const methods = await listPaymentMethods();
      setSavedCards(methods);
    } finally {
      setLoadingCards(false);
    }
  };

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

  // Busca cartões ao abrir a aba de cobrança
  useEffect(() => {
    if (!isOwner) return;
    const billingIdx = tabConfig.findIndex((t) => t.id === "billing");
    if (value === billingIdx) {
      fetchCards();
    }
  }, [value, isOwner]);

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
  }, [awaitingConfirmation, pollCount, tenant?.subscription?.status]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const getTrialDays = () => {
    if (!tenant?.subscription?.trial_ends_at) return 0;
    const expiryDate = dayjs(tenant.subscription.trial_ends_at);
    const daysLeft = expiryDate.diff(dayjs(), "day") + 1;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const trialDays = getTrialDays();

  const openCheckoutModal = () => {
    setCheckoutSecret(null);
    setCheckoutError(null);
    setOpenCheckout(true);
    setCheckoutLoading(true);
  };

  const handleOpenCheckout = async () => {
    setCheckoutMode("payment");
    openCheckoutModal();
    try {
      const data = await createCheckout("MONTHLY");
      if ("client_secret" in data) {
        setCheckoutSecret((data as CheckoutResponse).client_secret);
      } else {
        setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCheckoutError(msg ?? "Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenSetupCard = async () => {
    setCheckoutMode("setup");
    openCheckoutModal();
    try {
      const data = await createSetupIntent();
      setCheckoutSecret(data.client_secret);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCheckoutError(msg ?? "Erro ao configurar cartão. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const onSaveTenant = async (data: TenantFormData) => {
    if (!tenant) return;
    setSavingTenant(true);
    try {
      const updatedTenant = await updateTenant(tenant.id, data);
      setTenant({ ...tenant, ...updatedTenant });
      setOpenTenantEdit(false);
    } catch (error) {
      console.error("Failed to update tenant:", error);
      alert("Erro ao atualizar informações da empresa.");
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
    } catch {
      toast.error("Senha atual incorreta.");
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
    } catch {
      toast.error("Erro ao remover usuário.");
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
    } catch {
      toast.error("Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: "0 auto" }}>
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
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Informações da Empresa
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      Essas informações aparecerão nos seus recibos e
                      agendamentos.
                    </Typography>
                  </Box>
                  <Divider />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Nome do Petshop
                      </Typography>
                      <Typography variant="body1">{tenant?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Telefone de Contato
                      </Typography>
                      <Typography variant="body1">
                        {maskPhone(tenant?.phone) || "Não informado"}
                      </Typography>
                    </Box>
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setOpenTenantEdit(true)}
                      >
                        Editar Informações
                      </Button>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
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
                          {tenant?.subscription?.plan?.name || "Teste Gratuito"}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          tenant?.subscription?.status === "trialing" ? "PERÍODO DE TESTE" :
                          tenant?.subscription?.status === "active" ? "ATIVO" :
                          tenant?.subscription?.status === "incomplete" ? "PAGAMENTO PENDENTE" :
                          tenant?.subscription?.status === "past_due" ? "PAGAMENTO ATRASADO" :
                          tenant?.subscription?.status === "canceled" ? "CANCELADO" :
                          "DESCONHECIDO"
                        }
                        color={
                          tenant?.subscription?.status === "active" ? "success" :
                          tenant?.subscription?.status === "trialing" ? "secondary" :
                          "error"
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    {tenant?.subscription?.status === "trialing" && (
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
                            <Typography variant="body2" fontWeight={700}>
                              Faltam {trialDays} dias para o fim do teste
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {dayjs(tenant.subscription.trial_ends_at).format(
                                "DD/MM/YYYY",
                              )}
                            </Typography>
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
                          <Typography variant="caption" color="text.secondary">
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
                          <Typography variant="caption" color="text.secondary">
                            Isso pode levar alguns segundos...
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {!awaitingConfirmation && (tenant?.subscription?.plan?.code === "FREE_TRIAL" ||
                      tenant?.subscription?.status === "incomplete" ||
                      tenant?.subscription?.status === "past_due" ||
                      tenant?.subscription?.status === "canceled") && (
                      <Box>
                        <Typography variant="h6" fontWeight={800} gutterBottom>
                          {tenant?.subscription?.status === "incomplete"
                            ? "Complete o pagamento"
                            : tenant?.subscription?.status === "past_due"
                            ? "Regularize seu pagamento"
                            : tenant?.subscription?.status === "canceled"
                            ? "Reative sua assinatura"
                            : "Faça o Upgrade agora"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mb: 3 }}
                        >
                          {tenant?.subscription?.status === "incomplete"
                            ? "Seu cadastro foi criado. Insira o cartão ou pague via PIX para ativar."
                            : tenant?.subscription?.status === "past_due"
                            ? "Atualize seus dados de pagamento para continuar com acesso total."
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
                          {checkoutLoading ? "Carregando..." : "Assinar Plano Mensal (R$ 99,90)"}
                        </Button>
                      </Box>
                    )}

                    {tenant?.subscription?.plan?.code === "MONTHLY" && (
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: "rgba(76, 175, 80, 0.05)",
                          border: "1px solid rgba(76, 175, 80, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <CheckCircle2 color="#4caf50" size={24} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800}>
                            Você está no Plano Profissional
                          </Typography>
                          <Typography variant="caption" color="text.primary">
                            Sua assinatura está ativa e você tem acesso total a
                            todos os recursos.
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Paper>

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
                          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={24} />
                          </Box>
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
                            <Typography variant="body2" color="text.secondary">
                              Nenhum cartão cadastrado.
                            </Typography>
                          </Box>
                        )}
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<Plus size={16} />}
                          onClick={handleOpenSetupCard}
                          disabled={checkoutLoading}
                          sx={{ borderRadius: 2 }}
                        >
                          Adicionar Cartão
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
        </CustomTabPanel>}

        {/* --- ABA PERFIL --- */}
        <CustomTabPanel value={value} index={getTabIndex("profile")}>
          <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 600 }}>
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
                  sx={{ borderRadius: 2 }}
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

      {/* --- MODAL DE CHECKOUT STRIPE --- */}
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
              width: { xs: "90%", sm: 480 },
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
                  <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {checkoutError}
                  </Typography>
                  <Button variant="outlined" onClick={() => setOpenCheckout(false)} sx={{ width: "100%" }}>
                    Fechar
                  </Button>
                </Box>
              ) : checkoutLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : checkoutSecret ? (
                <Elements key={checkoutSecret} stripe={stripePromise} options={{ clientSecret: checkoutSecret }}>
                  <CheckoutForm
                    clientSecret={checkoutSecret}
                    onSuccess={async (pmId?: string) => {
                      setOpenCheckout(false);
                      setCheckoutSecret(null);
                      if (checkoutMode === "setup") {
                        if (pmId) {
                          try { await setDefaultPaymentMethod(pmId); } catch { /* ignore */ }
                        }
                        toast.success("Cartão salvo e definido como padrão!");
                        await fetchCards();
                      } else {
                        toast.success("Pagamento enviado! Aguardando confirmação...");
                        await checkAuth();
                        setAwaitingConfirmation(true);
                        setPollCount(0);
                      }
                    }}
                  />
                </Elements>
              ) : null}

              {!checkoutError && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                  display="block"
                  sx={{ mt: 2 }}
                >
                  Dados protegidos por criptografia Stripe. PCI-DSS compliant.
                </Typography>
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
    </Box>
  );
};

export default SettingsPage;
