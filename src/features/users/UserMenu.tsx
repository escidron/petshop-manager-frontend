import { Menu, MenuItem } from "@mui/material";
import { LogOut } from "lucide-react";
import { logout } from "../../api/services/users";
import { useNavigate } from "react-router";

type Props = {
  open: boolean;
  anchorEl: null | HTMLElement;
  handleClose: () => void;
};
const UserMenu = ({ open, anchorEl, handleClose }: Props) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };
  return (
    <Menu
      id="basic-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      slotProps={{
        list: {
          "aria-labelledby": "basic-button",
        },
      }}
    >
      <MenuItem onClick={handleLogout} sx={{ display: "flex", gap: 1 }}>
        <LogOut size={18} />
        Sair
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;
