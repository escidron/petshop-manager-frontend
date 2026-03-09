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
  Divider,
} from "@mui/material";
import {
  PawPrint,
  Menu as MenuIcon,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CustomCard from "../components/Card/CustomCard";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, checking } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const plans = [
    {
      code: "FREE_TRIAL",
      title: "Teste Gratuito",
      price: "R$ 0",
      period: "14 dias",
      description: "Experimente todas as funcionalidades sem compromisso.",
      features: [
        "Acesso completo por 14 dias",
        "Sem necessidade de cartão",
        "Configure em minutos",
        "Suporte incluso",
        "Cancele quando quiser",
      ],
      buttonText: "Começar Grátis",
      popular: false,
    },
    {
      code: "MONTHLY",
      title: "Plano Mensal",
      price: "R$ 99,90",
      period: "por mês",
      description: "A solução completa para o seu negócio crescer.",
      features: [
        "Clientes e Pets ilimitados",
        "Agenda inteligente",
        "Controle financeiro total",
        "Relatórios e métricas",
        "Suporte prioritário",
        "Atualizações contínuas",
      ],
      buttonText: "Assinar Agora",
      popular: true,
    },
  ];

  const features = [
    {
      icon: <Users size={32} />,
      title: "Clientes & Pets",
      description:
        "Gestão completa e intuitiva de todos os seus contatos e seus companheiros.",
    },
    {
      icon: <Calendar size={32} />,
      title: "Agenda Inteligente",
      description:
        "Controle seus horários de forma simples e evite conflitos de agendamento.",
    },
    {
      icon: <Wallet size={32} />,
      title: "Gestão Financeira",
      description:
        "Mantenha o fluxo de caixa sob controle com relatórios detalhados.",
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "Segurança Total",
      description:
        "Seus dados e de seus clientes protegidos com tecnologia de ponta.",
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PawPrint style={{ color: "white" }} size={24} />
              </Box>
              <Typography
                variant="h5"
                fontWeight="800"
                sx={{
                  color: "primary.main",
                  letterSpacing: -0.5,
                  fontSize: { xs: "1.2rem", md: "1.5rem" },
                }}
              >
                Petshop Manager
              </Typography>
            </Stack>

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
                      onClick={() => navigate("/signup")}
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
          pt: { xs: 8, md: 15 },
          pb: { xs: 8, md: 20 },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={8}
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
                  mb: 3,
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
                  fontSize: { xs: "2.8rem", md: "4.5rem" },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 3,
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
                variant="h5"
                sx={{
                  mb: 5,
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
                  endIcon={<ArrowRight />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: "1.1rem",
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    boxShadow: "0 10px 20px -5px rgba(49, 52, 133, 0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Começar agora — É grátis
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: "1.1rem",
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
                  height: 600,
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
                  flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 20%" },
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

      {/* Pricing Section */}
      <Box id="pricing" sx={{ py: 15 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, letterSpacing: -1 }}
            >
              Planos Simples e Transparentes
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "text.primary",
                opacity: 0.6,
                mt: 2,
                fontWeight: 400,
              }}
            >
              Sem taxas escondidas. Cancele quando quiser.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 4,
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            {plans.map((plan, index) => (
              <Box key={index} sx={{ flex: 1, maxWidth: 450 }}>
                <CustomCard
                  sx={{
                    height: "100%",
                    p: 0,
                    borderRadius: 5,
                    overflow: "hidden",
                    border: plan.popular ? "2px solid" : "1px solid",
                    borderColor: plan.popular ? "primary.main" : "divider",
                    boxShadow: plan.popular
                      ? "0 20px 40px -10px rgba(49, 52, 133, 0.2)"
                      : "none",
                    position: "relative",
                    transition: "all 0.3s",
                    "&:hover": {
                      boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                      transform: "scale(1.02)",
                    },
                  }}
                >
                  {plan.popular && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        bgcolor: "primary.main",
                        color: "white",
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                      }}
                    >
                      RECOMENDADO
                    </Box>
                  )}
                  <Box sx={{ p: 5 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ mb: 1 }}>
                      {plan.title}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "baseline", mb: 2 }}
                    >
                      <Typography variant="h3" fontWeight="900" color="primary">
                        {plan.price}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ ml: 1, opacity: 0.6 }}
                      >
                        {plan.period}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 4, color: "text.primary", opacity: 0.7 }}
                    >
                      {plan.description}
                    </Typography>

                    <Divider sx={{ mb: 4 }} />

                    <Stack spacing={2} sx={{ mb: 5 }}>
                      {plan.features.map((feature, fIndex) => (
                        <Stack
                          direction="row"
                          spacing={1.5}
                          key={fIndex}
                          alignItems="center"
                        >
                          <CheckCircle2
                            size={20}
                            color={theme.palette.success.main}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {feature}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      fullWidth
                      variant={plan.popular ? "contained" : "outlined"}
                      size="large"
                      onClick={() =>
                        navigate(`/signup?plan=${plan.code}&step=2`)
                      }
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: "1rem",
                      }}
                    >
                      {plan.buttonText}
                    </Button>
                  </Box>
                </CustomCard>
              </Box>
            ))}
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
            onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
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
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 3 }}
              >
                <Box
                  sx={{ bgcolor: "primary.main", p: 0.5, borderRadius: 1.5 }}
                >
                  <PawPrint style={{ color: "white" }} size={20} />
                </Box>
                <Typography variant="h6" fontWeight="800">
                  Petshop Manager
                </Typography>
              </Stack>
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
                  href="#"
                  underline="none"
                  color="text.primary"
                  sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                >
                  Segurança
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
              © {new Date().getFullYear()} Petshop Manager Ltda. CNPJ
              00.000.000/0001-00. Feito com ❤️ para pets.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
