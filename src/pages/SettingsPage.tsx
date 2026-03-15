import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Settings,
  CreditCard,
  User,
  Shield,
  CheckCircle2,
  TrendingUp,
  X,
  Lock,
  QrCode,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { maskPhone } from "../utils/masks";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantSchema } from "../features/tenants/schemas";
import type { TenantFormData } from "../features/tenants/types";
import { updateTenant, updateSubscription } from "../api/services/tenants";
import CustomTextField from "../components/Textfield/CustomTextfield";

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
  const [upgrading, setUpgrading] = useState(false);
  const [savingTenant, setSavingTenant] = useState(false);
  const { tenant, user, setTenant } = useAuth();

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
      setValue(1);
    }
  }, [searchParams]);

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

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      setOpenCheckout(false);
      alert(
        "Upgrade simulado com sucesso! Em uma integração real, aqui processaríamos o pagamento via Stripe.",
      );
    }, 2000);
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
            <Tab
              icon={<Settings size={18} />}
              iconPosition="start"
              label="Geral"
            />
            <Tab
              icon={<CreditCard size={18} />}
              iconPosition="start"
              label="Planos e Cobrança"
            />
            <Tab
              icon={<User size={18} />}
              iconPosition="start"
              label="Perfil"
            />
            <Tab
              icon={<Shield size={18} />}
              iconPosition="start"
              label="Segurança"
            />
          </Tabs>
        </Box>

        {/* --- ABA GERAL --- */}
        <CustomTabPanel value={value} index={0}>
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

        {/* --- ABA PLANOS E COBRANÇA --- */}
        <CustomTabPanel value={value} index={1}>
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
                          tenant?.subscription?.status === "trialing"
                            ? "PERÍODO DE TESTE"
                            : "ATIVO"
                        }
                        color={
                          tenant?.subscription?.status === "trialing"
                            ? "secondary"
                            : "success"
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
                            plano para continuar usando o Petshop Manager.
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    <Divider />

                    {tenant?.subscription?.plan?.code === "FREE_TRIAL" && (
                      <Box>
                        <Typography variant="h6" fontWeight={800} gutterBottom>
                          Faça o Upgrade agora
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mb: 3 }}
                        >
                          Desbloqueie todos os recursos, clientes ilimitados e
                          suporte prioritário.
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={() => setOpenCheckout(true)}
                          startIcon={<TrendingUp size={18} />}
                          sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                        >
                          Assinar Plano Mensal (R$ 99,90)
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
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(0,0,0,0.02)",
                            border: "1px dashed rgba(0,0,0,0.1)",
                            mb: 2,
                          }}
                        >
                          <CreditCard size={24} color="gray" />
                          <Typography variant="body2" color="text.primary">
                            Nenhum cartão cadastrado.
                          </Typography>
                        </Stack>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<CreditCard size={18} />}
                          onClick={() => setOpenCheckout(true)}
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
                      "O Petshop Manager mudou a forma como gerencio meu banho e
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
        </CustomTabPanel>

        {/* --- ABA PERFIL --- */}
        <CustomTabPanel value={value} index={2}>
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
                    {user?.role?.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Button variant="outlined" sx={{ alignSelf: "flex-start" }}>
                Alterar Senha
              </Button>
            </Stack>
          </Paper>
        </CustomTabPanel>
      </Stack>

      {/* --- MODAL DE CHECKOUT SIMULADO --- */}
      <Modal
        open={openCheckout}
        onClose={() => !upgrading && setOpenCheckout(false)}
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
              width: { xs: "90%", sm: 450 },
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
                  Checkout Seguro
                </Typography>
              </Stack>
              <IconButton
                onClick={() => setOpenCheckout(false)}
                sx={{ color: "white" }}
                disabled={upgrading}
              >
                <X size={20} />
              </IconButton>
            </Box>

            <Box sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    PLANO ESCOLHIDO
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" fontWeight={800}>
                      Plano Mensal Profissional
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      color="primary.main"
                    >
                      R$ 99,90
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Cobrado mensalmente. Cancele quando quiser.
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Número do Cartão"
                    placeholder="0000 0000 0000 0000"
                    disabled={upgrading}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      label="Validade"
                      placeholder="MM/AA"
                      disabled={upgrading}
                    />
                    <TextField
                      fullWidth
                      label="CVC"
                      placeholder="123"
                      disabled={upgrading}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Nome no Cartão"
                    placeholder="NOME COMPLETO"
                    disabled={upgrading}
                  />
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={upgrading}
                  onClick={handleUpgrade}
                  sx={{ py: 2, borderRadius: 2, fontWeight: 700, mt: 1 }}
                >
                  {upgrading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Confirmar Assinatura"
                  )}
                </Button>

                <Typography
                  variant="caption"
                  color="text.primary"
                  textAlign="center"
                  display="block"
                >
                  Seus dados estão protegidos por criptografia de ponta a ponta.
                </Typography>
              </Stack>
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
