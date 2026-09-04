import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { LucideIcon } from "lucide-react";
import {
  Menu,
  X,
  User,
  ChevronDown,
  Home,
  ShoppingCart,
  Users,
  PawPrint,
  ClipboardList,
  Barcode,
  ShoppingBag,
  Package,
  AlertTriangle,
  Zap,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import UserMenu from "../features/users/UserMenu";
import { Button } from "../components/Button/Button";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import PendingWhatsAppBanner from "../features/billing/PendingWhatsAppBanner";
import WhatsappSimulator from "../features/whatsapp-simulator/WhatsappSimulator";
import { ErrorBoundary } from "../components/ErrorBoundary/ErrorBoundary";
import PWAInstallModal from "../components/PWAInstallModal";

interface TopNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  module: string;
  hideBelow?: "md" | "lg" | "xl";
}

const topNavItems: TopNavItem[] = [
  {
    id: "home",
    label: "Início",
    icon: Home,
    path: "/dashboard",
    module: "dashboard",
  },
  {
    id: "pos",
    label: "Caixa",
    icon: ShoppingCart,
    path: "/pos",
    module: "pos",
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
    path: "/registration/clients",
    module: "clients",
  },
  {
    id: "pets",
    label: "Pets",
    icon: PawPrint,
    path: "/registration/pets",
    module: "pets",
    hideBelow: "md",
  },
  {
    id: "services",
    label: "Serviços",
    icon: ClipboardList,
    path: "/registration/services",
    module: "services",
    hideBelow: "md",
  },
  {
    id: "products",
    label: "Produtos",
    icon: Barcode,
    path: "/registration/products",
    module: "products",
    hideBelow: "xl",
  },
  {
    id: "packages",
    label: "Pacotes",
    icon: ShoppingBag,
    path: "/registration/packages",
    module: "packages",
    hideBelow: "lg",
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: Package,
    path: "/inventory",
    module: "inventory",
    hideBelow: "xl",
  },
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
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
  const [pwaModalOpen, setPwaModalOpen] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
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
  const isPOS = location.pathname === "/pos";

  return (
    <Box sx={{ display: "flex", height: "100dvh", minHeight: "100dvh", overflow: "hidden" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "white",
          color: "text.primary",
          borderBottom: "1px solid #e2e8f0",
          pt: "env(safe-area-inset-top, 0px)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 60, sm: 70 },
            px: { xs: 1.5, sm: 2.5 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
              cursor: "pointer",
            }}
            onClick={() => navigate("/dashboard")}
          >
            {/* Ícone pequeno do favicon no mobile para liberar espaço */}
            <Box
              component="img"
              src="/favicon.png"
              alt="PetControle"
              sx={{
                display: { xs: "block", md: "none" },
                width: 34,
                height: 34,
                borderRadius: 1.5,
              }}
            />
            {/* Logo completa no desktop */}
            <Box
              component="img"
              src="/logo_dark.png"
              alt="PetControle"
              sx={{
                display: { xs: "none", md: "block" },
                width: 145,
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 0.5, sm: 0.75, md: 1.25, lg: 1.75 },
              flex: 1,
              py: 0.5,
            }}
          >
            {topNavItems.map((item) => {
              if (!hasPermission(item.module as any)) return null;

              const isActive =
                item.path === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.path);

              const displayConfig = {
                xs: item.hideBelow ? "none" : "flex",
                sm: item.hideBelow ? "none" : "flex",
                md: item.hideBelow === "lg" || item.hideBelow === "xl" ? "none" : "flex",
                lg: item.hideBelow === "xl" ? "none" : "flex",
                xl: "flex",
              };

              const IconComponent = item.icon;

              return (
                <Box
                  key={item.id}
                  component="button"
                  onClick={() => navigate(item.path)}
                  sx={{
                    display: displayConfig,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? "rgba(49, 52, 133, 0.06)" : "none",
                    border: "none",
                    cursor: "pointer",
                    px: { xs: 0.8, sm: 1.1, md: 1.4, lg: 1.75 },
                    py: { xs: 0.5, sm: 0.7, md: 0.85 },
                    borderRadius: 2.5,
                    minWidth: { xs: 48, sm: 56, md: 66, lg: 72 },
                    color: isActive ? "primary.main" : "text.primary",
                    opacity: isActive ? 1 : 0.7,
                    gap: "4px",
                    transition: "all 0.15s ease",
                    position: "relative",
                    flexShrink: 0,
                    "&:hover": {
                      opacity: 1,
                      color: "primary.main",
                      bgcolor: isActive ? "rgba(49, 52, 133, 0.1)" : "action.hover",
                    },
                    ...(isActive && {
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: -3,
                        left: "15%",
                        right: "15%",
                        height: "3px",
                        borderRadius: "2px",
                        bgcolor: "primary.main",
                      },
                    }),
                  }}
                >
                  <IconComponent size={isMobile ? 21 : 23} strokeWidth={isActive ? 2.3 : 1.9} />
                  <Typography
                    sx={{
                      fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.85rem" },
                      fontWeight: isActive ? 700 : 600,
                      lineHeight: 1.1,
                      letterSpacing: "-0.2px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            <Box
              component="button"
              onClick={handleClick}
              sx={{
                backgroundColor: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 0.75 },
                cursor: "pointer",
                p: 0.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{
                  backgroundColor: "secondary.main",
                  borderRadius: "50%",
                  p: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  width: { xs: 30, sm: 34 },
                  height: { xs: 30, sm: 34 },
                }}
              >
                <User size={isMobile ? 16 : 18} />
              </Box>
              {!isMobile && (
                <>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    component="div"
                    sx={{ color: "text.primary", maxWidth: { md: 100, lg: 150 } }}
                  >
                    {user?.name}
                  </Typography>
                  <ChevronDown size={15} color="#64748B" />
                </>
              )}
            </Box>

            <Tooltip title="Menu completo">
              <IconButton
                color="inherit"
                aria-label="abrir menu completo"
                onClick={() => setDrawerOpen(true)}
                sx={{
                  p: 0.75,
                  borderRadius: 2,
                  color: "text.primary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Menu size={23} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <MuiDrawer
        anchor="right"
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: "primary.main",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            minHeight: { xs: 60, sm: 70 },
          }}
        >
          <img
            src="/logo.png"
            alt="PetControle"
            width={130}
            style={{ cursor: "pointer" }}
            onClick={() => {
              navigate("/dashboard");
              setDrawerOpen(false);
            }}
          />
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: "rgba(255, 255, 255, 0.8)", "&:hover": { color: "white" } }}
          >
            <X size={22} />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
        <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        {isMobile && (
          <Box sx={{ p: 2, mt: "auto", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setDrawerOpen(false);
                setPwaModalOpen(true);
              }}
              startIcon={<Smartphone size={18} />}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.4)",
                "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.08)" },
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              Instalar App no Celular
            </Button>
          </Box>
        )}
      </MuiDrawer>

      <UserMenu
        open={openMenu}
        anchorEl={anchorEl}
        handleClose={handleClose}
        onOpenPwaModal={() => setPwaModalOpen(true)}
      />

      {/* --- CONTEÚDO PRINCIPAL (100% da Largura da Tela) --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 1, sm: 2, md: isPOS ? 2 : 2.5 },
          pb: { xs: 1, sm: 2, md: isPOS ? 2 : 2.5 },
          pt: 0,
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
        <Toolbar sx={{ minHeight: { xs: 60, sm: 70 }, height: { xs: 60, sm: 70 }, flexShrink: 0, mb: { xs: 0.5, sm: 1 } }} />
        <EmailVerificationBanner />
        <PendingWhatsAppBanner />

        {subscriptionAlert && (
          <Box
            sx={{
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 3,
              py: 2,
              mb: 3,
              borderRadius: 3,
              maxWidth: 1400,
              width: "100%",
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
                variant="body2"
                sx={{
                  color: subscriptionAlert.severity === "error" ? "#991B1B" : "#92400E",
                  fontWeight: 600,
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

      {/* WhatsApp Simulator (Dev / Admin - Ocultado a pedido do usuário) */}
      {false && (import.meta.env.DEV || user?.role === "admin") && (
        <>
          <IconButton
            onClick={() => setWhatsappSimulatorOpen(true)}
            sx={{
              position: "fixed",
              bottom: {
                xs: "calc(82px + env(safe-area-inset-bottom, 0px))",
                md: "calc(24px + env(safe-area-inset-bottom, 0px))",
              },
              right: { xs: 16, sm: 24 },
              width: { xs: 48, sm: 54 },
              height: { xs: 48, sm: 54 },
              bgcolor: "#25D366",
              color: "white",
              boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
              zIndex: 1000,
              "&:hover": {
                bgcolor: "#128C7E",
              },
            }}
          >
            <MessageCircle size={26} />
          </IconButton>
          <WhatsappSimulator
            open={whatsappSimulatorOpen}
            onClose={() => setWhatsappSimulatorOpen(false)}
          />
        </>
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal
        open={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />
    </Box>
  );
}
