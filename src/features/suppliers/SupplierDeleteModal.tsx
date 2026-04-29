import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { Supplier } from "./types";

type Props = {
  supplier: Supplier;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function SupplierDeleteModal({
  supplier,
  open,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Excluir Fornecedor</DialogTitle>

      <DialogContent>
        Tem certeza que deseja excluir o fornecedor <strong>{supplier.name}</strong>?
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button variant="text" onClick={onCancel}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{ bgcolor: "error.light", "&:hover": { bgcolor: "error.main" } }}
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
