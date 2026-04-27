import { List, Box, Typography, LinearProgress } from "@mui/material";
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
  Wallet,
  Settings,
  Package,
  ShoppingCart,
  HelpCircle,
  Truck,
  UserCheck,
  BarChart2,
  Percent,
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
      },
      {
        id: "pets",
        label: "Pets",
        icon: <PawPrint size={20} />,
        path: "/registration/pets",
      },
      {
        id: "services",
        label: "Serviços",
        icon: <ClipboardList size={20} />,
        path: "/registration/services",
      },
      {
        id: "products",
        label: "Produtos",
        icon: <Barcode size={20} />,
        path: "/registration/products",
      },
      {
        id: "packages",
        label: "Pacotes",
        icon: <Package size={20} />,
        path: "/registration/packages",
      },
      {
        id: "suppliers",
        label: "Fornecedores",
        icon: <Truck size={20} />,
        path: "/registration/suppliers",
      },
      {
        id: "employees",
        label: "Funcionários",
        icon: <UserCheck size={20} />,
        path: "/registration/employees",
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
      },
      {
        id: "inventory",
        label: "Estoque",
        icon: <Package size={20} />,
        path: "/inventory",
      },
      {
        id: "financial",
        label: "Financeiro",
        icon: <Wallet size={20} />,
        path: "/financial",
      },
      {
        id: "commission-rules",
        label: "Comissão",
        icon: <Percent size={20} />,
        path: "/commissions/rules",
        ownerOnly: true,
      },
      {
        id: "reports",
        label: "Relatórios",
        icon: <BarChart2 size={20} />,
        path: "/reports",
        ownerOnly: true,
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

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { isOwner } = usePermission();

  const getTrialInfo = () => {
    const subscription = tenant?.subscription;
    if (
      !subscription ||
      subscription.status !== "trialing" ||
      !subscription.trial_ends_at
    ) {
      return null;
    }
    const expiryDate = dayjs(subscription.trial_ends_at);
    const daysLeft = Math.ceil(expiryDate.diff(dayjs(), "hour") / 24);
    const totalDays = subscription.plan?.trial_days || 14;
    const progress = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));

    return { daysLeft: daysLeft > 0 ? daysLeft : 0, progress, expiryDate };
  };

  const trialInfo = getTrialInfo();
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
          },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
        {menuSections.map((section, index) => (
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
                .filter((item) => !item.ownerOnly || isOwner)
                .map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    collapsed={collapsed}
                  />
                ))}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && trialInfo && isOwner && (
        <Box
          sx={{
            mx: 2,
            mb: 1,
            p: 1.5,
            bgcolor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 2,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}
          >
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: 700 }}
            >
              {trialInfo.daysLeft === 0
                ? trialInfo.expiryDate.isBefore(dayjs())
                  ? "Teste expirado"
                  : `Acaba hoje às ${trialInfo.expiryDate.format("HH:mm")}`
                : `${trialInfo.daysLeft} ${trialInfo.daysLeft === 1 ? "dia" : "dias"} restantes`}
            </Typography>
            <Typography
              variant="caption"
              onClick={() => navigate("/settings?tab=billing")}
              sx={{
                color: "secondary.main",
                fontWeight: 800,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Assinar
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={trialInfo.progress}
            sx={{
              height: 5,
              borderRadius: 3,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "& .MuiLinearProgress-bar": {
                bgcolor: "secondary.main",
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
