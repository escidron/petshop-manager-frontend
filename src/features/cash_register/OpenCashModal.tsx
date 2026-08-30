import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { X, CheckCircle, Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openCashSession } from "../../api/services/cash";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import type { CurrentCashStatusResponse } from "./types";

interface OpenCashModalProps {
  open: boolean;
  onClose: () => void;
  cashStatus?: CurrentCashStatusResponse | null;
  onOpenSupply?: () => void;
  onOpenBleed?: () => void;
  onViewHistory?: () => void;
}

export default function OpenCashModal({
  open,
  onClose,
  cashStatus,
}: OpenCashModalProps) {
  const suggestedAmount = cashStatus?.suggested_opening_amount ?? 0;

  const queryClient = useQueryClient();
  const toast = useToast();

  const openMutation = useMutation({
    mutationFn: openCashSession,
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso! Boas vendas.");
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao abrir o caixa.");
    },
  });

  const handleConfirm = () => {
    openMutation.mutate({
      initial_amount: suggestedAmount,
      notes: "Conferência matinal confirmada",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: { xs: 1.5, sm: 2 },
          bgcolor: "#ffffff",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.5, pt: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Abertura de Caixa
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 1.5, py: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Lock Icon */}
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            bgcolor: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#D97706",
            mb: 2,
            boxShadow: "0 0 0 6px #FFFBEB",
          }}
        >
          <Lock size={26} />
        </Box>

        <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.5, mb: 2.5 }}>
          Confira o valor em dinheiro na gaveta para iniciar as operações do caixa.
        </Typography>

        {/* Value Display Box */}
        <Box
          sx={{
            width: "100%",
            bgcolor: "#F9FAFB",
            borderRadius: 2.5,
            p: 2,
            border: "1px solid #E5E7EB",
            mb: 3,
            boxSizing: "border-box",
          }}
        >
          <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 0.5 }}>
            Valor em dinheiro na gaveta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827" }}>
            R$ {suggestedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {/* Confirm Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleConfirm}
          loading={openMutation.isPending}
          startIcon={<CheckCircle size={20} />}
          sx={{
            bgcolor: "#16A34A",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "1rem",
            py: 1.25,
            borderRadius: 2.5,
            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
            "&:hover": { bgcolor: "#15803D" },
          }}
        >
          Conferido • Abrir Caixa
        </Button>
      </DialogContent>
    </Dialog>
  );
}
