import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { Client } from "./types";

type Props = {
  client: Client;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ClientDeleteModal({
  client,
  open,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Excluir cliente</DialogTitle>

      <DialogContent>
        Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>?
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant="text" onClick={onCancel}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{bgcolor:'error.light'}}
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
