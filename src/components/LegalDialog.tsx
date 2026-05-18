import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { LEGAL_CONTENT } from "../constants/legal";
import { Button } from "./Button/Button";

interface LegalDialogProps {
  open: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

const LegalDialog = ({ open, onClose, type }: LegalDialogProps) => {
  const content = LEGAL_CONTENT[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5" fontWeight={800} color="primary.main">
          {content.title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X size={24} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4 }}>
        {content.content}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700 }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LegalDialog;
