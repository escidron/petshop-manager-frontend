import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { PaymentMethod } from "./types";

type Props = {
  card: PaymentMethod;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function CardDeleteModal({
  card,
  open,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Remover cartão</DialogTitle>

      <DialogContent>
        <Typography variant="body2">
          Tem certeza que deseja remover o cartão{" "}
          <strong>•••• {card.last4}</strong>? Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant="text" onClick={onCancel}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ bgcolor: "error.light" }}
        >
          Remover
        </Button>
      </DialogActions>
    </Dialog>
  );
}
