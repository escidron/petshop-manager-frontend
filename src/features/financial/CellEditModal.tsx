import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { X, Edit3, Copy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertDREEntry } from "../../api/services/financial";
import MoneyInput from "./MoneyInput";
import { toast } from "react-toastify";

interface CellEditTarget {
  accountId: number;
  accountName: string;
  year: number;
  month: number;
  currentAmount: number;
}

interface Props {
  target: CellEditTarget | null;
  onClose: () => void;
  onOpenReplicate?: (account: { id: number; name: string }) => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CellEditModal({ target, onClose, onOpenReplicate }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (target) {
      setAmount(target.currentAmount || 0);
      setNotes("");
    }
  }, [target]);

  const upsertMutation = useMutation({
    mutationFn: upsertDREEntry,
    onSuccess: () => {
      if (target) {
        queryClient.invalidateQueries({ queryKey: ["dre-report", target.year] });
      }
      toast.success("Valor atualizado!");
      onClose();
    },
    onError: () => {
      toast.error("Erro ao atualizar valor.");
    },
  });

  if (!target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    upsertMutation.mutate({
      account_id: target.accountId,
      competence_year: target.year,
      competence_month: target.month,
      amount: amount || 0,
      notes: notes.trim() || undefined,
    });
  };

  const monthLabel = MONTH_NAMES[target.month - 1];

  return (
    <Dialog open={Boolean(target)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Edit3 size={18} color="var(--mui-palette-primary-main)" />
          <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
            Editar Lançamento
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Box component="form" id="cell-edit-form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
              Conta
            </Typography>
            <Typography variant="body1" fontWeight={600} color="text.primary">
              {target.accountName}
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={500} sx={{ mt: 0.5 }}>
              Competência: {monthLabel} de {target.year}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Valor em Reais
              </Typography>
              <MoneyInput
                autoFocus
                value={amount}
                onChange={(val) => setAmount(val)}
                fullWidth
              />
            </Box>

            <TextField
              label="Anotação / Detalhe (Opcional)"
              placeholder="Ex: Pagamento adiantado"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, display: "flex", justifyContent: "space-between" }}>
        {onOpenReplicate ? (
          <Button
            size="small"
            color="secondary"
            startIcon={<Copy size={15} />}
            onClick={() => {
              const acc = { id: target.accountId, name: target.accountName };
              onClose();
              onOpenReplicate(acc);
            }}
            sx={{ textTransform: "none" }}
          >
            Lançar despesas
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="cell-edit-form"
            variant="contained"
            size="small"
            disabled={upsertMutation.isPending}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {upsertMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
