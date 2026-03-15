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
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Typography } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "../features/users/UserMenu";

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
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
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
  const [open, setOpen] = React.useState(true);
  const { user } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Início";
    if (path.startsWith("/registration/clients")) return "Clientes";
    if (path.startsWith("/registration/pets")) return "Pets";
    if (path.startsWith("/registration/services")) return "Serviços";
    if (path.startsWith("/registration/products")) return "Produtos";
    if (path.startsWith("/registration/packages"))
      return "Pacotes de Serviços e Produtos";

    if (path === "/pos") return "Caixa";
    if (path === "/financial") return "Financeiro";
    if (path === "/inventory") return "Controle de Estoque";
    if (path === "/settings") return "Configurações";
    return "";
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        open={open}
        elevation={0}
        sx={{
          backgroundColor: "white",
          color: "text.primary",
          borderBottom: "1px solid #e0e0e0",
          display: { xs: "none", sm: "block" },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[{ marginRight: 5 }, open && { display: "none" }]}
          >
            <Menu />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              ml: open ? 0 : 0,
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            {getPageTitle()}
          </Typography>
          <Box
            component="button"
            onClick={handleClick}
            sx={{
              backgroundColor: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
              gap: 2,
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
              }}
            >
              <User size={16} />
            </Box>
            <Typography
              variant="body1"
              noWrap
              component="div"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.name}
            </Typography>
            <ChevronDown size={18} />
          </Box>
          <Box sx={{ marginTop: 3 }}>
            <UserMenu
              open={openMenu}
              anchorEl={anchorEl}
              handleClose={handleClose}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        PaperProps={{
          sx: {
            backgroundColor: "primary.main",
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
            style={{ marginLeft: "8px" }}
          />
          <IconButton
            onClick={handleDrawerClose}
            sx={{ color: "text.secondary" }}
          >
            {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
        <Sidebar collapsed={!open} />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}
