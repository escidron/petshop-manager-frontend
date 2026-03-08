import { List } from "@mui/material";
import SidebarItem, { type SidebarItemConfig } from "./SidebarItem";
import { Home, NotebookTabs, PawPrint, Users, Wallet } from "lucide-react";

const menu: SidebarItemConfig[] = [
  {
    id: "home",
    label: "Inicio",
    icon: <Home />,
    path: "/",
  },
  {
    id: "clients",
    label: "Clientes",
    icon: <Users />,
    path: "/registration/clients",
  },
  {
    id: "pets",
    label: "Pets",
    icon: <PawPrint />,
    path: "/registration/pets",
  },
  // {
  //   id: "products",
  //   label: "Produtos",
  //   icon: <ScanBarcode />,
  //   path: "/registration/products",
  // },
  {
    id: "services",
    label: "Serviços",
    icon: <NotebookTabs />,
    path: "/registration/services",
  },
  {
    id: "financial",
    label: "Financeiro",
    icon: <Wallet />,
    path: "/financial",
  },
];

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  return (
    <List sx={{ bgcolor: "primary.main" }}>
      {menu.map((item) => (
        <SidebarItem key={item.id} item={item} collapsed={collapsed} />
      ))}
    </List>
  );
};

export default Sidebar;
