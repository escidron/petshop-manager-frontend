import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { X, Receipt } from "lucide-react";
import CashStatementView from "./CashStatementView";
import type { CashSessionDetailResponse } from "./types";

interface CashStatementModalProps {
  open: boolean;
  onClose: () => void;
  sessionData: CashSessionDetailResponse | null;
  onOpenSupply: () => void;
  onOpenBleed: () => void;
  onOpenClose: () => void;
  onOpenOpenModal: () => void;
  onPrint: () => void;
}

export default function CashStatementModal({
  open,
  onClose,
  sessionData,
  onOpenSupply,
  onOpenBleed,
  onOpenClose,
  onOpenOpenModal,
  onPrint,
}: CashStatementModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          bgcolor: "#F9FAFB",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 1.5, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt size={20} color="#2563EB" />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
            Extrato e Movimentações do Caixa
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1 }}>
        <CashStatementView
          sessionData={sessionData}
          onOpenSupply={() => {
            onClose();
            onOpenSupply();
          }}
          onOpenBleed={() => {
            onClose();
            onOpenBleed();
          }}
          onOpenClose={() => {
            onClose();
            onOpenClose();
          }}
          onOpenOpenModal={() => {
            onClose();
            onOpenOpenModal();
          }}
          onPrint={onPrint}
        />
      </DialogContent>
    </Dialog>
  );
}
