import { useState, useEffect } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  Menu as MenuIcon,
  X,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Gift,
  Info,
  MessageSquare,
  Plus,
  Database,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Receipt,
  PackageCheck,
  Boxes,
  Percent,
  ChevronDown,
  Check,
  LayoutDashboard,
  ZoomIn,
  Users,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LegalDialog from "../components/LegalDialog";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, checking } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [legalModal, setLegalModal] = useState<{ open: boolean; type: "terms" | "privacy" }>({
    open: false,
    type: "terms",
  });
  const [selectedWaPackage, setSelectedWaPackage] = useState<string | null>(null);
  const [activeScreenTab, setActiveScreenTab] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | false>("faq1");

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

  // 6 Recursos Reais
  const realFeatures = [
    {
      icon: <Calendar size={28} />,
      title: "Agenda Operacional & Banho/Tosa",
      description:
        "Visão por profissional (tosador/banhista), controle de status do pet em tempo real (aguardando, em banho, pronto), agendamentos recorrentes e lista de espera.",
      badge: "Mais Produtividade",
    },
    {
      icon: <Receipt size={28} />,
      title: "PDV & Comandas do Dia",
      description:
        "Abertura automática de comandas por agendamento, inclusão rápida de produtos e serviços, taxas de maquininha configuradas e cancelamento seguro com rollback de estoque e pacotes.",
      badge: "Sem Furos de Caixa",
    },
    {
      icon: <PackageCheck size={28} />,
      title: "Gestão de Pacotes de Banho",
      description:
        "Venda pacotes de 4 ou 8 banhos com controle automático de sessões restantes direto na comanda. Fidelize tutores e garanta receita previsível.",
      badge: "Fidelização",
    },
    {
      icon: <Boxes size={28} />,
      title: "Estoque & Baixa Automática de Insumos",
      description:
        "O sistema dá baixa automática de shampoo e condicionador conforme o porte do pet e o serviço finalizado. Alertas de reposição e estoque mínimo.",
      badge: "Controle de Perdas",
    },
    {
      icon: <Percent size={28} />,
      title: "Comissões Automáticas de Equipe",
      description:
        "Cálculo exato de comissões por colaborador, serviço ou produto vendido. Relatórios de fechamento em um clique sem planilhas paralelas no fim do mês.",
      badge: "Equipe Motivada",
    },
    {
      icon: <MessageCircle size={28} />,
      title: "Automação de WhatsApp",
      description:
        "Confirmações e lembretes automáticos enviados no Zap do tutor antes do horário e aviso quando o pet estiver cheiroso e pronto para ser retirado.",
      badge: "-40% Faltas (No-show)",
    },
  ];

  // 6 Telas Principais do Sistema (Showcase com suporte a imagens reais / placeholders)
  const systemScreens = [
    {
      id: "dashboard",
      tabTitle: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      badge: "Visão 360º",
      headline: "Dashboard: Visão Operacional do Dia e Faturamento em Tempo Real",
      description:
        "Acompanhe agendamentos por status, comandas abertas e fila de espera na rotina da sua equipe. Na visão do gestor/proprietário, visualize o faturamento do dia em tempo real.",
      bullets: [
        "Visão rápida de todos os agendamentos do dia por status (confirmados, em atendimento e finalizados)",
        "Comandas em aberto e inclusão ágil de clientes na fila de espera",
        "Acompanhamento de faturamento do dia em tempo real exclusivo na visão do proprietário",
      ],
      imageSrc: "/screenshots/dashboard.png",
      urlBar: "sistemadatapet.com.br/dashboard",
      mockupData: {
        title: "Painel Geral do Petshop",
        kpis: [
          { label: "Agendamentos Hoje", val: "8 pets", change: "7 confirmados", color: "#3B82F6" },
          { label: "Comandas Abertas", val: "3 comandas", change: "R$ 325,00 a receber", color: "#F59E0B" },
          { label: "Faturamento do Dia", val: "R$ 370,00", change: "Visão do proprietário", color: "#10B981" },
        ],
      },
    },
    {
      id: "caixa",
      tabTitle: "Caixa",
      icon: <Receipt size={18} />,
      badge: "Frente de Caixa",
      headline: "Frente de Caixa: Comandas Integradas, Cancelamento Seguro e Ficha do Cliente",
      description:
        "Comandas vinculadas automaticamente aos agendamentos, visão centralizada de todos os atendimentos em aberto, cancelamento seguro em um só lugar e consulta das informações do cliente (como pacotes ativos), facilitando a venda de itens complementares.",
      bullets: [
        "Comandas geradas e vinculadas automaticamente a partir dos agendamentos",
        "Cancelamento de vendas em um só lugar com rollback automático de estoque e créditos",
        "Visão de todos os agendamentos em aberto e dados do cliente para oferecer produtos e serviços que ele ainda não possui",
      ],
      imageSrc: "/screenshots/caixa.png",
      urlBar: "sistemadatapet.com.br/pos",
      mockupData: {
        title: "Frente de Caixa / PDV",
        kpis: [
          { label: "Total em Caixa Hoje", val: "R$ 3.420,00", change: "26 vendas finalizadas", color: "#10B981" },
          { label: "Comandas Abertas", val: "4 atendimentos", change: "Vinculadas à agenda", color: "#F59E0B" },
          { label: "Cancelamento Seguro", val: "1 clique", change: "Estorno automático", color: "#6366F1" },
        ],
      },
    },
    {
      id: "clientes",
      tabTitle: "Detalhes do Cliente",
      icon: <Users size={18} />,
      badge: "Ficha do Cliente",
      headline: "Detalhes do Cliente: Cadastro, Pets, Pacotes e Histórico Completo",
      description:
        "Tenha todas as informações do tutor e dos seus pets em uma só tela: dados cadastrais, pets vinculados com suas particularidades, pacotes contratados com controle de sessões e o histórico completo de serviços, pacotes e produtos.",
      bullets: [
        "Cadastro completo do tutor com dados de contato, endereço e preferências",
        "Pets vinculados com porte, raça e observações de banho e cuidados",
        "Pacotes contratados com saldo transparente de banhos restantes",
        "Histórico unificado de todas as compras: serviços realizados, pacotes e produtos",
      ],
      imageSrc: "/screenshots/client_details.png",
      urlBar: "sistemadatapet.com.br/registration/clients/34840",
      mockupData: {
        title: "Ficha do Cliente & Histórico 360º",
        kpis: [
          { label: "Pets Cadastrados", val: "2 pets", change: "Max (Golden) • Trufa (Poodle)", color: "#3B82F6" },
          { label: "Pacote Ativo", val: "3 / 4 banhos", change: "Válido até 30/10", color: "#10B981" },
          { label: "Histórico Total", val: "18 atendimentos", change: "Serviços + Produtos", color: "#F59E0B" },
        ],
      },
    },
    {
      id: "relatorios",
      tabTitle: "Relatórios Gerenciais",
      icon: <BarChart3 size={18} />,
      badge: "Gestão & Extrato",
      headline: "Relatórios Gerenciais: Visão Detalhada do Dia e do Mês, Resumo, Extrato e Comissões",
      description:
        "Entenda em detalhes tudo o que acontece no seu petshop no dia a dia e no consolidado do mês: analise o resumo operacional, extrato completo de transações e formas de pagamento, cálculo automático de comissões da equipe e movimentações de estoque.",
      bullets: [
        "Acompanhamento detalhado do que acontece no dia e no mês com filtros por período e seleção rápida de meses",
        "Abas dedicadas: Resumo financeiro, Extrato completo de vendas, Comissões automáticas e Estoque",
        "Detalhamento de comissões por colaborador e rastreabilidade total das movimentações de estoque",
      ],
      imageSrc: "/screenshots/reports.png",
      urlBar: "sistemadatapet.com.br/reports",
      mockupData: {
        title: "Relatórios Gerenciais & Extrato Completo",
        kpis: [
          { label: "Faturamento no Período", val: "R$ 580,00", change: "8 transações no mês", color: "#10B981" },
          { label: "Ticket Médio", val: "R$ 72,50", change: "Crédito, Débito e PIX", color: "#3B82F6" },
          { label: "Comissões & Estoque", val: "Abas dedicadas", change: "Controle em 1 clique", color: "#F59E0B" },
        ],
      },
    },
    {
      id: "dre",
      tabTitle: "DRE & Financeiro",
      icon: <TrendingUp size={18} />,
      badge: "Exclusivo Data Pet",
      headline: "DRE Contábil com Folha e Vigência Proporcional",
      description: "O único sistema do mercado com Demonstrativo do Resultado do Exercício real: cálculo de dias proporcionais na admissão/saída e provisões automáticas de férias, 13º e encargos.",
      bullets: [
        "Margem líquida real mês a mês sem a ilusão do saldo da gaveta",
        "Vigência proporcional: colaborador admitido em 16/09 recebe rateio exato de 50%",
        "Provisões automáticas de 1/12 de 13º salário, 1/3 de férias, FGTS e INSS",
      ],
      imageSrc: "/screenshots/dre.png",
      urlBar: "sistemadatapet.com.br/managerial/dre",
      mockupData: {
        title: "DRE Consolidado & Folha de Pagamento",
        kpis: [
          { label: "Receita Operacional", val: "R$ 48.500,00", change: "Serviços + Produtos", color: "#10B981" },
          { label: "Folha & Provisões", val: "- R$ 11.250,00", change: "Rateio proporcional", color: "#EF4444" },
          { label: "Lucro Líquido Real", val: "R$ 10.325,00", change: "Margem: 21,3% líquido", color: "#10B981" },
        ],
      },
    },
    {
      id: "resultado_operacional",
      tabTitle: "Resultado Operacional",
      icon: <BarChart3 size={18} />,
      badge: "Produtividade & Volume",
      headline: "Matriz Diária, Produtividade do Banho & Tosa e Comparativo Anual",
      description: "Monitore a esteira de atendimento em tempo real: volume diário de banhos e tosas, estratificação por serviço, dias de pico e comparativo histórico mês a mês com o ano anterior.",
      bullets: [
        "Estratificação de demanda: volume exato por tipo de serviço (Banho, Tosa, Higiênica, Hidratação)",
        "Ritmo diário da esteira: acompanhamento de dias úteis operados e identificação dos sábados de pico",
        "Comparativo anual inteligente: evolução mês a mês do ano atual versus o ano anterior com análise de sazonalidade",
      ],
      imageSrc: "/screenshots/operational_result.png",
      urlBar: "sistemadatapet.com.br/managerial/operational-result",
      mockupData: {
        title: "Resultado Operacional & Produtividade",
        kpis: [
          { label: "Total no Mês", val: "585 atendimentos", change: "21,7 serviços / dia útil", color: "#10B981" },
          { label: "Dia de Maior Movimento", val: "Dia 19 (39 atend.)", change: "Sábado de pico da esteira", color: "#F59E0B" },
          { label: "Crescimento Anual", val: "+29,2% vs 2025", change: "6.238 vs 4.829 serviços", color: "#3B82F6" },
        ],
      },
    },
    {
      id: "contas_pagar_receber",
      tabTitle: "Contas a Pagar e Receber",
      icon: <Wallet size={18} />,
      badge: "Gestão Financeira",
      headline: "Contas a Pagar e Receber: Previsibilidade Total, Conciliação e Controle de Vencimentos",
      description:
        "Controle completo de despesas operacionais, fornecedores de insumos, contas de consumo e recebíveis corporativos a prazo. Acompanhe o saldo projetado, saldo realizado e alertas imediatos de títulos vencidos.",
      bullets: [
        "Controle minucioso de contas a pagar por centro de custo, fornecedor e data de vencimento",
        "Gestão de recebíveis corporativos, vendas faturadas no boleto e cobranças recorrentes",
        "Indicadores em tempo real de saldo projetado, total liquidado e alertas de inadimplência",
      ],
      imageSrc: "/screenshots/bills.png",
      urlBar: "sistemadatapet.com.br/managerial/bills",
      mockupData: {
        title: "Contas a Pagar e Receber",
        kpis: [
          { label: "Total a Pagar", val: "R$ 14.576,28", change: "R$ 6.750,00 já pagos", color: "#EF4444" },
          { label: "Total a Receber", val: "R$ 11.580,00", change: "R$ 6.530,00 recebidos", color: "#10B981" },
          { label: "Títulos Vencidos", val: "1 pendência", change: "Alerta de atraso", color: "#F59E0B" },
        ],
      },
    },
  ];

  // Auto-play suave do carrossel caso o usuário não interaja
  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setActiveScreenTab((prev) => (prev + 1) % systemScreens.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [isCarouselPaused, systemScreens.length]);

  const faqs = [
    {
      id: "faq1",
      question: "Como funciona o 1º mês grátis? Preciso de cartão de crédito no cadastro?",
      answer:
        "Não! Você cria sua conta em menos de 1 minuto sem precisar informar cartão de crédito. Você ganha 30 dias de acesso total e irrestrito ao Data Pet Pro para testar todas as funcionalidades na prática do seu petshop.",
    },
    {
      id: "faq2",
      question: "Como funciona a migração gratuita dos meus dados de outro sistema?",
      answer:
        "Se você já usa outro sistema, planilhas em Excel ou anotações em papel, nossa equipe de suporte cuida de toda a importação dos seus clientes, pets e histórico para o Data Pet sem cobrar nenhum centavo adicional e sem interromper seus atendimentos diários.",
    },
    {
      id: "faq3",
      question: "O que é o DRE e por que ele é diferente de um fluxo de caixa comum?",
      answer:
        "O fluxo de caixa apenas mostra o dinheiro que entrou e saiu na hora. Já o DRE (Demonstrativo do Resultado do Exercício) mostra a realidade contábil do seu petshop: se o seu negócio realmente deu lucro líquido naquele mês, provisionando férias, 13º salário, encargos proporcionais à vigência da sua equipe e custos de insumos.",
    },
    {
      id: "faq4",
      question: "Os pacotes de mensagens de WhatsApp são obrigatórios?",
      answer:
        "Não, são 100% opcionais! Você pode usar o Data Pet Pro com todos os recursos operacionais e financeiros sem contratar pacotes de WhatsApp. Se quiser ativar o disparo automático de lembretes aos clientes, basta escolher o pacote que melhor atende o seu volume mensal.",
    },
    {
      id: "faq5",
      question: "Existe fidelidade ou multa se eu quiser cancelar?",
      answer:
        "Nenhuma fidelidade. Você é livre para cancelar a qualquer momento diretamente pelo seu painel, sem taxas, multas ou burocracia.",
    },
  ];

  const currentScreen = systemScreens[activeScreenTab];

  return (
    <Box sx={{ bgcolor: "#F8FAFC", color: "text.primary", overflowX: "hidden" }}>
      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between", height: 76 }}>
            <Box
              component="img"
              src="/logo_dark.png"
              alt="Data Pet"
              sx={{ height: 38, cursor: "pointer" }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />

            {!isMobile && (
              <Stack direction="row" spacing={3.5} alignItems="center">
                <Link
                  href="#features"
                  underline="none"
                  color="text.primary"
                  sx={{ fontWeight: 600, fontSize: "0.92rem", transition: "color 0.2s", "&:hover": { color: "primary.main" } }}
                >
                  Recursos
                </Link>
                <Link
                  href="#telas"
                  underline="none"
                  color="text.primary"
                  sx={{ fontWeight: 600, fontSize: "0.92rem", transition: "color 0.2s", "&:hover": { color: "primary.main" } }}
                >
                  Telas do Sistema
                </Link>
                <Link
                  href="#migracao"
                  underline="none"
                  color="text.primary"
                  sx={{ fontWeight: 600, fontSize: "0.92rem", transition: "color 0.2s", "&:hover": { color: "primary.main" } }}
                >
                  Migração Gratuita
                </Link>
                <Link
                  href="#pricing"
                  underline="none"
                  color="text.primary"
                  sx={{ fontWeight: 600, fontSize: "0.92rem", transition: "color 0.2s", "&:hover": { color: "primary.main" } }}
                >
                  Planos
                </Link>
                <Link
                  href="#faq"
                  underline="none"
                  color="text.primary"
                  sx={{ fontWeight: 600, fontSize: "0.92rem", transition: "color 0.2s", "&:hover": { color: "primary.main" } }}
                >
                  FAQ
                </Link>

                {!checking && user ? (
                  <Button
                    variant="contained"
                    onClick={() => navigate("/dashboard")}
                    sx={{
                      px: 2.5,
                      py: 0.9,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      boxShadow: "0 4px 14px rgba(49, 52, 133, 0.25)",
                    }}
                  >
                    Meu Dashboard
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                      variant="text"
                      onClick={() => navigate("/login")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: "text.primary",
                        px: 2,
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
                      sx={{
                        px: 2.5,
                        py: 0.9,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: "0.92rem",
                        boxShadow: "0 4px 14px rgba(49, 52, 133, 0.3)",
                      }}
                    >
                      Testar 30 Dias Grátis
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}

            {isMobile && (
              <IconButton color="primary" onClick={() => setMobileDrawerOpen(true)}>
                <MenuIcon size={26} />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, p: 3 } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <img src="/logo_dark.png" alt="Data Pet" height={32} />
          <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
            <X size={20} />
          </IconButton>
        </Box>
        <Stack spacing={2.5}>
          <Link
            href="#features"
            underline="none"
            color="text.primary"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Recursos
          </Link>
          <Link
            href="#telas"
            underline="none"
            color="text.primary"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Telas do Sistema
          </Link>
          <Link
            href="#migracao"
            underline="none"
            color="text.primary"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Migração Gratuita
          </Link>
          <Link
            href="#pricing"
            underline="none"
            color="text.primary"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ fontWeight: 700, fontSize: "1rem" }}
          >
            Planos
          </Link>
          <Link
            href="#faq"
            underline="none"
            color="text.primary"
            onClick={() => setMobileDrawerOpen(false)}
            sx={{ fontWeight: 700, fontSize: "1rem" }}
          >
            FAQ
          </Link>
          <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate("/signup?plan=FREE_TRIAL&step=2");
              }}
              sx={{ py: 1.2, borderRadius: 2, fontWeight: 800 }}
            >
              Testar 30 Dias Grátis
            </Button>
            <Button
              variant="text"
              fullWidth
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate("/login");
              }}
              sx={{ mt: 1, py: 1, fontWeight: 700, color: "text.secondary" }}
            >
              Fazer Login
            </Button>
          </Box>
        </Stack>
      </Drawer>

      {/* ── HERO SECTION (ORIGINAL COM A FOTO DO PET & TEXTOS RESTAURADOS) ── */}
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
                src="/hero_dog.jpg"
                alt="Data Pet - Gestão para Petshops"
                sx={{
                  width: "100%",
                  height: 500,
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: 6,
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  transform: "rotate(2deg)",
                }}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ── BANNER DE DESTAQUE: MIGRAÇÃO GRATUITA ──────────────────────── */}
      <Box id="migracao" sx={{ py: { xs: 5, md: 7 }, bgcolor: "#EEF2FF", borderTop: "1px solid #C7D2FE", borderBottom: "1px solid #C7D2FE" }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, gap: 2.5 }}>
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: 3,
                  bgcolor: "#313485",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 8px 20px -4px rgba(49, 52, 133, 0.4)",
                }}
              >
                <Database size={28} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", fontSize: { xs: "1.2rem", sm: "1.45rem" } }}>
                  Já usa outro sistema ou planilhas? A gente migra tudo para você.
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569", mt: 0.5, fontSize: "0.95rem", maxWidth: 680 }}>
                  Sem dor de cabeça e sem redigitar nada. Nossa equipe faz a importação completa dos seus clientes, pets e cadastros <strong>100% de graça</strong> para você começar hoje mesmo sem travar sua loja.
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
              sx={{
                bgcolor: "#313485",
                color: "white",
                px: 3.5,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: "0.92rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#24276A" },
              }}
            >
              Quero Migrar Grátis
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── GRID DE RECURSOS REAIS (6 PILARES) ─────────────────────────── */}
      <Box id="features" sx={{ py: { xs: 9, md: 13 }, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                bgcolor: "#F1F5F9",
                color: "#334155",
                px: 2,
                py: 0.5,
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: 0.6,
                mb: 1.5,
              }}
            >
              GESTÃO COMPLETA E SEM ENROLAÇÃO
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: "1.9rem", sm: "2.6rem" }, letterSpacing: -0.8, color: "#0F172A" }}>
              Tudo o que seu petshop precisa para faturar mais
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748B", maxWidth: 620, mx: "auto", mt: 1.5, fontSize: "1.05rem" }}>
              Ferramentas feitas especificamente para o dia a dia de donos de petshops e centros de estética animal.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 3.5,
            }}
          >
            {realFeatures.map((feat, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 3.5,
                  borderRadius: 3.5,
                  border: "1.5px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 20px 30px -10px rgba(49, 52, 133, 0.1)",
                    borderColor: "#C7D2FE",
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2.5,
                      bgcolor: "#EEF2FF",
                      color: "#313485",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(49, 52, 133, 0.12)",
                    }}
                  >
                    {feat.icon}
                  </Box>
                  <Box
                    sx={{
                      bgcolor: "#F8FAFC",
                      color: "#475569",
                      px: 1.2,
                      py: 0.3,
                      borderRadius: 1.5,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {feat.badge}
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 1.2, fontSize: "1.15rem" }}>
                  {feat.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.6, fontSize: "0.92rem", flexGrow: 1 }}>
                  {feat.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── SEÇÃO SHOWCASE: TELAS DO SISTEMA (AZUL & LARANJA DO LOGO) ───── */}
      <Box
        id="telas"
        sx={{
          py: { xs: 9, md: 13 },
          background: "linear-gradient(135deg, #131644 0%, #1E2260 40%, #313485 75%, #181A4B 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Laranja do Logo no canto superior direito */}
        <Box
          sx={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 122, 0, 0.28) 0%, rgba(255, 122, 0, 0.05) 50%, transparent 75%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        {/* Glow Azul do Logo no canto inferior esquerdo */}
        <Box
          sx={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(49, 52, 133, 0.45) 0%, rgba(30, 34, 96, 0.1) 60%, transparent 75%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          {/* Header da Seção */}
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 122, 0, 0.15)",
                color: "#FFA043",
                px: 2,
                py: 0.6,
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: 0.6,
                mb: 2,
                border: "1px solid rgba(255, 122, 0, 0.35)",
              }}
            >
              CONHEÇA O SISTEMA NA PRÁTICA
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.2rem" },
                fontWeight: 900,
                letterSpacing: -1,
                color: "#FFFFFF",
              }}
            >
              Telas feitas para quem vive a rotina do Petshop
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#CBD5E1",
                maxWidth: 680,
                mx: "auto",
                mt: 1.5,
                fontSize: "1.05rem",
                lineHeight: 1.6,
              }}
            >
              Navegue pelas telas principais do Sistema Data Pet e veja como organizamos seu caixa, DRE com folha proporcional, agenda e estoque.
            </Typography>
          </Box>

          {/* Abas Seletoras das Telas (com destaque Azul + Laranja) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 1.2,
              mb: 4,
            }}
          >
            {systemScreens.map((screen, idx) => {
              const isActive = activeScreenTab === idx;
              return (
                <Button
                  key={screen.id}
                  onClick={() => {
                    setIsCarouselPaused(true);
                    setActiveScreenTab(idx);
                  }}
                  startIcon={screen.icon}
                  sx={{
                    px: { xs: 1.8, sm: 2.2 },
                    py: 1,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textTransform: "none",
                    bgcolor: isActive ? "#FF7A00" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? "#FFFFFF" : "#CBD5E1",
                    border: "1px solid",
                    borderColor: isActive ? "#FF8A00" : "rgba(255, 255, 255, 0.12)",
                    boxShadow: isActive ? "0 8px 20px -2px rgba(255, 122, 0, 0.4)" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isActive ? "#EA6C00" : "rgba(255, 255, 255, 0.15)",
                      color: "#FFFFFF",
                    },
                  }}
                >
                  {screen.tabTitle}
                </Button>
              );
            })}
          </Box>

          {/* Card Principal: Moldura Heroica em Tela Cheia para Máximo Destaque */}
          <Box
            onMouseEnter={() => setIsCarouselPaused(true)}
            sx={{
              bgcolor: "rgba(15, 23, 42, 0.9)",
              border: "1.5px solid rgba(255, 122, 0, 0.25)",
              borderRadius: 4,
              p: { xs: 2.5, sm: 4, md: 5 },
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(18px)",
            }}
          >
            {/* Header da Tela com Badge, Título e Controles */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", md: "center" },
                gap: 2,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 122, 0, 0.15)",
                    color: "#FF8A00",
                    px: 1.5,
                    py: 0.4,
                    borderRadius: 1.5,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    border: "1px solid rgba(255, 122, 0, 0.3)",
                  }}
                >
                  {currentScreen.badge}
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.2rem", sm: "1.45rem" }, color: "white" }}>
                  {currentScreen.headline}
                </Typography>
              </Box>

              {/* Controles de Navegação e Botão de Ampliação */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, alignSelf: { xs: "stretch", sm: "flex-end" }, justifyContent: "space-between" }}>
                {!failedImages[currentScreen.id] && currentScreen.imageSrc && (
                  <Button
                    size="small"
                    onClick={() => setLightboxImage(currentScreen.imageSrc)}
                    startIcon={<ZoomIn size={16} />}
                    sx={{
                      bgcolor: "rgba(255, 122, 0, 0.15)",
                      color: "#FF8A00",
                      border: "1px solid rgba(255, 122, 0, 0.3)",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      px: 2,
                      py: 0.7,
                      whiteSpace: "nowrap",
                      "&:hover": { bgcolor: "#FF7A00", color: "white" },
                    }}
                  >
                    Ampliar Tela (HD)
                  </Button>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsCarouselPaused(true);
                      setActiveScreenTab((prev) => (prev === 0 ? systemScreens.length - 1 : prev - 1));
                    }}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", color: "white", "&:hover": { bgcolor: "#FF7A00" } }}
                  >
                    <ChevronLeft size={20} />
                  </IconButton>
                  <Typography sx={{ fontSize: "0.82rem", color: "#94A3B8", fontWeight: 800, px: 0.5 }}>
                    {activeScreenTab + 1} / {systemScreens.length}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsCarouselPaused(true);
                      setActiveScreenTab((prev) => (prev + 1) % systemScreens.length);
                    }}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", color: "white", "&:hover": { bgcolor: "#FF7A00" } }}
                  >
                    <ChevronRight size={20} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Descrição Detalhada da Tela */}
            <Typography sx={{ color: "#CBD5E1", fontSize: { xs: "0.95rem", md: "1.05rem" }, lineHeight: 1.6, mb: 3 }}>
              {currentScreen.description}
            </Typography>

            {/* Moldura de Janela de Aplicativo em Largura Total (Heroic Display) */}
            <Box
              sx={{
                bgcolor: "#0B0F19",
                borderRadius: 3.5,
                border: "1.5px solid rgba(255, 255, 255, 0.15)",
                overflow: "hidden",
                boxShadow: "0 25px 60px -10px rgba(0,0,0,0.8)",
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              {/* Topbar estilo navegador / app */}
              <Box
                sx={{
                  bgcolor: "#1E293B",
                  px: { xs: 2, sm: 2.5 },
                  py: 1.2,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#EF4444" }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#10B981" }} />
                </Box>

                <Box
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                    px: { xs: 1.5, sm: 2.5 },
                    py: 0.5,
                    borderRadius: 999,
                    fontSize: "0.78rem",
                    color: "#94A3B8",
                    fontWeight: 600,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <span>🔒</span> {currentScreen.urlBar}
                </Box>

                <Box
                  sx={{
                    bgcolor: !failedImages[currentScreen.id] && currentScreen.imageSrc ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 122, 0, 0.15)",
                    color: !failedImages[currentScreen.id] && currentScreen.imageSrc ? "#10B981" : "#FFA043",
                    px: 1.2,
                    py: 0.2,
                    borderRadius: 1,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    border: "1px solid",
                    borderColor: !failedImages[currentScreen.id] && currentScreen.imageSrc ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 122, 0, 0.3)",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {!failedImages[currentScreen.id] && currentScreen.imageSrc ? "● Print Real do Sistema" : "● Demonstração Interativa"}
                </Box>
              </Box>

              {/* Área Principal da Tela */}
              <Box sx={{ bgcolor: "#070A11", position: "relative" }}>
                {!failedImages[currentScreen.id] && currentScreen.imageSrc ? (
                  /* EXIBIÇÃO DA IMAGEM REAL EM ALTA DEFINIÇÃO E ESPAÇO AMPLO */
                  <Box
                    onClick={() => setLightboxImage(currentScreen.imageSrc)}
                    sx={{
                      position: "relative",
                      cursor: "zoom-in",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      p: { xs: 0.5, sm: 1.5 },
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      "&:hover .zoom-hint": {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      key={currentScreen.id}
                      src={currentScreen.imageSrc}
                      alt={currentScreen.tabTitle}
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [currentScreen.id]: true }));
                      }}
                      sx={{
                        width: "100%",
                        height: "auto",
                        maxHeight: { xs: 450, sm: 650, md: 820, lg: 920 },
                        objectFit: "contain",
                        borderRadius: 2,
                        display: "block",
                      }}
                    />

                    {/* Dica Flutuante de Zoom */}
                    <Box
                      className="zoom-hint"
                      sx={{
                        position: "absolute",
                        bottom: { xs: 12, sm: 24 },
                        right: { xs: 12, sm: 24 },
                        bgcolor: "rgba(15, 23, 42, 0.9)",
                        backdropFilter: "blur(10px)",
                        color: "white",
                        px: 2,
                        py: 0.9,
                        borderRadius: 2,
                        border: "1px solid rgba(255, 122, 0, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                        opacity: { xs: 1, sm: 0.85 },
                        transform: "translateY(0)",
                        transition: "all 0.25s ease",
                        pointerEvents: "none",
                      }}
                    >
                      <ZoomIn size={16} color="#FF7A00" /> Clique na imagem para ver em tela cheia (HD)
                    </Box>
                  </Box>
                ) : (
                  /* PLACEHOLDER VISUAL ILUSTRADO DE ALTA FIDELIDADE */
                  <Box sx={{ p: { xs: 3, sm: 4.5 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}>
                        {currentScreen.mockupData.title}
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "rgba(255, 122, 0, 0.15)",
                          color: "#FFA043",
                          px: 1.5,
                          py: 0.4,
                          borderRadius: 1.5,
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          border: "1px solid rgba(255, 122, 0, 0.3)",
                        }}
                      >
                        ● Interface Ilustrada
                      </Box>
                    </Box>

                    {/* KPI Cards Ilustrados daquela tela */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                        gap: 2,
                        mb: 3.5,
                      }}
                    >
                      {currentScreen.mockupData.kpis.map((kpi, kIdx) => (
                        <Box
                          key={kIdx}
                          sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            bgcolor: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <Typography sx={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 600 }}>{kpi.label}</Typography>
                          <Typography sx={{ fontSize: "1.35rem", fontWeight: 900, color: "white", mt: 0.6 }}>
                            {kpi.val}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: kpi.color, fontWeight: 700, mt: 0.5 }}>
                            {kpi.change}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Banner de Aviso do Placeholder */}
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        bgcolor: "rgba(49, 52, 133, 0.25)",
                        border: "1px dashed rgba(255, 122, 0, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.88rem", color: "#CBD5E1" }}>
                        Visualização da tela <strong>{currentScreen.tabTitle}</strong> pronta para exibição em alta definição assim que o print for adicionado em <code>screenshots/{currentScreen.id}.png</code>.
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "#FF7A00",
                          color: "white",
                          px: 1.5,
                          py: 0.4,
                          borderRadius: 1.5,
                          fontSize: "0.75rem",
                          fontWeight: 800,
                        }}
                      >
                        HD Ready
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Grid Inferior: 3 Destaques da Tela em 3 Colunas com Máxima Legibilidade */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2.5,
                mt: 4,
                mb: 4,
              }}
            >
              {currentScreen.bullets.map((bullet, bIdx) => (
                <Box
                  key={bIdx}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.07)",
                      borderColor: "rgba(255, 122, 0, 0.35)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "rgba(255, 122, 0, 0.2)",
                      color: "#FF8A00",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </Box>
                  <Typography sx={{ color: "#E2E8F0", fontSize: "0.92rem", lineHeight: 1.55, fontWeight: 500 }}>
                    {bullet}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Barra de CTA Inferior */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2.5,
                pt: 3,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box>
                <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>
                  Gostou da tela de {currentScreen.tabTitle}?
                </Typography>
                <Typography sx={{ color: "#94A3B8", fontSize: "0.82rem", mt: 0.3 }}>
                  30 dias de teste grátis • Sem cartão de crédito • Migração gratuita dos seus dados
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
                endIcon={<ArrowRight size={16} />}
                sx={{
                  bgcolor: "#FF7A00",
                  color: "white",
                  px: 4,
                  py: 1.4,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  boxShadow: "0 8px 25px -4px rgba(255, 122, 0, 0.5)",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "#EA6C00" },
                }}
              >
                Testar {currentScreen.tabTitle} por 30 dias grátis
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── PLANOS & PACOTES (1 MÊS GRÁTIS) ────────────────────────────── */}
      <Box id="pricing" sx={{ py: { xs: 9, md: 13 }, bgcolor: "#F8FAFC" }}>
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
              PREÇO JUSTO & TRANSPARENTE
            </Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" },
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#0F172A",
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              1º mês 100% grátis.
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
              }}
            >
              Teste o Data Pet Pro por 30 dias sem compromisso e sem cartão de crédito. Os pacotes de mensagens WhatsApp são opcionais e você só adiciona se quiser.
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
                Data Pet Pro
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.92rem", lineHeight: 1.5, mb: 2.5 }}>
                Tudo o que você precisa para gerenciar e fazer seu petshop crescer com lucro real.
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

              {/* Gift / Promo Highlight: 1 MÊS GRÁTIS */}
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
                  1º mês 100% grátis (30 dias de teste)!
                </Typography>
              </Box>

              {/* Features Checklist */}
              <Stack spacing={1.6} sx={{ mb: 3.5, flexGrow: 1 }}>
                {[
                  "Agenda operacional ilimitada (tosadores & banhistas)",
                  "PDV ágil com comandas e cancelamento seguro",
                  "Gestão completa de pacotes de banho",
                  "Estoque com baixa automática de insumos",
                  "Comissões automáticas por colaborador",
                  "DRE gerencial com folha e vigência proporcional",
                  "Migração gratuita de dados de outro sistema inclusa",
                ].map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CheckCircle2 size={18} color="#313485" strokeWidth={2.5} />
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: "#334155" }}>
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
                  Após os primeiros 30 dias grátis, o plano será de R$ 99,90/mês. Sem contrato de fidelidade, cancele quando desejar.
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
                Envie lembretes de agendamentos e avisos aos clientes de forma 100% automática pelo WhatsApp.
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
                  Você só paga pelos pacotes de WhatsApp se quiser usá-los. Eles são cobrados separadamente do plano Data Pet Pro.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Simple Compact Summary Card with Comparison Rows (1 Mês Grátis) */}
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
                    Apenas Sistema Data Pet Pro (Sem pacote de mensagens)
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748B", mt: 0.3, lineHeight: 1.4 }}>
                    Você <strong>não paga nada nos primeiros 30 dias</strong> (R$ 0,00). Após o período gratuito, o sistema será <strong>R$ 99,90/mês</strong>.
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
                {/* 1st month */}
                <Box sx={{ minWidth: 95 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    1º Mês (30 dias)
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

                {/* 2nd month onwards */}
                <Box sx={{ minWidth: 105 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    A partir do 2º Mês
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "1.05rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
                    R$ 99,90
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>
                      /mês
                    </Typography>
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B" }}>
                    Sem fidelidade
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
                      <>Com pacote de WhatsApp ({selectedPkgData.count} msgs/mês selecionado)</>
                    ) : (
                      <>Com pacote de WhatsApp (Exemplo: 500 msgs/mês)</>
                    )}
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "#64748B", mt: 0.3, lineHeight: 1.4 }}>
                    O sistema Data Pet Pro continua <strong>100% grátis no 1º mês</strong>. Você paga apenas o pacote de mensagens (
                    <strong>{selectedPkgData ? selectedPkgData.price : "R$ 69,90"}/mês</strong>) durante os primeiros 30 dias.
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
                {/* 1st month */}
                <Box sx={{ minWidth: 95 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    1º Mês (30 dias)
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

                {/* 2nd month onwards */}
                <Box sx={{ minWidth: 105 }}>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    A partir do 2º Mês
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
            <Typography sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, fontWeight: 700, color: "#1E293B" }}>
              Pronto para simplificar a gestão e ver o lucro real do seu petshop?
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
                px: 4,
                py: 1.4,
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "0 10px 25px -5px rgba(49, 52, 133, 0.4)",
                "&:hover": {
                  bgcolor: "#24276A",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Criar Conta Grátis
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── FAQ (PERGUNTAS FREQUENTES) ─────────────────────────────────── */}
      <Box id="faq" sx={{ py: { xs: 8, md: 12 }, bgcolor: "white", borderTop: "1px solid #E2E8F0" }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 6 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                bgcolor: "#F1F5F9",
                color: "#334155",
                px: 2,
                py: 0.5,
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: 0.6,
                mb: 1.5,
              }}
            >
              DÚVIDAS FREQUENTES
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", fontSize: { xs: "1.8rem", sm: "2.3rem" } }}>
              Tudo o que você precisa saber
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748B", mt: 1 }}>
              Respostas claras para você começar com total tranquilidade.
            </Typography>
          </Box>

          <Stack spacing={2}>
            {faqs.map((faq) => (
              <Accordion
                key={faq.id}
                expanded={expandedFaq === faq.id}
                onChange={(_, isExpanded) => setExpandedFaq(isExpanded ? faq.id : false)}
                sx={{
                  borderRadius: "14px !important",
                  border: "1.5px solid #E2E8F0",
                  boxShadow: "none",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": {
                    borderColor: "#C7D2FE",
                    bgcolor: "#F8FAFC",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={20} color="#313485" />}
                  sx={{ px: { xs: 2, sm: 3 }, py: 1 }}
                >
                  <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 2.5, pt: 0 }}>
                  <Typography sx={{ color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── FINAL CTA SECTION ───────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 9, md: 12 },
          bgcolor: "#313485",
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h3" fontWeight={900} sx={{ mb: 2, fontSize: { xs: "1.9rem", sm: "2.6rem" } }}>
            Pronto para transformar a gestão do seu Petshop?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.85, fontWeight: 400, fontSize: "1.05rem", lineHeight: 1.6 }}>
            Junte-se a petshops que economizam horas de trabalho e tomam decisões financeiras baseadas em dados reais.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/signup?plan=FREE_TRIAL&step=2")}
            sx={{
              bgcolor: "white",
              color: "#313485",
              px: 5,
              py: 1.8,
              borderRadius: 3,
              fontWeight: 900,
              fontSize: "1.1rem",
              textTransform: "none",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              "&:hover": { bgcolor: "#F1F5F9", transform: "scale(1.02)" },
            }}
          >
            Experimentar 30 Dias Grátis
          </Button>
          <Typography sx={{ mt: 2, fontSize: "0.8rem", opacity: 0.7 }}>
            Sem cartão de crédito • Cancelamento fácil • Migração gratuita
          </Typography>
        </Container>
      </Box>

      {/* ── FOOTER (SEM SEÇÃO DE SUPORTE) ───────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: "white",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
              gap: { xs: 4, md: 6 },
            }}
          >
            {/* Coluna 1: Logo & Sobre */}
            <Box>
              <Box sx={{ mb: 2 }}>
                <img src="/logo_dark.png" alt="Data Pet" height={36} />
              </Box>
              <Typography variant="body2" sx={{ color: "#64748B", lineHeight: 1.7, maxWidth: 360 }}>
                A plataforma mais inteligente e completa para gestão de petshops, clínicas de banho e tosa e centros de estética animal.
              </Typography>
            </Box>

            {/* Coluna 2: Produto */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A" sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Produto
              </Typography>
              <Stack spacing={1.5}>
                <Link href="#features" underline="none" color="#64748B" sx={{ fontSize: "0.9rem", "&:hover": { color: "#313485" } }}>
                  Recursos
                </Link>
                <Link href="#telas" underline="none" color="#64748B" sx={{ fontSize: "0.9rem", "&:hover": { color: "#313485" } }}>
                  Telas do Sistema
                </Link>
                <Link href="#migracao" underline="none" color="#64748B" sx={{ fontSize: "0.9rem", "&:hover": { color: "#313485" } }}>
                  Migração Gratuita
                </Link>
                <Link href="#pricing" underline="none" color="#64748B" sx={{ fontSize: "0.9rem", "&:hover": { color: "#313485" } }}>
                  Planos & Preços
                </Link>
                <Link href="#faq" underline="none" color="#64748B" sx={{ fontSize: "0.9rem", "&:hover": { color: "#313485" } }}>
                  Perguntas Frequentes
                </Link>
              </Stack>
            </Box>

            {/* Coluna 3: Legal & Empresa */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A" sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Legal
              </Typography>
              <Stack spacing={1.5}>
                <Link
                  component="button"
                  onClick={() => setLegalModal({ open: true, type: "terms" })}
                  underline="none"
                  color="#64748B"
                  sx={{ textAlign: "left", fontSize: "0.9rem", "&:hover": { color: "#313485" } }}
                >
                  Termos de Uso
                </Link>
                <Link
                  component="button"
                  onClick={() => setLegalModal({ open: true, type: "privacy" })}
                  underline="none"
                  color="#64748B"
                  sx={{ textAlign: "left", fontSize: "0.9rem", "&:hover": { color: "#313485" } }}
                >
                  Privacidade
                </Link>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              mt: { xs: 5, md: 7 },
              pt: 3,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              © {new Date().getFullYear()} Data Pet Ltda. Todos os direitos reservados.
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              Feito com dedicação para quem cuida de pets 🐾
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Modal Legal */}
      <LegalDialog
        open={legalModal.open}
        onClose={() => setLegalModal((prev) => ({ ...prev, open: false }))}
        type={legalModal.type}
      />

      {/* Modal Lightbox de Zoom em Alta Definição */}
      <Dialog
        open={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0B0F19",
            color: "white",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            overflow: "hidden",
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 1.8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            bgcolor: "#111827",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: "#FF7A00",
                color: "white",
                px: 1.2,
                py: 0.3,
                borderRadius: 1,
                fontSize: "0.72rem",
                fontWeight: 800,
              }}
            >
              HD 100%
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>
              {currentScreen.headline} — Visualização em Alta Resolução
            </Typography>
          </Box>
          <IconButton
            onClick={() => setLightboxImage(null)}
            sx={{ color: "white", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" } }}
          >
            <X size={22} />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: { xs: 1, sm: 2 }, bgcolor: "#05070B", textAlign: "center", overflow: "auto" }}>
          {lightboxImage && (
            <Box
              component="img"
              src={lightboxImage}
              alt="Visualização em Alta Resolução"
              sx={{
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 2,
                boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LandingPage;
