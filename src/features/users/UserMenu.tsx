import { useState } from "react";
import { Divider, Menu, MenuItem } from "@mui/material";
import { LogOut, PlusCircle, Settings, User } from "lucide-react";
import { logout } from "../../api/services/users";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import NewTenantModal from "../tenants/NewTenantModal";

type Props = {
  open: boolean;
  anchorEl: null | HTMLElement;
  handleClose: () => void;
};

const UserMenu = ({ open, anchorEl, handleClose }: Props) => {
  const navigate = useNavigate();
  const { setUser, setTenant } = useAuth();
  const [newTenantOpen, setNewTenantOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setTenant(null);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{ list: { "aria-labelledby": "basic-button" } }}
      >
        <MenuItem
          onClick={() => { handleClose(); navigate("/settings?tab=2"); }}
          sx={{ display: "flex", gap: 1 }}
        >
          <User size={18} />
          Meu Perfil
        </MenuItem>
        <MenuItem
          onClick={() => { handleClose(); navigate("/settings"); }}
          sx={{ display: "flex", gap: 1 }}
        >
          <Settings size={18} />
          Configurações
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={() => { handleClose(); setNewTenantOpen(true); }}
          sx={{ display: "flex", gap: 1, color: "primary.main", fontWeight: 600 }}
        >
          <PlusCircle size={18} />
          Novo estabelecimento
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ display: "flex", gap: 1, color: "error.main" }}
        >
          <LogOut size={18} />
          Sair
        </MenuItem>
      </Menu>

      <NewTenantModal
        open={newTenantOpen}
        onClose={() => setNewTenantOpen(false)}
      />
    </>
  );
};

export default UserMenu;
