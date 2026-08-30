import {
  Box,
  Paper,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button as MuiButton,
  IconButton,
} from "@mui/material";
import {
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  MoreVertical,
  ChevronDown,
  Monitor,
  Check,
} from "lucide-react";
import { useState } from "react";
import type { CurrentCashStatusResponse, CashRegisterResponse } from "../../cash_register/types";
import { Button } from "../../../components/Button/Button";

interface POSCashBarProps {
  cashStatus: CurrentCashStatusResponse | null | undefined;
  isLoading?: boolean;
  registers?: CashRegisterResponse[];
  selectedRegisterId?: number | null;
  onSelectRegister?: (id: number) => void;
  onOpenCashModal: () => void;
  onOpenSupplyModal: () => void;
  onOpenBleedModal: () => void;
  onOpenCloseCashModal: () => void;
  onOpenStatementModal: () => void;
}

export default function POSCashBar({
  cashStatus,
  registers = [],
  selectedRegisterId,
  onSelectRegister,
  onOpenCashModal,
  onOpenSupplyModal,
  onOpenBleedModal,
  onOpenCloseCashModal,
  onOpenStatementModal,
}: POSCashBarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [registerAnchorEl, setRegisterAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const isRegisterMenuOpen = Boolean(registerAnchorEl);

  const isOpen = cashStatus?.is_open ?? false;
  const currentSession = cashStatus?.current_session;
  const drawerBalance = currentSession?.current_balance ?? 0;
  
  const currentRegister = registers.find((r) => r.id === selectedRegisterId) || (currentSession?.cash_register);
  const registerName = currentRegister?.name ?? "Caixa Principal";

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRegisterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setRegisterAnchorEl(event.currentTarget);
  };

  const handleRegisterMenuClose = () => {
    setRegisterAnchorEl(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1, sm: 1.25 },
        mb: 1,
        borderRadius: 3,
        border: "1px solid",
        borderColor: isOpen ? "#BBF7D0" : "#FDE68A",
        bgcolor: isOpen ? "#F0FDF4" : "#FFFBEB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        gap: 1,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Left Info */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: isOpen ? "#DCFCE7" : "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isOpen ? "#16A34A" : "#D97706",
            flexShrink: 0,
          }}
        >
          {isOpen ? <Unlock size={18} /> : <Lock size={18} />}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {registers.length > 1 && onSelectRegister ? (
              <>
                <Box
                  onClick={handleRegisterMenuOpen}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    px: 1,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: "rgba(0,0,0,0.04)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <Monitor size={14} color="#475569" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: { xs: "0.85rem", sm: "0.95rem" } }} noWrap>
                    {registerName}
                  </Typography>
                  <ChevronDown size={14} color="#64748B" />
                </Box>

                <Menu
                  anchorEl={registerAnchorEl}
                  open={isRegisterMenuOpen}
                  onClose={handleRegisterMenuClose}
                  PaperProps={{ sx: { borderRadius: 2.5, minWidth: 180, p: 0.5 } }}
                >
                  <Typography variant="caption" sx={{ px: 2, py: 1, display: "block", color: "#64748B", fontWeight: 700 }}>
                    TERMINAIS DISPONÍVEIS
                  </Typography>
                  {registers.map((reg) => {
                    const isSelected = reg.id === (selectedRegisterId || currentRegister?.id);
                    return (
                      <MenuItem
                        key={reg.id}
                        onClick={() => {
                          onSelectRegister(reg.id);
                          handleRegisterMenuClose();
                        }}
                        selected={isSelected}
                        sx={{ borderRadius: 1.5, gap: 1, fontWeight: isSelected ? 800 : 500 }}
                      >
                        <ListItemIcon sx={{ minWidth: 24, color: isSelected ? "#2563EB" : "#94A3B8" }}>
                          {isSelected ? <Check size={16} /> : <Monitor size={16} />}
                        </ListItemIcon>
                        <ListItemText primary={reg.name} primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: isSelected ? 700 : 500 }} />
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            ) : (
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#111827", fontSize: { xs: "0.85rem", sm: "0.95rem" } }} noWrap>
                {registerName}
              </Typography>
            )}

            <Chip
              label={isOpen ? "Aberto" : "Fechado"}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 800,
                bgcolor: isOpen ? "#16A34A" : "#D97706",
                color: "#ffffff",
              }}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{ color: "#374151", fontWeight: 600, display: "block", fontSize: { xs: "0.72rem", sm: "0.8rem" } }}
            noWrap
          >
            {isOpen ? (
              <>
                Gaveta: <strong style={{ color: "#111827" }}>R$ {drawerBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                {currentSession?.session.opened_by_name && (
                  <span style={{ color: "#4B5563" }}> • {currentSession.session.opened_by_name}</span>
                )}
              </>
            ) : (
              <>
                Fundo anterior: <strong style={{ color: "#111827" }}>R$ {(cashStatus?.suggested_opening_amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Right Actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {isOpen ? (
          <>
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.75 }}>
              <MuiButton
                size="small"
                variant="outlined"
                onClick={onOpenSupplyModal}
                startIcon={<ArrowUpRight size={14} />}
                sx={{
                  borderColor: "#86EFAC",
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  py: 0.4,
                  px: 1.25,
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  "&:hover": { bgcolor: "#DCFCE7", borderColor: "#4ADE80" },
                }}
              >
                Suprimento
              </MuiButton>

              <MuiButton
                size="small"
                variant="outlined"
                onClick={onOpenBleedModal}
                startIcon={<ArrowDownRight size={14} />}
                sx={{
                  borderColor: "#FCD34D",
                  color: "#92400E",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  py: 0.4,
                  px: 1.25,
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  "&:hover": { bgcolor: "#FEF3C7", borderColor: "#FBBF24" },
                }}
              >
                Sangria
              </MuiButton>

              <MuiButton
                size="small"
                variant="outlined"
                onClick={onOpenStatementModal}
                startIcon={<Receipt size={14} />}
                sx={{
                  borderColor: "#BFDBFE",
                  color: "#1E40AF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  py: 0.4,
                  px: 1.25,
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  "&:hover": { bgcolor: "#DBEAFE", borderColor: "#93C5FD" },
                }}
              >
                Extrato
              </MuiButton>

              <MuiButton
                size="small"
                variant="contained"
                onClick={onOpenCloseCashModal}
                startIcon={<Lock size={14} />}
                sx={{
                  bgcolor: "#DC2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  py: 0.4,
                  px: 1.5,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#B91C1C" },
                }}
              >
                Fechar Caixa
              </MuiButton>
            </Box>

            {/* Mobile Dropdown Menu */}
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ display: { xs: "flex", md: "none" }, color: "#374151" }}
            >
              <MoreVertical size={18} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { borderRadius: 2.5, minWidth: 180, p: 0.5, border: "1px solid #E5E7EB" },
              }}
            >
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
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={onOpenCashModal}
            startIcon={<Unlock size={14} />}
            sx={{
              bgcolor: "#16A34A",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.75rem",
              py: 0.6,
              px: 2,
              borderRadius: 2,
              "&:hover": { bgcolor: "#15803D" },
            }}
          >
            Abrir Caixa
          </Button>
        )}
      </Box>
    </Paper>
  );
}
