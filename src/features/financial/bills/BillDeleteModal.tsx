import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { AlertTriangle, X, Trash2, Ban } from "lucide-react";
import { toast } from "react-toastify";
import type { FinancialBill } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  bill: FinancialBill | null;
  onDelete: (id: number) => Promise<void>;
  onCancelBill: (id: number) => Promise<void>;
}

export default function BillDeleteModal({
  open,
  onClose,
  bill,
  onDelete,
  onCancelBill,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<"cancel" | "delete" | null>(null);

  if (!bill) return null;

  const handleCancelBill = async () => {
    try {
      setLoadingAction("cancel");
      await onCancelBill(bill.id);
      toast.success("Conta cancelada com sucesso.");
      onClose();
    } catch {
      toast.error("Erro ao cancelar conta.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    try {
      setLoadingAction("delete");
      await onDelete(bill.id);
      toast.success("Conta excluída definitivamente.");
      onClose();
    } catch {
      toast.error("Erro ao excluir conta.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <AlertTriangle size={20} color="#DC2626" />
          <Typography variant="subtitle1" fontWeight={800}>
            Gerenciar Conta
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Você selecionou a conta:
        </Typography>

        <Box
          sx={{
            p: 1.75,
            mb: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            {bill.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Valor: {bill.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ fontSize: "0.8rem", borderRadius: 2 }}>
          Você pode <strong>Cancelar</strong> a conta (mantendo-a no histórico com status cancelado) ou <strong>Excluir</strong> definitivamente do banco de dados.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={!!loadingAction} sx={{ borderRadius: 2 }}>
          Voltar
        </Button>

        {bill.status !== "canceled" && (
          <Button
            variant="outlined"
            color="warning"
            onClick={handleCancelBill}
            disabled={!!loadingAction}
            startIcon={loadingAction === "cancel" ? <CircularProgress size={14} color="inherit" /> : <Ban size={14} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Cancelar Conta
          </Button>
        )}

        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={!!loadingAction}
          startIcon={loadingAction === "delete" ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
