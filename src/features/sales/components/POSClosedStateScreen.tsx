import {
  Box,
  Paper,
  Typography,
  Button as MuiButton,
  Divider,
} from "@mui/material";
import { Lock, CheckCircle, Receipt } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openCashSession } from "../../../api/services/cash";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../../components/Button/Button";
import type { CurrentCashStatusResponse } from "../../cash_register/types";

interface POSClosedStateScreenProps {
  cashStatus: CurrentCashStatusResponse | null | undefined;
  onOpenSupply: () => void;
  onOpenBleed: () => void;
  onViewHistory: () => void;
}

export default function POSClosedStateScreen({
  cashStatus,
  onViewHistory,
}: POSClosedStateScreenProps) {
  const suggestedAmount = cashStatus?.suggested_opening_amount ?? 0;

  const queryClient = useQueryClient();
  const toast = useToast();

  const openMutation = useMutation({
    mutationFn: openCashSession,
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso! Boas vendas.");
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao abrir o caixa.");
    },
  });

  const handleConfirmOpening = () => {
    openMutation.mutate({
      initial_amount: suggestedAmount,
      notes: "Conferência matinal confirmada",
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        width: "100%",
        p: { xs: 1.5, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 4.5 },
          borderRadius: 4,
          border: "1px solid #E5E7EB",
          bgcolor: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Lock Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#D97706",
            mb: 2,
            boxShadow: "0 0 0 8px #FFFBEB",
          }}
        >
          <Lock size={32} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 1, fontSize: { xs: "1.35rem", sm: "1.55rem" } }}>
          O Caixa está Fechado
        </Typography>

        <Typography variant="body2" sx={{ color: "#4B5563", maxWidth: 430, lineHeight: 1.6, mb: 3, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
          Confira o valor da gaveta de dinheiro do caixa para iniciar suas vendas. O valor abaixo corresponde ao saldo deixado no último fechamento.
        </Typography>

        {/* Value Box */}
        <Box
          sx={{
            width: "100%",
            bgcolor: "#F9FAFB",
            borderRadius: 3,
            p: 2.5,
            border: "1px solid #E5E7EB",
            mb: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
            Valor em dinheiro na gaveta
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827", fontSize: { xs: "1.85rem", sm: "2.35rem" } }}>
            R$ {suggestedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {/* Main Action Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleConfirmOpening}
          loading={openMutation.isPending}
          startIcon={<CheckCircle size={20} />}
          sx={{
            bgcolor: "#16A34A",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "1.05rem",
            py: 1.5,
            borderRadius: 2.5,
            mb: 2,
            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
            "&:hover": { bgcolor: "#15803D" },
          }}
        >
          Conferido • Abrir Caixa
        </Button>

        <Divider sx={{ width: "100%", my: 1.5, borderColor: "#E5E7EB" }} />

        {/* View Statement Button */}
        <MuiButton
          variant="outlined"
          fullWidth
          startIcon={<Receipt size={17} />}
          onClick={onViewHistory}
          sx={{
            color: "#374151",
            borderColor: "#D1D5DB",
            bgcolor: "#ffffff",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            py: 1,
            borderRadius: 2.5,
            "&:hover": { color: "#111827", bgcolor: "#F3F4F6", borderColor: "#9CA3AF" },
          }}
        >
          Ver Extrato do Caixa / Movimentações
        </MuiButton>
      </Paper>
    </Box>
  );
}
