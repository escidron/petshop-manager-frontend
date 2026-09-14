import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  alpha,
} from "@mui/material";
import { X, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import MoneyInput from "../MoneyInput";
import type { FinancialBill, FinancialBillSettle } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  bill: FinancialBill | null;
  onSettle: (id: number, data: FinancialBillSettle) => Promise<void>;
}

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "bank_slip", label: "Boleto Bancário" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "money", label: "Dinheiro em Espécie" },
  { value: "other", label: "Outro" },
];

export default function BillSettleModal({ open, onClose, bill, onSettle }: Props) {
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bill) {
      setPaymentDate(dayjs().format("YYYY-MM-DD"));
      setPaidAmount(bill.amount || 0);
      setDiscountAmount(0);
      setFineAmount(0);
      setPaymentMethod(bill.payment_method || "pix");
      setNotes("");
    }
  }, [bill, open]);

  if (!bill) return null;

  const isPayable = bill.bill_type === "payable";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidAmount || paidAmount < 0) {
      toast.error("Informe um valor pago válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: FinancialBillSettle = {
        payment_date: paymentDate,
        paid_amount: paidAmount,
        discount_amount: discountAmount || 0,
        fine_or_interest_amount: fineAmount || 0,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      };
      await onSettle(bill.id, payload);
      toast.success(isPayable ? "Conta marcada como PAGA com sucesso!" : "Recebimento confirmado com sucesso!");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao liquidar conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleConfirm}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 2,
                bgcolor: isPayable ? alpha("#10B981", 0.12) : alpha("#3B82F6", 0.12),
                color: isPayable ? "#10B981" : "#3B82F6",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CheckCircle2 size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {isPayable ? "Dar Baixa / Confirmar Pagamento" : "Confirmar Recebimento"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Liquidação financeira do título
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Card Resumo do Título */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(isPayable ? "#EF4444" : "#10B981", 0.05),
              border: "1px solid",
              borderColor: alpha(isPayable ? "#EF4444" : "#10B981", 0.2),
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                  {isPayable ? "Conta a Pagar" : "Conta a Receber"}
                </Typography>
                <Typography variant="subtitle1" fontWeight={800}>
                  {bill.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isPayable ? `Fornecedor: ${bill.supplier_name || "Não informado"}` : `Cliente: ${bill.client_name || "Não informado"}`}
                  {" • "}
                  Vencimento: {dayjs(bill.due_date).format("DD/MM/YYYY")}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Valor Nominal
                </Typography>
                <Typography variant="h6" fontWeight={800} color={isPayable ? "#DC2626" : "#059669"}>
                  {bill.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Dados da Liquidação */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Data do Pagamento *"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                {isPayable ? "Valor Efetivamente Pago *" : "Valor Efetivamente Recebido *"}
              </Typography>
              <MoneyInput
                value={paidAmount}
                onChange={(val) => setPaidAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Desconto Obtido / Concedido
              </Typography>
              <MoneyInput
                value={discountAmount}
                onChange={(val) => setDiscountAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Juros / Multa
              </Typography>
              <MoneyInput
                value={fineAmount}
                onChange={(val) => setFineAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel id="settle-payment-method-label">Forma de Pagamento Utilizada</InputLabel>
            <Select
              labelId="settle-payment-method-label"
              value={paymentMethod}
              label="Forma de Pagamento Utilizada"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Observações da Liquidação (opcional)"
            size="small"
            multiline
            rows={2}
            placeholder="Ex: Pago via app do banco, comprovante guardado..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting} sx={{ borderRadius: 2 }}>
            Voltar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {isSubmitting ? "Liquidando..." : isPayable ? "Confirmar Pagamento" : "Confirmar Recebimento"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
