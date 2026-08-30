import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button as MuiButton,
  Chip,
} from "@mui/material";
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import type { CashSessionDetailResponse } from "../../cash_register/types";

interface POSCashControlPillProps {
  currentSession: CashSessionDetailResponse | null | undefined;
  onOpenSupplyModal: () => void;
  onOpenBleedModal: () => void;
  onOpenCloseCashModal: () => void;
  onOpenStatementModal: () => void;
}

export default function POSCashControlPill({
  currentSession,
  onOpenSupplyModal,
  onOpenBleedModal,
  onOpenCloseCashModal,
  onOpenStatementModal,
}: POSCashControlPillProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  if (!currentSession) return null;

  const drawerBalance = currentSession.current_balance ?? 0;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <MuiButton
        onClick={handleMenuClick}
        size="small"
        endIcon={<ChevronDown size={13} style={{ opacity: 0.7 }} />}
        sx={{
          bgcolor: "#F0FDF4",
          border: "1px solid #BBF7D0",
          color: "#166534",
          borderRadius: 2,
          px: { xs: 0.75, sm: 1.25 },
          py: 0.4,
          textTransform: "none",
          fontWeight: 700,
          fontSize: { xs: "0.68rem", sm: "0.75rem" },
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          flexShrink: 0,
          "&:hover": {
            bgcolor: "#DCFCE7",
            borderColor: "#86EFAC",
          },
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "#16A34A",
            boxShadow: "0 0 0 2px #DCFCE7",
          }}
        />
        <span>Caixa Aberto</span>
      </MuiButton>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 210,
            p: 0.75,
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        {/* Protected confidential balance - Only visible in private menu */}
        <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #F3F4F6", mb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
            <Chip
              label="Caixa Aberto"
              size="small"
              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: "#16A34A", color: "#ffffff" }}
            />
            {currentSession.session.opened_by_name && (
              <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, fontSize: "0.72rem" }}>
                {currentSession.session.opened_by_name}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "#111827", fontSize: "0.85rem" }}>
            Saldo em Gaveta: R$ {drawerBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onOpenSupplyModal();
          }}
        >
          <ListItemIcon><ArrowUpRight size={16} color="#16A34A" /></ListItemIcon>
          <ListItemText primary="Novo Suprimento" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onOpenBleedModal();
          }}
        >
          <ListItemIcon><ArrowDownRight size={16} color="#D97706" /></ListItemIcon>
          <ListItemText primary="Nova Sangria" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onOpenStatementModal();
          }}
        >
          <ListItemIcon><Receipt size={16} color="#2563EB" /></ListItemIcon>
          <ListItemText primary="Extrato do Caixa" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onOpenCloseCashModal();
          }}
          sx={{ color: "#DC2626" }}
        >
          <ListItemIcon><Lock size={16} color="#DC2626" /></ListItemIcon>
          <ListItemText primary="Fechar Caixa" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 700, color: "#DC2626" }} />
        </MenuItem>
      </Menu>
    </>
  );
}
