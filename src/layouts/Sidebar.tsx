import { List, Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import { useNavigate } from "react-router-dom";
import SidebarItem, { type SidebarItemConfig } from "./SidebarItem";
import {
  Home,
  Users,
  PawPrint,
  ClipboardList,
  Barcode,
  Settings,
  Package,
  ShoppingCart,
  HelpCircle,
  Truck,
  UserCheck,
  BarChart2,
  Percent,
  ShoppingBag,
  Gift,
} from "lucide-react";

const menuSections: { title: string; items: SidebarItemConfig[] }[] = [
  {
    title: "INÍCIO",
    items: [
      {
        id: "home",
        label: "Início",
        icon: <Home size={20} />,
        path: "/dashboard",
        module: "dashboard",
      },
    ],
  },
  {
    title: "CADASTROS",
    items: [
      {
        id: "clients",
        label: "Clientes",
        icon: <Users size={20} />,
        path: "/registration/clients",
        module: "clients",
      },
      {
        id: "pets",
        label: "Pets",
        icon: <PawPrint size={20} />,
        path: "/registration/pets",
        module: "pets",
      },
      {
        id: "services",
        label: "Serviços",
        icon: <ClipboardList size={20} />,
        path: "/registration/services",
        module: "services",
      },
      {
        id: "packages",
        label: "Pacotes",
        icon: <ShoppingBag size={20} />,
        path: "/registration/packages",
        module: "packages",
      },
      {
        id: "products",
        label: "Produtos",
        icon: <Barcode size={20} />,
        path: "/registration/products",
        module: "products",
      },
      {
        id: "suppliers",
        label: "Fornecedores",
        icon: <Truck size={20} />,
        path: "/registration/suppliers",
        module: "suppliers",
      },
      {
        id: "employees",
        label: "Funcionários",
        icon: <UserCheck size={20} />,
        path: "/registration/employees",
        module: "employees",
      },
    ],
  },
  {
    title: "OPERACIONAL",
    items: [
      {
        id: "pos",
        label: "Caixa",
        icon: <ShoppingCart size={20} />,
        path: "/pos",
        module: "pos",
      },
      {
        id: "inventory",
        label: "Estoque",
        icon: <Package size={20} />,
        path: "/inventory",
        module: "inventory",
      },
      {
        id: "commission-rules",
        label: "Comissão",
        icon: <Percent size={20} />,
        path: "/commissions/rules",
        module: "commissions",
      },
      {
        id: "reports",
        label: "Relatórios",
        icon: <BarChart2 size={20} />,
        path: "/reports",
        module: "reports",
      },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      {
        id: "settings",
        label: "Configurações",
        icon: <Settings size={20} />,
        path: "/settings",
        module: "settings",
      },
      {
        id: "support",
        label: "Suporte",
        icon: <HelpCircle size={20} />,
        path: "#",
      },
    ],
  },
];

const Sidebar = ({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const navigate = useNavigate();
  const { tenant, user } = useAuth();
  const { isOwner, hasPermission } = usePermission();

  const getTrialInfo = () => {
    if (tenant?.feature_flags?.free_access) return null;
    
    const subscription = tenant?.subscription;
    if (!subscription) {
      return null;
    }
    const isTrial = subscription.plan?.code === "FREE_TRIAL" || subscription.status === "trialing";
    if (!isTrial || !subscription.trial_ends_at) {
      return null;
    }

    const now = dayjs();
    const trialEnd = dayjs(subscription.trial_ends_at);
    const daysLeft = Math.max(0, trialEnd.diff(now, "day"));

    return {
      daysLeft,
      trialEndFormatted: trialEnd.format("DD/MM/YYYY"),
    };
  };

  const trialInfo = getTrialInfo();

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.ownerOnly && !isOwner) return false;
        if (item.id === "support") {
          return !!tenant?.feature_flags?.support;
        }
        if (item.module) {
          return hasPermission(item.module);
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const sections = [...visibleSections];
  if (user?.role === "admin") {
    sections.push({
      title: "ADMINISTRADOR",
      items: [
        {
          id: "admin-dashboard",
          label: "Painel Admin",
          icon: <UserCheck size={20} />,
          path: "/admin/dashboard",
        },
      ],
    });
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor: "primary.main",
        pb: 1,
      }}
    >
      <Box
        sx={{
          overflowY: "auto",
          flexGrow: 1,
          minHeight: 0,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.15)",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255,255,255,0.3)",
            borderRadius: 4,
          },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
        {sections.map((section, index) => (
          <Box key={section.title} sx={{ mt: index === 0 ? 0.5 : 1, mb: 0 }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  color: "white",
                  opacity: 0.5,
                  fontWeight: 700,
                  px: 2.5,
                  mb: 0,
                  display: "block",
                  letterSpacing: 1.2,
                }}
              >
                {section.title}
              </Typography>
            )}
            <List sx={{ px: 1, py: 0 }}>
              {section.items
                .filter((item) => {
                  if (item.ownerOnly && !isOwner) return false;
                  if (item.id === "support") {
                    return !!tenant?.feature_flags?.support;
                  }
                  return true;
                })
                .map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && trialInfo && isOwner && (
        <Box
          onClick={() => navigate("/settings?tab=billing")}
          sx={{
            mx: 2,
            mb: 1,
            p: 1.25,
            bgcolor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 2,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.14)",
              borderColor: "rgba(255, 255, 255, 0.25)",
            },
          }}
        >
          {trialInfo.daysLeft === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "#FCA5A5", fontWeight: 700 }}>
                Período gratuito expirado
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "secondary.main",
                  fontWeight: 800,
                }}
              >
                Ativar
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FBBF24",
                  flexShrink: 0,
                }}
              >
                <Gift size={15} strokeWidth={2.5} />
              </Box>
              <Box sx={{ overflow: "hidden", flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "white",
                    fontWeight: 800,
                    display: "block",
                    lineHeight: 1.2,
                    fontSize: "0.78rem",
                  }}
                >
                  PetControle Pro
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.68rem",
                    display: "block",
                  }}
                >
                  6 meses grátis
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
