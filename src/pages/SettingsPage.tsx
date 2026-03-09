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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

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
  const [upgrading, setUpgrading] = useState(false);
  const { tenant, user } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
                        {tenant?.phone || "Não informado"}
                      </Typography>
                    </Box>
                    <Box>
                      <Button variant="outlined" size="small">
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
                  </Stack>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Método de Pagamento
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ mb: 2 }}
                  >
                    Nenhum cartão cadastrado.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CreditCard size={18} />}
                    onClick={() => setOpenCheckout(true)}
                  >
                    Adicionar Cartão
                  </Button>
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
    </Box>
  );
};

export default SettingsPage;
