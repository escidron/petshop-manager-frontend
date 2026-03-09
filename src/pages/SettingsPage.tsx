import React, { useState } from "react";
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
} from "@mui/material";
import {
  Settings,
  CreditCard,
  User,
  Shield,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import dayjs from "dayjs";

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
  const [value, setValue] = useState(0);
  const { tenant, user } = useAuth();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const getTrialDays = () => {
    if (!tenant?.subscription?.trial_ends_at) return 0;
    const expiryDate = dayjs(tenant.subscription.trial_ends_at);
    // Round up to include the current day
    const daysLeft = expiryDate.diff(dayjs(), "day") + 1;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const trialDays = getTrialDays();

  return (
    <Box sx={{ maxWidth: 1000, margin: "0 auto" }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary.main">
            Configurações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie as preferências da sua conta, empresa e assinaturas.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="primary"
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
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Informações da Empresa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
            <Grid item xs={12} md={7}>
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
                            color: "secondary.main",
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
                        color="text.secondary"
                        sx={{ mb: 3 }}
                      >
                        Desbloqueie todos os recursos, clientes ilimitados e
                        suporte prioritário.
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<TrendingUp size={18} />}
                        sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                      >
                        Mudar para Plano Mensal (R$ 99,90)
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
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Nenhum cartão cadastrado.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CreditCard size={18} />}
                  >
                    Adicionar Cartão
                  </Button>
                </Paper>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
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
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      "O Petshop Manager mudou a forma como gerencio meu banho e
                      tosa. Economizo pelo menos 5h por semana."
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1, fontWeight: 700 }}
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
                  <Typography variant="body2" color="text.secondary">
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
    </Box>
  );
};

export default SettingsPage;
