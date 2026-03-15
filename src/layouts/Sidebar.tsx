import { List, Box, Typography, LinearProgress, Stack } from "@mui/material";
import dayjs from "dayjs";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SidebarItem, { type SidebarItemConfig } from "./SidebarItem";
import {
  Home,
  People,
  Pets,
  Assignment,
  QrCodeScanner,
  AccountBalanceWallet,
  Settings,
  Inventory,
  PointOfSale,
  HelpOutline,
} from "@mui/icons-material";

const menuSections: { title: string; items: SidebarItemConfig[] }[] = [
  {
    title: "INÍCIO",
    items: [
      {
        id: "home",
        label: "Inicio",
        icon: <Home />,
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
        icon: <People />,
        path: "/registration/clients",
      },
      {
        id: "pets",
        label: "Pets",
        icon: <Pets />,
        path: "/registration/pets",
      },
      {
        id: "services",
        label: "Serviços",
        icon: <Assignment />,
        path: "/registration/services",
      },
      {
        id: "products",
        label: "Produtos",
        icon: <QrCodeScanner />,
        path: "/registration/products",
      },
      {
        id: "packages",
        label: "Pacotes",
        icon: <Inventory />,
        path: "/registration/packages",
      },
    ],
  },
  {
    title: "OPERACIONAL",
    items: [
      {
        id: "pos",
        label: "Frente de Caixa",
        icon: <PointOfSale />,
        path: "/pos",
      },
      {
        id: "inventory",
        label: "Estoque",
        icon: <Inventory />,
        path: "/inventory",
      },
      {
        id: "financial",
        label: "Financeiro",
        icon: <AccountBalanceWallet />,
        path: "/financial",
      },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      {
        id: "settings",
        label: "Configurações",
        icon: <Settings />,
        path: "/settings",
      },
      {
        id: "support",
        label: "Suporte",
        icon: <HelpOutline />,
        path: "#",
      },
    ],
  },
];

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const navigate = useNavigate();
  const { tenant } = useAuth();

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
    const daysLeft = expiryDate.diff(dayjs(), "day") + 1;
    const totalDays = subscription.plan?.trial_days || 14;
    const progress = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));

    return { daysLeft: daysLeft > 0 ? daysLeft : 0, progress };
  };

  const trialInfo = getTrialInfo();
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor: "primary.main",
        pb: 2,
      }}
    >
      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        {menuSections.map((section, index) => (
          <Box key={section.title} sx={{ mt: index === 0 ? 1 : 2, mb: 1 }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  color: "white",
                  opacity: 0.5,
                  fontWeight: 700,
                  px: 2.5,
                  mb: 0.5,
                  display: "block",
                  letterSpacing: 1.2,
                }}
              >
                {section.title}
              </Typography>
            )}
            <List sx={{ px: 1 }}>
              {section.items.map((item) => (
                <SidebarItem key={item.id} item={item} collapsed={collapsed} />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {!collapsed && trialInfo && (
        <Box
          sx={{
            mx: 2,
            p: 2,
            bgcolor: "rgba(255, 255, 255, 0.08)",
            borderRadius: 2,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Stack spacing={1}>
            <Typography
              variant="caption"
              sx={{ color: "white", opacity: 0.7, fontWeight: 700 }}
            >
              PLANO ATUAL
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "white", fontWeight: 800 }}
            >
              Teste Gratuito
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "white", opacity: 0.8 }}
                >
                  {trialInfo.daysLeft === 0 ? "Último dia!" : "Dias restantes"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "white", fontWeight: 700 }}
                >
                  {trialInfo.daysLeft} de 14
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={trialInfo.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "secondary.main",
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
            <Typography
              variant="caption"
              onClick={() => navigate("/settings?tab=billing")}
              sx={{
                color: "secondary.main",
                fontWeight: 800,
                textAlign: "center",
                mt: 1,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              🚀 Assinar Agora
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
