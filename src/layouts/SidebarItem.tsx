import React, { type ReactNode } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  alpha,
  lighten,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router";
import theme from "../theme";

export type SidebarItemConfig = {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: SidebarItemConfig[];
};

type Props = {
  item: SidebarItemConfig;
  depth?: number;
  collapsed: boolean;
};

const SidebarItem: React.FC<Props> = ({ item, depth = 0, collapsed }) => {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();

  const hasChildren = Boolean(item.children?.length);

  const handleClick = () => {
    if (hasChildren) {
      setOpen((prev) => !prev);
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: 2 + depth * 2,
          gap: 1,
          color: "text.secondary",
          borderRadius: 1,
          "&:hover": {
            backgroundColor: alpha(
              lighten(theme.palette.primary.main, 0.3),
              0.3,
            ),
          },
        }}
      >
        {item.icon && (
          <ListItemIcon sx={{ minWidth: 20, color: "text.secondary" }}>
            {item.icon}
          </ListItemIcon>
        )}
        {!collapsed && <ListItemText primary={item.label} />}
        {hasChildren && !collapsed && (open ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>

      {hasChildren && !collapsed && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children!.map((child) => (
              <SidebarItem key={child.id} item={child} depth={depth + 1} collapsed={collapsed}/>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default SidebarItem;
