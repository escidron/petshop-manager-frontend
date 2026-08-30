import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Button as MuiButton,
  Divider,
} from "@mui/material";
import { X, Printer } from "lucide-react";
import dayjs from "dayjs";
import type { CashSessionDetailResponse } from "./types";
import { Button } from "../../components/Button/Button";

interface CashReceiptPrintModalProps {
  open: boolean;
  onClose: () => void;
  sessionData: CashSessionDetailResponse | null;
  tenantName?: string;
}

export default function CashReceiptPrintModal({
  open,
  onClose,
  sessionData,
  tenantName = "Petshop Manager",
}: CashReceiptPrintModalProps) {
  if (!sessionData) return null;

  const handlePrint = () => {
    window.print();
  };

  const { session, payment_methods, cash_register, total_sales_amount, total_supplies, total_bleeds } = sessionData;
  const initialAmount = session.initial_amount;
  const actualAmount = session.actual_closing_amount ?? sessionData.current_balance;
  const expectedAmount = session.expected_closing_amount ?? sessionData.current_balance;
  const difference = session.difference_amount ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 1.5 }} className="no-print">
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Comprovante de Caixa
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        {/* Printable Thermal Receipt Box */}
        <Box
          id="cash-receipt-print-area"
          sx={{
            fontFamily: "monospace",
            bgcolor: "#ffffff",
            p: 2.5,
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            maxWidth: "320px",
            mx: "auto",
            color: "#111827",
            lineHeight: 1.4,
            "@media print": {
              border: "none",
              p: 0,
              width: "100%",
              maxWidth: "100%",
            },
          }}
        >
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", textTransform: "uppercase" }}>
              {tenantName}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
              FECHAMENTO DE CAIXA
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#374151" }}>
              {cash_register.name} • Sessão #{session.id}
            </Typography>
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderColor: "#9CA3AF", my: 1 }} />

          {/* Times & Users */}
          <Box sx={{ fontSize: "0.75rem", mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Abertura:</span>
              <span>{dayjs(session.opened_at).format("DD/MM/YYYY HH:mm")}</span>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>Operador Abr.:</span>
              <span>{session.opened_by_name || "-"}</span>
            </Box>
            {session.closed_at && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Fechamento:</span>
                  <span>{dayjs(session.closed_at).format("DD/MM/YYYY HH:mm")}</span>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Operador Fech.:</span>
                  <span>{session.closed_by_name || "-"}</span>
                </Box>
              </>
            )}
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderColor: "#9CA3AF", my: 1 }} />

          {/* Sales Breakdown */}
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, mb: 0.5, textTransform: "uppercase" }}>
            Vendas por Forma de Pagamento
          </Typography>
          {payment_methods.map((pm) => (
            <Box key={pm.method} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
              <span>{pm.label} ({pm.count}):</span>
              <span>R$ {pm.total_amount.toFixed(2)}</span>
            </Box>
          ))}
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 800, mt: 0.5 }}>
            <span>TOTAL VENDAS:</span>
            <span>R$ {total_sales_amount.toFixed(2)}</span>
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderColor: "#9CA3AF", my: 1 }} />

          {/* Cash Drawer Flow */}
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, mb: 0.5, textTransform: "uppercase" }}>
            Movimentação da Gaveta (Dinheiro)
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span>(+) Fundo Inicial:</span>
            <span>R$ {initialAmount.toFixed(2)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span>(+) Vendas Dinheiro:</span>
            <span>
              R${" "}
              {(
                payment_methods.find((p) => p.method === "money")?.total_amount || 0
              ).toFixed(2)}
            </span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span>(+) Suprimentos:</span>
            <span>R$ {total_supplies.toFixed(2)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span>(-) Sangrias:</span>
            <span>R$ {total_bleeds.toFixed(2)}</span>
          </Box>

          <Divider sx={{ borderStyle: "dashed", borderColor: "#9CA3AF", my: 1 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 800 }}>
            <span>Saldo Esperado:</span>
            <span>R$ {expectedAmount.toFixed(2)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 900 }}>
            <span>Saldo Informado:</span>
            <span>R$ {actualAmount.toFixed(2)}</span>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              fontWeight: 800,
              color: difference === 0 ? "#16A34A" : difference < 0 ? "#DC2626" : "#2563EB",
              mt: 0.5,
            }}
          >
            <span>Diferença:</span>
            <span>
              {difference >= 0 ? "+" : ""}R$ {difference.toFixed(2)}
            </span>
          </Box>

          {session.closing_notes && (
            <Box sx={{ mt: 1, fontSize: "0.7rem", color: "#374151" }}>
              <strong>Obs:</strong> {session.closing_notes}
            </Box>
          )}

          <Divider sx={{ borderStyle: "dashed", borderColor: "#9CA3AF", my: 2 }} />

          <Box sx={{ textAlign: "center", mt: 3, pt: 2 }}>
            <Box sx={{ borderTop: "1px solid #111827", width: "80%", mx: "auto", mb: 0.5 }} />
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
              Assinatura do Operador
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: "#E5E7EB" }} className="no-print" />

      <DialogActions sx={{ px: 2.5, py: 1.5 }} className="no-print">
        <MuiButton
          onClick={onClose}
          sx={{
            color: "#4B5563",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { bgcolor: "#F3F4F6", color: "#111827" },
          }}
        >
          Fechar
        </MuiButton>
        <Button
          variant="contained"
          onClick={handlePrint}
          startIcon={<Printer size={18} />}
          sx={{
            bgcolor: "#2563EB",
            color: "#ffffff",
            fontWeight: 800,
            px: 3,
            py: 0.8,
            borderRadius: 2,
            "&:hover": { bgcolor: "#1D4ED8" },
          }}
        >
          Imprimir Comprovante
        </Button>
      </DialogActions>
    </Dialog>
  );
}
