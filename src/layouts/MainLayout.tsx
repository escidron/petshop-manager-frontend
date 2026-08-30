import * as React from "react";
import {
  styled,
  useTheme,
  type Theme,
  type CSSObject,
} from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Home,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Typography, useMediaQuery } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import UserMenu from "../features/users/UserMenu";
import { AlertTriangle, Zap, MessageCircle } from "lucide-react";
import { Button } from "../components/Button/Button";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import PendingWhatsAppBanner from "../features/billing/PendingWhatsAppBanner";
import WhatsappSimulator from "../features/whatsapp-simulator/WhatsappSimulator";
import { ErrorBoundary } from "../components/ErrorBoundary/ErrorBoundary";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  minHeight: "56px",
  [theme.breakpoints.up("sm")]: {
    minHeight: "64px",
  },
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  isMobile?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isMobile",
})<AppBarProps>(({ theme, open, isMobile }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isMobile && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DesktopDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const {
    user,
    subscriptionStatus,
    isSubscriptionActive,
    isSubscriptionInGracePeriod,
    gracePeriodDaysLeft,
  } = useAuth();
  const { hasPermission } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [whatsappSimulatorOpen, setWhatsappSimulatorOpen] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerOpen = () => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setOpen(true);
    }
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const getSubscriptionAlert = (): { severity: "warning" | "error"; message: string; actionLabel?: string } | null => {
    if (isSubscriptionInGracePeriod) {
      return {
        severity: "warning",
        message: `Atenção: Houve um problema com o pagamento da sua mensalidade. Restam ${gracePeriodDaysLeft} dia(s) para regularizar antes do bloqueio do sistema.`,
        actionLabel: "Regularizar Agora",
      };
    }

    if (isSubscriptionActive) return null;
    if (!subscriptionStatus) return null;

    if (subscriptionStatus === "active") {
      return { severity: "error", message: "Seu período de assinatura expirou. Você está em modo leitura, novos agendamentos estão bloqueados.", actionLabel: "Renovar assinatura" };
    }
    if (subscriptionStatus === "incomplete" || subscriptionStatus === "pending") {
      return { severity: "warning", message: "Sua assinatura está pendente de pagamento. Adicione um método de pagamento para ativar sua conta e criar agendamentos.", actionLabel: "Adicionar método de pagamento" };
    }
    if (subscriptionStatus === "trialing") {
      return { severity: "error", message: "Seu período de teste expirou. Você está em modo leitura, novos agendamentos estão bloqueados.", actionLabel: "Assinar agora" };
    }
    if (subscriptionStatus === "past_due") {
      return { severity: "error", message: "Pagamento em atraso. Você está em modo leitura, novos agendamentos estão bloqueados.", actionLabel: "Atualizar pagamento" };
    }
    if (subscriptionStatus === "canceled") {
      return { severity: "error", message: "Assinatura cancelada. Você está em modo leitura, novos agendamentos estão bloqueados.", actionLabel: "Reativar assinatura" };
    }
    return null;
  };

  const subscriptionAlert = getSubscriptionAlert();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Início";
    if (path.startsWith("/registration/clients")) return "Clientes";
    if (path.startsWith("/registration/pets")) return "Pets";
    if (path.startsWith("/registration/services")) return "Serviços";
    if (path.startsWith("/registration/products")) return "Produtos";
    if (path.startsWith("/registration/packages"))
      return "Pacotes de Serviços e Produtos";

    if (path.startsWith("/registration/suppliers")) return "Fornecedores";
    if (path.startsWith("/registration/employees")) return "Funcionários";
    if (path === "/pos") return "Caixa";
    if (path === "/financial") return "Financeiro";
    if (path === "/inventory") return "Controle de Estoque";
    if (path === "/settings") return "Configurações";
    if (path.startsWith("/commissions/rules")) return "Regras de Comissão";
    if (path.startsWith("/commissions/report")) return "Relatório de Comissões";
    if (path === "/reports/financial") return "Relatório Financeiro";
    if (path === "/reports/inventory") return "Relatório de Estoque";
    if (path === "/reports") return "Relatórios";
    return "";
  };

  const isPOS = location.pathname === "/pos";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <CssBaseline />

      {/* --- APP BAR (Desktop e Mobile) --- */}
      <AppBar
        position="fixed"
        open={!isMobile && open}
        isMobile={isMobile}
        elevation={0}
        sx={{
          backgroundColor: "white",
          color: "text.primary",
          borderBottom: "1px solid #e0e0e0",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 58, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
          {/* Desktop Left: Hamburger (se fechado) + Título da Página */}
          {!isMobile && (
            <>
              <IconButton
                color="inherit"
                aria-label="abrir menu lateral"
                onClick={handleDrawerOpen}
                edge="start"
                sx={[
                  { mr: { xs: 1, sm: 2 } },
                  open && { display: "none" },
                ]}
              >
                <Menu size={22} />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "primary.main",
                  fontSize: "1.25rem",
                  transition: theme.transitions.create("margin", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }}
                noWrap
              >
                {getPageTitle()}
              </Typography>
            </>
          )}

          {/* Mobile Left: Menu Hambúrguer */}
          {isMobile && (
            <Tooltip title="Mais opções">
              <IconButton
                size="small"
                color="inherit"
                aria-label="abrir menu lateral"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{
                  p: 0.75,
                  borderRadius: 2,
                  color: "text.primary",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Menu size={24} />
              </IconButton>
            </Tooltip>
          )}

          {/* Mobile Center: 3 Ícones com Texto Embaixo (Início, Caixa, Clientes) */}
          {isMobile && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: { xs: 2, sm: 3 },
                flex: 1,
              }}
            >
              {hasPermission("dashboard") && (
                <Box
                  component="button"
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 2,
                    minWidth: 46,
                    color: location.pathname === "/dashboard" ? "primary.main" : "text.primary",
                    opacity: location.pathname === "/dashboard" ? 1 : 0.65,
                    gap: "2px",
                    transition: "all 0.2s ease",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <Home size={19} />
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: location.pathname === "/dashboard" ? 800 : 600, lineHeight: 1, letterSpacing: "-0.2px" }}>
                    Início
                  </Typography>
                </Box>
              )}

              {hasPermission("pos") && (
                <Box
                  component="button"
                  onClick={() => navigate("/pos")}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 2,
                    minWidth: 46,
                    color: location.pathname === "/pos" ? "primary.main" : "text.primary",
                    opacity: location.pathname === "/pos" ? 1 : 0.65,
                    gap: "2px",
                    transition: "all 0.2s ease",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <ShoppingCart size={19} />
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: location.pathname === "/pos" ? 800 : 600, lineHeight: 1, letterSpacing: "-0.2px" }}>
                    Caixa
                  </Typography>
                </Box>
              )}

              {hasPermission("clients") && (
                <Box
                  component="button"
                  onClick={() => navigate("/registration/clients")}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 2,
                    minWidth: 46,
                    color: location.pathname.startsWith("/registration/clients") ? "primary.main" : "text.primary",
                    opacity: location.pathname.startsWith("/registration/clients") ? 1 : 0.65,
                    gap: "2px",
                    transition: "all 0.2s ease",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <Users size={19} />
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: location.pathname.startsWith("/registration/clients") ? 800 : 600, lineHeight: 1, letterSpacing: "-0.2px" }}>
                    Clientes
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Desktop Right: Perfil do Usuário */}
          {!isMobile && (
            <Box
              component="button"
              onClick={handleClick}
              sx={{
                backgroundColor: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                marginLeft: "auto",
                gap: { xs: 1, sm: 1.5 },
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "secondary.main",
                  borderRadius: "100%",
                  p: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <User size={16} />
              </Box>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                component="div"
                sx={{ color: "text.primary" }}
              >
                {user?.name}
              </Typography>
              <ChevronDown size={16} color="#64748B" />
            </Box>
          )}

          {/* Mobile Right: Perfil do Usuário */}
          {isMobile && (
            <Tooltip title="Meu Perfil">
              <IconButton
                size="small"
                onClick={handleClick}
                edge="end"
                sx={{
                  p: 0.6,
                  bgcolor: "secondary.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  "&:hover": { bgcolor: "secondary.dark" },
                }}
              >
                <User size={18} />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ marginTop: 3 }}>
            <UserMenu
              open={openMenu}
              anchorEl={anchorEl}
              handleClose={handleClose}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- GAVETA MOBILE (Temporary Overlay) --- */}
      {isMobile && (
        <MuiDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: 270,
              backgroundColor: "primary.main",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <DrawerHeader
            sx={{
              backgroundColor: "primary.main",
              display: "flex",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <img
              src="/logo.png"
              alt="logo"
              width={140}
              style={{ cursor: "pointer" }}
              onClick={() => {
                navigate("/dashboard");
                setMobileOpen(false);
              }}
            />
            <IconButton
              onClick={() => setMobileOpen(false)}
              sx={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              <ChevronLeft size={22} />
            </IconButton>
          </DrawerHeader>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </MuiDrawer>
      )}

      {/* --- GAVETA DESKTOP (Permanent Collapsible) --- */}
      {!isMobile && (
        <DesktopDrawer
          variant="permanent"
          open={open}
          PaperProps={{
            sx: {
              backgroundColor: "primary.main",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <DrawerHeader
            sx={{
              backgroundColor: "primary.main",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <img
              src="/logo.png"
              alt="logo"
              width={150}
              style={{ marginLeft: "8px", cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            />
            <IconButton
              onClick={handleDrawerClose}
              sx={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </DrawerHeader>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
          <Sidebar collapsed={!open} />
        </DesktopDrawer>
      )}

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: isPOS ? 2 : 3 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflowY: { xs: "auto", lg: isPOS ? "hidden" : "auto" },
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <DrawerHeader sx={{ flexShrink: 0 }} />
        <EmailVerificationBanner />
        <PendingWhatsAppBanner />
        {subscriptionAlert && (
          <Box
            sx={{
              margin: '0 auto',
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 3,
              py: 2.5,
              mb: 6,
              borderRadius: 3,
              maxWidth: 1400,
              bgcolor: "white",
              border: `1px solid ${subscriptionAlert.severity === "error" ? "#FECACA" : "#FDE68A"}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {subscriptionAlert.severity === "error" ? (
                <AlertTriangle size={16} color="#DC2626" />
              ) : (
                <AlertTriangle size={16} color="#D97706" />
              )}
              <Typography
                variant="body1"
                sx={{
                  color: subscriptionAlert.severity === "error" ? "#991B1B" : "#92400E",
                }}
              >
                {subscriptionAlert.message}
              </Typography>
            </Box>
            {subscriptionAlert.actionLabel && (
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate("/settings?tab=billing")}
                startIcon={<Zap size={13} />}
                sx={{
                  py: 0.4,
                  px: 1.5,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  bgcolor: subscriptionAlert.severity === "error" ? "#DC2626" : "#D97706",
                  "&:hover": {
                    bgcolor: subscriptionAlert.severity === "error" ? "#B91C1C" : "#B45309",
                  },
                }}
              >
                {subscriptionAlert.actionLabel}
              </Button>
            )}
          </Box>
        )}
        <Box 
          sx={{ 
            flex: { xs: isPOS ? "none" : 1, lg: 1 }, 
            minHeight: { xs: isPOS ? "auto" : 0, lg: 0 }, 
            overflow: isPOS ? { xs: "visible", lg: "hidden" } : "auto",
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>

      {/* WhatsApp Sandbox Simulator (Exclusivo para Devs e Administradores) */}
      {(import.meta.env.DEV || user?.role === "admin") && (
        <>
          <IconButton
            onClick={() => setWhatsappSimulatorOpen(true)}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              bgcolor: "#25D366",
              color: "white",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
              zIndex: 1000,
              "&:hover": {
                bgcolor: "#128C7E",
              },
            }}
          >
            <MessageCircle size={28} />
          </IconButton>
          <WhatsappSimulator
            open={whatsappSimulatorOpen}
            onClose={() => setWhatsappSimulatorOpen(false)}
          />
        </>
      )}
    </Box>
  );
}
