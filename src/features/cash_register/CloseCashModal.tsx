import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button as MuiButton,
  Divider,
  Paper,
  Chip,
} from "@mui/material";
import { X, Lock, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeCashSession } from "../../api/services/cash";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import type { CashSessionDetailResponse } from "./types";

interface CloseCashModalProps {
  open: boolean;
  onClose: () => void;
  currentSession: CashSessionDetailResponse | null;
  cashRegisterId?: number | null;
  onPrintReceipt?: (session: CashSessionDetailResponse) => void;
}

export default function CloseCashModal({
  open,
  onClose,
  currentSession,
  cashRegisterId,
  onPrintReceipt,
}: CloseCashModalProps) {
  const expectedBalance = currentSession?.current_balance ?? 0;
  const [actualAmountStr, setActualAmountStr] = useState<string>("0,00");
  const [closingNotes, setClosingNotes] = useState<string>("");

  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setActualAmountStr(
        expectedBalance.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      setClosingNotes("");
    }
  }, [open, expectedBalance]);

  const closeMutation = useMutation({
    mutationFn: closeCashSession,
    onSuccess: (closedData) => {
      toast.success("Caixa fechado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      onClose();
      if (onPrintReceipt) {
        onPrintReceipt(closedData);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao fechar o caixa.");
    },
  });

  const numericActual = parseFloat(actualAmountStr.replace(/\./g, "").replace(",", ".")) || 0;
  const difference = Math.round((numericActual - expectedBalance) * 100) / 100;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numberValue = (parseInt(raw || "0", 10) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setActualAmountStr(numberValue);
  };

  const handleConfirmClose = () => {
    closeMutation.mutate({
      actual_closing_amount: numericActual,
      closing_notes: closingNotes.trim() || null,
      cash_register_id: cashRegisterId || currentSession?.cash_register.id,
    });
  };

  if (!currentSession) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          bgcolor: "#ffffff",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Lock size={20} color="#DC2626" />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Fechamento de Caixa
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 2 }}>
        {/* Sales by Payment Method Summary */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: "#F9FAFB",
            borderRadius: 2.5,
            border: "1px solid #E5E7EB",
            mb: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1F2937", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 }}>
            Vendas do Turno por Forma de Pagamento
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {currentSession.payment_methods.map((pm) => (
              <Box
                key={pm.method}
                sx={{
                  flex: { xs: "1 1 calc(50% - 12px)", sm: "1 1 calc(33.333% - 12px)" },
                  bgcolor: "#ffffff",
                  p: 1.25,
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  boxSizing: "border-box",
                }}
              >
                <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, display: "block" }}>
                  {pm.label} ({pm.count})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#111827" }}>
                  R$ {pm.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "#E5E7EB" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#1F2937" }}>
              Total Geral de Vendas
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#16A34A" }}>
              R$ {currentSession.total_sales_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Paper>

        {/* Drawer Physical Counting & Reconciliation */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "#F3F4F6",
            border: "1px solid #E5E7EB",
            mb: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1F2937", mb: 1, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 }}>
            Conferência da Gaveta de Dinheiro
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="body2" sx={{ color: "#4B5563", fontWeight: 600 }}>
              Saldo Esperado no Sistema:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: "#111827" }}>
              R$ {expectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ color: "#1F2937", fontWeight: 700, mb: 0.5 }}>
              Valor em Dinheiro Contado Fisicamente na Gaveta (R$)
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={actualAmountStr}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: "#111827" }}>R$</Typography></InputAdornment>,
              }}
              inputProps={{
                style: {
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#111827",
                },
              }}
            />
          </Box>

          {/* Difference Indicator */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px dashed #D1D5DB" }}>
            <Typography variant="body2" sx={{ color: "#374151", fontWeight: 700 }}>
              Diferença Apurada:
            </Typography>
            {difference === 0 ? (
              <Chip
                icon={<CheckCircle2 size={16} />}
                label="Caixa Exato (R$ 0,00)"
                size="small"
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#166534",
                  fontWeight: 800,
                }}
              />
            ) : difference < 0 ? (
              <Chip
                icon={<AlertTriangle size={16} />}
                label={`Quebra / Falta: R$ ${Math.abs(difference).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                size="small"
                sx={{
                  bgcolor: "#FEE2E2",
                  color: "#991B1B",
                  fontWeight: 800,
                }}
              />
            ) : (
              <Chip
                icon={<TrendingUp size={16} />}
                label={`Sobra / Excesso: +R$ ${difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                size="small"
                sx={{
                  bgcolor: "#DBEAFE",
                  color: "#1E40AF",
                  fontWeight: 800,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Closing Notes */}
        <TextField
          label="Observações / Justificativa do Fechamento"
          value={closingNotes}
          onChange={(e) => setClosingNotes(e.target.value)}
          size="small"
          fullWidth
          placeholder="Ex: Fundo de troco de R$ 100,00 mantido na gaveta para amanhã"
          sx={{
            "& .MuiInputBase-input": { color: "#111827" },
            "& .MuiInputLabel-root": { color: "#4B5563" },
          }}
        />
      </DialogContent>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <MuiButton
          onClick={onClose}
          sx={{
            color: "#4B5563",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { bgcolor: "#F3F4F6", color: "#111827" },
          }}
        >
          Cancelar
        </MuiButton>
        <Button
          variant="contained"
          onClick={handleConfirmClose}
          loading={closeMutation.isPending}
          startIcon={<Lock size={18} />}
          sx={{
            bgcolor: "#DC2626",
            color: "#ffffff",
            fontWeight: 800,
            px: 3,
            py: 0.8,
            borderRadius: 2,
            "&:hover": { bgcolor: "#B91C1C" },
          }}
        >
          Confirmar Fechamento de Caixa
        </Button>
      </DialogActions>
    </Dialog>
  );
}
