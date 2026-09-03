import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { CommissionRule } from "./types";

type Props = {
  rule: CommissionRule;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function CommissionRuleDeleteModal({
  rule,
  open,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2.5,
            m: { xs: 2, sm: 3 },
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Excluir Regra de Comissão
      </DialogTitle>

      <DialogContent sx={{ color: "text.secondary" }}>
        Tem certeza que deseja excluir a regra <strong>{rule.name}</strong>? Esta ação não pode ser desfeita.
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          gap: 1.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
          "& > button": {
            width: { xs: "100%", sm: "auto" },
            minHeight: 42,
            borderRadius: 2,
          },
        }}
      >
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          color="error"
          sx={{ fontWeight: 700 }}
        >
          {loading ? "Excluindo..." : "Excluir Regra"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
