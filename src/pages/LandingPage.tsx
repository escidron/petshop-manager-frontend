import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Link,
  IconButton,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  TrendingUp,
  Package,
  History,
  Bell,
  Layers,
  Calendar,
  Gift,
  Info,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LegalDialog from "../components/LegalDialog";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, checking } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: "terms" | "privacy" }>({
    open: false,
    type: "terms",
  });
  const [selectedWaPackage, setSelectedWaPackage] = useState<string | null>(null);

  const whatsappPackages = [
    {
      id: "200",
      count: "200",
      label: "mensagens / mês",
      price: "R$ 37,90",
      priceNum: 37.9,
      period: "/mês",
      popular: false,
    },
    {
      id: "500",
      count: "500",
      label: "mensagens / mês",
      price: "R$ 69,90",
      priceNum: 69.9,
      period: "/mês",
      popular: false,
    },
    {
      id: "1000",
      count: "1.000",
      label: "mensagens / mês",
      price: "R$ 119,90",
      priceNum: 119.9,
      period: "/mês",
      popular: true,
    },
    {
      id: "2000",
      count: "2.000",
      label: "mensagens / mês",
      price: "R$ 199,90",
      priceNum: 199.9,
      period: "/mês",
      popular: false,
    },
  ];

  const selectedPkgData = whatsappPackages.find((p) => p.id === selectedWaPackage);

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const features = [
    {
      icon: <MessageCircle size={32} />,
      title: "Automação via WhatsApp",
      description:
        "Seus clientes agendam e recebem confirmações automáticas pelo Zap. Reduza faltas em até 40%.",
    },
    {
      icon: <Package size={32} />,
      title: "Estoque Inteligente",
      description:
        "Cálculo automático de insumos: o sistema dá baixa no shampoo e condicionador conforme o serviço realizado.",
    },
    {
      icon: <TrendingUp size={32} />,
      title: "Financeiro Estratégico",
      description:
        "DRE e fluxo de caixa automáticos. Saiba exatamente qual serviço dá mais lucro para sua petshop.",
    },
    {
      icon: <History size={32} />,
      title: "Histórico & Prontuário",
      description:
        "Fotos, alergias e tratamentos anteriores sempre à mão. Um atendimento personalizado que encanta os tutores.",
    },
    {
      icon: <Bell size={32} />,
      title: "Lembretes de Vacina",
      description:
        "O sistema avisa você e seu cliente quando vacinas e desparasitantes estão próximos de vencer.",
    },
    {
      icon: <Layers size={32} />,
      title: "Gestão de Pacotes",
      description:
        "Crie pacotes de banho e tosa recorrentes com controle automático de sessões restantes.",
    },
  ];

  return (
    <Box
      sx={{ bgcolor: "#F8FAFC", color: "text.primary", overflowX: "hidden" }}
    >
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{ justifyContent: "space-between", height: 80 }}
          >
            <img src="/logo_dark.png" alt="PetControle" height={40} />

            {!isMobile && (
              <Stack direction="row" spacing={4} alignItems="center">
                <Link
                  href="#features"
                  underline="none"
                  color="text.primary"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Recursos
                </Link>
                <Link
                  href="#pricing"
                  underline="none"
                  color="text.primary"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  Planos
                </Link>
                {!checking && user ? (
                  <Button
                    variant="contained"
                    onClick={() => navigate("/dashboard")}
                    sx={{
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Meu Dashboard
                  </Button>
                ) : (
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="text"
                      onClick={() => navigate("/login")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: "text.primary",
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        boxShadow: "0 4px 14px 0 rgba(49, 52, 133, 0.39)",
                      }}
                    >
                      Criar Conta
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}

            {isMobile && (
              <IconButton color="primary">
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          pt: { xs: 6, md: 11 },
          pb: { xs: 6, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={5}
            alignItems="center"
          >
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  bgcolor: "primary.light",
                  color: "white",
                  px: 2,
                  py: 0.5,
                  borderRadius: 10,
                  mb: 2,
                  opacity: 0.9,
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  A GESTÃO QUE SEU NEGÓCIO MERECE
                </Typography>
              </Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.2rem", md: "3.2rem" },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 2,
                  color: "primary.main",
                  letterSpacing: -1.5,
                }}
              >
                Gestão completa para o seu{" "}
                <Box component="span" sx={{ color: "success.main" }}>
                  Petshop
                </Box>{" "}
                crescer.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: "text.primary",
                  opacity: 0.8,
                  lineHeight: 1.6,
                  fontWeight: 400,
                  maxWidth: 600,
                }}
              >
                Pare de perder tempo com planilhas. Automatize seu agendamento,
                controle seu financeiro e foque no que importa: os pets.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
                  endIcon={<ArrowRight />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "0 10px 20px -5px rgba(49, 52, 133, 0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Começar agora, é grátis
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    borderWidth: 2,
                    "&:hover": { borderWidth: 2 },
                    whiteSpace: "nowrap",
                  }}
                >
                  Ver funcionalidades
                </Button>
              </Stack>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: { xs: "none", md: "block" },
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -50,
                  right: -50,
                  width: 300,
                  height: 300,
                  bgcolor: "primary.main",
                  borderRadius: "50%",
                  filter: "blur(100px)",
                  opacity: 0.1,
                  zIndex: -1,
                }}
              />
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800"
                alt="Petshop"
                sx={{
                  width: "100%",
                  height: 500,
                  objectFit: "cover",
                  borderRadius: 6,
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  transform: "rotate(2deg)",
                }}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: 15, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 10 }}>
            <Typography
              variant="overline"
              color="primary.main"
              fontWeight="800"
              letterSpacing={2}
            >
              PODER NA PALMA DA SUA MÃO
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, mt: 1, letterSpacing: -1 }}
            >
              Tudo o que você precisa para decolar
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              justifyContent: "center",
            }}
          >
            {features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 30%" },
                  p: 4,
                  borderRadius: 4,
                  transition: "all 0.3s",
                  "&:hover": {
                    bgcolor: "#F8FAFC",
                    transform: "translateY(-10px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "primary.light",
                    color: "white",
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    boxShadow: "0 10px 15px -3px rgba(49, 52, 133, 0.2)",
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.primary", opacity: 0.7 }}
                >
                  {feature.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Pricing & Packages Section */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 12 }, bgcolor: "#F8FAFC" }}>
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                bgcolor: "#EEF2FF",
                color: "#313485",
                px: 2.2,
                py: 0.6,
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.8px",
                mb: 2,
                border: "1px solid #C7D2FE",
              }}
            >
              PLANOS E PACOTES
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "1.9rem", sm: "2.5rem", md: "3rem" },
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#0F172A",
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              Seu petshop sempre lembrado.
              <br />
              Plano completo +{" "}
              <Box component="span" sx={{ color: "#16A34A" }}>
                mensagens
              </Box>{" "}
              que fazem a diferença.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748B",
                fontSize: { xs: "0.95rem", md: "1.05rem" },
                maxWidth: 640,
                mx: "auto",
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              O PetControle Pro é o plano do sistema. Os pacotes de mensagens WhatsApp
              são opcionais e cobrados separadamente.
            </Typography>
          </Box>

          {/* Main 2-Column Cards Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 3, md: 4 },
              alignItems: "stretch",
              position: "relative",
            }}
          >
            {/* Left Card: Plano do Sistema */}
            <Box
              sx={{
                bgcolor: "white",
                borderRadius: "24px",
                p: { xs: 3, sm: 4.5 },
                border: "1.5px solid #E2E8F0",
                boxShadow: "0 10px 30px -10px rgba(49, 52, 133, 0.08), 0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Top Header Badge & Icon */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Box
                  sx={{
                    bgcolor: "#EEF2FF",
                    color: "#313485",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    border: "1px solid #C7D2FE",
                  }}
                >
                  PLANO DO SISTEMA
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#313485",
                  }}
                >
                  <Calendar size={22} strokeWidth={2.2} />
                </Box>
              </Box>

              {/* Title & Description */}
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
                PetControle Pro
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.92rem", lineHeight: 1.5, mb: 2.5 }}>
                Tudo que você precisa para gerenciar seu petshop com eficiência.
              </Typography>

              {/* Price */}
              <Box sx={{ display: "flex", alignItems: "baseline", mb: 2 }}>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", mr: 0.5 }}>
                  R$
                </Typography>
                <Typography sx={{ fontSize: { xs: "2.4rem", sm: "2.8rem" }, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                  99,90
                </Typography>
                <Typography sx={{ fontSize: "0.95rem", color: "#64748B", fontWeight: 500, ml: 1 }}>
                  /mês
                </Typography>
              </Box>

              {/* Gift / Promo Highlight */}
              <Box
                sx={{
                  bgcolor: "#EEF2FF",
                  color: "#313485",
                  px: 2,
                  py: 0.8,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 3,
                  width: "fit-content",
                  border: "1px solid #C7D2FE",
                }}
              >
                <Gift size={16} strokeWidth={2.5} />
                <Typography sx={{ fontSize: "0.88rem", fontWeight: 800 }}>
                  6 primeiros meses grátis!
                </Typography>
              </Box>

              {/* Features Checklist */}
              <Stack spacing={1.6} sx={{ mb: 3.5, flexGrow: 1 }}>
                {[
                  "Agenda de agendamentos",
                  "Clientes e pets",
                  "Relatórios completos",
                  "Caixa e financeiro",
                  "Suporte por e-mail",
                ].map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircle2 size={18} color="#313485" strokeWidth={2.5} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* Notice Info Box */}
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  p: 2,
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start",
                  mt: "auto",
                }}
              >
                <Info size={18} color="#313485" style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5, fontWeight: 500 }}>
                  Após os 6 primeiros meses, o plano será cobrado normalmente por R$ 99,90/mês.
                </Typography>
              </Box>
            </Box>

            {/* Plus (+) Badge in between the cards */}
            <Box
              sx={{
                position: { xs: "relative", md: "absolute" },
                left: { md: "50%" },
                top: { md: "50%" },
                transform: { md: "translate(-50%, -50%)" },
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                my: { xs: -1, md: 0 },
                gridColumn: { xs: "1 / -1", md: "auto" },
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  width: { xs: 40, md: 48 },
                  height: { xs: 40, md: 48 },
                  borderRadius: "50%",
                  bgcolor: "white",
                  border: "2.5px solid #E2E8F0",
                  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#313485",
                }}
              >
                <Plus size={24} strokeWidth={3.2} />
              </Box>
            </Box>

            {/* Right Card: Pacotes de Mensagens WhatsApp */}
            <Box
              sx={{
                bgcolor: "white",
                borderRadius: "24px",
                p: { xs: 3, sm: 4.5 },
                border: "1.5px solid #86EFAC",
                boxShadow: "0 10px 30px -10px rgba(37, 211, 102, 0.12), 0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Top Header Badge & Icon */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Box
                  sx={{
                    bgcolor: "#DCFCE7",
                    color: "#15803D",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  PACOTES DE MENSAGENS WHATSAPP
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: "#F0FDF4",
                    border: "1px solid #DCFCE7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#25D366",
                  }}
                >
                  <MessageCircle size={22} strokeWidth={2.2} />
                </Box>
              </Box>

              {/* Title & Description */}
              <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
                Mensagens automáticas
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.92rem", lineHeight: 1.5, mb: 2 }}>
                Envie lembretes de agendamentos de forma automática pelo WhatsApp.
              </Typography>

              {/* Sub-banner line */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                <MessageSquare size={16} color="#16A34A" strokeWidth={2.5} />
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  Pacotes opcionais. Adicione ao seu plano quando quiser.
                </Typography>
              </Box>

              {/* WhatsApp Package Options */}
              <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
                {whatsappPackages.map((pkg) => {
                  const isSelected = selectedWaPackage === pkg.id;
                  return (
                    <Box
                      key={pkg.id}
                      onClick={() => setSelectedWaPackage((prev) => (prev === pkg.id ? null : pkg.id))}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: { xs: 1.5, sm: 1.8 },
                        borderRadius: "14px",
                        border: "1.5px solid",
                        borderColor: isSelected ? "#16A34A" : "#E2E8F0",
                        bgcolor: isSelected ? "#F0FDF4" : "white",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: isSelected ? "#16A34A" : "#CBD5E1",
                          bgcolor: isSelected ? "#F0FDF4" : "#F8FAFC",
                        },
                      }}
                    >
                      {/* Left: Count, Label & Popular Badge */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                          {pkg.count}
                        </Typography>
                        <Typography sx={{ fontWeight: 500, color: "#64748B", fontSize: "0.9rem" }}>
                          {pkg.label}
                        </Typography>
                        {pkg.popular && (
                          <Box
                            sx={{
                              bgcolor: "#16A34A",
                              color: "white",
                              px: 1.2,
                              py: 0.2,
                              borderRadius: "6px",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              letterSpacing: "0.3px",
                            }}
                          >
                            Mais popular
                          </Box>
                        )}
                      </Box>

                      {/* Right: Price & Radio */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3 }}>
                          <Typography sx={{ fontWeight: 800, color: "#16A34A", fontSize: "0.95rem" }}>
                            {pkg.price}
                          </Typography>
                          <Typography sx={{ fontWeight: 500, color: "#64748B", fontSize: "0.78rem" }}>
                            {pkg.period}
                          </Typography>
                        </Box>

                        {/* Radio Indicator */}
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: isSelected ? "#16A34A" : "#CBD5E1",
                            bgcolor: isSelected ? "#16A34A" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isSelected && (
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                bgcolor: "white",
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>

              {/* Notice Info Box */}
              <Box
                sx={{
                  bgcolor: "#F0FDF4",
                  border: "1px solid #DCFCE7",
                  borderRadius: "14px",
                  p: 2,
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start",
                  mt: "auto",
                }}
              >
                <Info size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.82rem", color: "#166534", lineHeight: 1.5, fontWeight: 500 }}>
                  Você só paga pelos pacotes que escolher. Eles são cobrados separadamente do plano PetControle Pro.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Simple Compact Summary Card with Both Comparison Rows */}
          <Box
            sx={{
              mt: { xs: 3.5, md: 4 },
              bgcolor: "white",
              border: "1.5px solid #E2E8F0",
              borderRadius: "20px",
              p: { xs: 2, sm: 2.5 },
              boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Row 1: Sem Pacote (Apenas Sistema) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: { xs: 1.5, md: 2.5 },
                p: { xs: 1.5, sm: 1.8 },
                borderRadius: "14px",
                bgcolor: selectedWaPackage === null ? "#F8FAFC" : "transparent",
                border: selectedWaPackage === null ? "1.5px solid #CBD5E1" : "1px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              {/* Left explanation */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    bgcolor: "#EEF2FF",
                    border: "1px solid #C7D2FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#313485",
                    mt: 0.2,
                  }}
                >
                  <Calendar size={18} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", lineHeight: 1.3 }}>
                    Sem pacote de WhatsApp selecionado (Apenas Sistema)
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748B", mt: 0.3, lineHeight: 1.4 }}>
                    Você <strong>não paga nada nos primeiros 6 meses</strong> (R$ 0,00). Após o período gratuito, o sistema será <strong>R$ 99,90/mês</strong>.
                  </Typography>
                </Box>
              </Box>

              {/* Right: Clean Price Pill Tags */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  flexShrink: 0,
                  bgcolor: selectedWaPackage === null ? "white" : "#F8FAFC",
                  p: { xs: 1.2, sm: 1.5 },
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                }}
              >
                {/* 1st to 6th month */}
                <Box sx={{ minWidth: 95 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    1º ao 6º mês
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#15803D", fontSize: { xs: "1.1rem", sm: "1.2rem" }, lineHeight: 1.2 }}>
                    R$ 0,00
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#16A34A", fontWeight: 700 }}>
                    100% Gratuito
                  </Typography>
                </Box>

                <Box sx={{ width: "1px", height: "32px", bgcolor: "#CBD5E1" }} />

                {/* 7th month onwards */}
                <Box sx={{ minWidth: 105 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    A partir do 7º mês
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.05rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
                    R$ 99,90
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B" }}>
                    R$ 99,90 normal
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ height: "1px", bgcolor: "#F1F5F9", mx: 1 }} />

            {/* Row 2: Com Pacote WhatsApp */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: { xs: 1.5, md: 2.5 },
                p: { xs: 1.5, sm: 1.8 },
                borderRadius: "14px",
                bgcolor: selectedPkgData ? "#F0FDF4" : "#F8FAFC",
                border: "1px solid",
                borderColor: selectedPkgData ? "#86EFAC" : "#E2E8F0",
                transition: "all 0.2s ease",
              }}
            >
              {/* Left explanation */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    bgcolor: "#DCFCE7",
                    border: "1px solid #BBF7D0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#16A34A",
                    mt: 0.2,
                  }}
                >
                  <MessageCircle size={18} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", lineHeight: 1.3 }}>
                    {selectedPkgData ? (
                      <>
                        Com pacote de WhatsApp ({selectedPkgData.count} msgs/mês selecionado)
                      </>
                    ) : (
                      <>
                        Com pacote de WhatsApp (Exemplo: 500 msgs/mês)
                      </>
                    )}
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748B", mt: 0.3, lineHeight: 1.4 }}>
                    O sistema continua <strong>100% grátis por 6 meses</strong>. Você paga apenas o pacote de mensagens (
                    <strong>{selectedPkgData ? selectedPkgData.price : "R$ 69,90"}/mês</strong>) durante esse período.
                  </Typography>
                </Box>
              </Box>

              {/* Right: Clean Price Pill Tags */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  flexShrink: 0,
                  bgcolor: "white",
                  p: { xs: 1.2, sm: 1.5 },
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: selectedPkgData ? "#BBF7D0" : "#E2E8F0",
                }}
              >
                {/* 1st to 6th month */}
                <Box sx={{ minWidth: 95 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    1º ao 6º mês
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: "#16A34A", fontSize: { xs: "1.1rem", sm: "1.2rem" }, lineHeight: 1.2 }}>
                    {selectedPkgData ? selectedPkgData.price : "R$ 69,90"}
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#15803D", fontWeight: 700 }}>
                    Sistema Grátis + Zap
                  </Typography>
                </Box>

                <Box sx={{ width: "1px", height: "32px", bgcolor: "#CBD5E1" }} />

                {/* 7th month onwards */}
                <Box sx={{ minWidth: 105 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    A partir do 7º mês
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.05rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
                    R$ {selectedPkgData ? formatCurrency(99.9 + selectedPkgData.priceNum) : "169,80"}
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B" }}>
                    {selectedPkgData ? `R$ 99,90 + ${selectedPkgData.price}` : "R$ 99,90 + R$ 69,90"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Bottom CTA Row */}
          <Box
            sx={{
              mt: { xs: 5, md: 6 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 2, sm: 3 },
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: "1rem", sm: "1.1rem" },
                fontWeight: 700,
                color: "#1E293B",
              }}
            >
              Pronto para simplificar a gestão do seu petshop?
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() =>
                navigate(
                  `/signup?plan=FREE_TRIAL&step=2${selectedWaPackage ? `&package=${selectedWaPackage}` : ""}`
                )
              }
              endIcon={<ArrowRight size={18} />}
              sx={{
                bgcolor: "#313485",
                color: "white",
                px: 3.5,
                py: 1.4,
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "0 10px 25px -5px rgba(49, 52, 133, 0.4)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#24276A",
                  transform: "translateY(-2px)",
                  boxShadow: "0 14px 28px -5px rgba(49, 52, 133, 0.5)",
                },
              }}
            >
              Começar agora
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 15,
          bgcolor: "primary.main",
          color: "white",
          textAlign: "center",
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h3" fontWeight="900" sx={{ mb: 3 }}>
            Pronto para transformar seu negócio?
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 5, opacity: 0.8, fontWeight: 400 }}
          >
            Junte-se a centenas de petshops que já estão economizando tempo e
            dinheiro.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() =>
              navigate(
                `/signup?plan=FREE_TRIAL&step=2${selectedWaPackage ? `&package=${selectedWaPackage}` : ""}`
              )
            }
            sx={{
              bgcolor: "white",
              color: "primary.main",
              px: 6,
              py: 2,
              borderRadius: 2.5,
              fontWeight: 800,
              fontSize: "1.2rem",
              "&:hover": { bgcolor: "secondary.main" },
            }}
          >
            Começar Grátis Agora
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 10,
          bgcolor: "white",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} spacing={8}>
            <Box sx={{ flex: 2 }}>
              <Box sx={{ mb: 3 }}>
                <img src="/logo_dark.png" alt="PetControle" height={36} />
              </Box>
              <Typography
                variant="body1"
                sx={{ color: "text.primary", opacity: 0.6, lineHeight: 1.8 }}
              >
                A plataforma líder em gestão para o mercado pet no Brasil.
                Simples, poderosa e feita para você.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 3 }}>
                Produto
              </Typography>
              <Stack spacing={2}>
                <Link
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Recursos
                </Link>
                <Link
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Preços
                </Link>
                <Link
                  component="button"
                  onClick={() => setLegalModal({ open: true, type: "terms" })}
                  underline="none"
                  color="inherit"
                  sx={{ 
                    opacity: 0.6, 
                    "&:hover": { opacity: 1 }, 
                    textAlign: "left",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    fontWeight: "inherit"
                  }}
                >
                  Termos de Uso
                </Link>
                <Link
                  component="button"
                  onClick={() => setLegalModal({ open: true, type: "privacy" })}
                  underline="none"
                  color="inherit"
                  sx={{ 
                    opacity: 0.6, 
                    "&:hover": { opacity: 1 }, 
                    textAlign: "left",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    fontWeight: "inherit"
                  }}
                >
                  Privacidade
                </Link>
              </Stack>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 3 }}>
                Empresa
              </Typography>
              <Stack spacing={2}>
                <Link
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Sobre
                </Link>
                <Link
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Blog
                </Link>
                <Link
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Contato
                </Link>
              </Stack>
            </Box>
            <Box sx={{ flex: 2 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 3 }}>
                Suporte
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.6 }}>
                Precisa de ajuda? Fale com nosso time de especialistas.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
              >
                Central de Ajuda
              </Button>
            </Box>
          </Stack>
          <Box
            sx={{
              mt: 10,
              pt: 5,
              borderTop: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              © {new Date().getFullYear()} PetControle Ltda. CNPJ
              00.000.000/0001-00. Feito com ❤️ para pets.
            </Typography>
          </Box>
        </Container>
      </Box>
      <LegalDialog
        open={legalModal.open}
        onClose={() => setLegalModal((prev) => ({ ...prev, open: false }))}
        type={legalModal.type}
      />
    </Box>
  );
};

export default LandingPage;
