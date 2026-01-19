import { List } from "@mui/material";
import SidebarItem, { type SidebarItemConfig } from "./SidebarItem";
import { NotebookTabs, PawPrint, ScanBarcode, Users } from "lucide-react";

const menu: SidebarItemConfig[] = [
  {
    id: "cadastros",
    label: "Cadastros",
    icon: <NotebookTabs />,
    children: [
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
      {
        id: "products",
        label: "Products",
        icon: <ScanBarcode />,
        path: "/registration/products",
      },
    ],
  },
];

const Sidebar = ({collapsed}: {collapsed: boolean}) => {
  console.log('asd',collapsed)
  return (
    <List
      sx={{ bgcolor: "primary.main" }}
    >
      {menu.map((item) => (
        <SidebarItem key={item.id} item={item} collapsed={collapsed}/>
      ))}
    </List>
  );
};

export default Sidebar;
