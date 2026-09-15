import { useState, useEffect, type FormEvent, type ReactNode } from "react";
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
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  alpha,
} from "@mui/material";
import { X, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      color="text.secondary"
      sx={{ display: "block", mb: 0.5, fontSize: "0.78rem" }}
    >
      {children}
      {required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
    </Typography>
  );
}

const dayOfWeekFormatter = (day: dayjs.Dayjs) => {
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return days[day.day()];
};

const datePickerPopperSx = {
  "& .MuiDayCalendar-weekDayLabel": {
    color: "#3d4048 !important",
    fontWeight: 700,
    fontSize: "0.75rem",
  },
  "& .MuiPickersDay-root": {
    color: "#3d4048 !important",
    "&.Mui-selected": {
      color: "white !important",
    },
    "&.Mui-disabled": {
      color: "#b8bbc2 !important",
      opacity: 0.4,
    },
  },
  "& .MuiPickersCalendarHeader-label": {
    color: "#3d4048 !important",
  },
  "& .MuiPickersArrowSwitcher-button": {
    color: "#3d4048 !important",
  },
};

export default function BillSettleModal({ open, onClose, bill, onSettle }: Props) {
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paidAmountError, setPaidAmountError] = useState<string>("");
  const [paymentDateError, setPaymentDateError] = useState<string>("");

  useEffect(() => {
    if (bill) {
      setPaymentDate(dayjs().format("YYYY-MM-DD"));
      setPaidAmount(bill.amount || 0);
      setDiscountAmount(0);
      setFineAmount(0);
      setPaymentMethod(bill.payment_method || "pix");
      setNotes("");
      setPaidAmountError("");
      setPaymentDateError("");
    }
  }, [bill, open]);

  if (!bill) return null;

  const isPayable = bill.bill_type === "payable";

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!paymentDate) {
      setPaymentDateError("Informe a data do pagamento.");
      hasError = true;
    } else {
      setPaymentDateError("");
    }

    if (!paidAmount || paidAmount <= 0) {
      setPaidAmountError("O valor deve ser maior que zero.");
      hasError = true;
    } else {
      setPaidAmountError("");
    }

    if (hasError) {
      toast.error("Por favor, preencha os campos obrigatórios corretamente.");
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
            <Box>
              <FieldLabel required>Data do Pagamento</FieldLabel>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  format="DD/MM/YYYY"
                  value={paymentDate ? dayjs(paymentDate) : null}
                  onChange={(newDate) => {
                    if (newDate && newDate.isValid()) {
                      setPaymentDate(newDate.format("YYYY-MM-DD"));
                      setPaymentDateError("");
                    } else {
                      setPaymentDate("");
                    }
                  }}
                  dayOfWeekFormatter={dayOfWeekFormatter}
                  slotProps={{
                    popper: {
                      sx: datePickerPopperSx,
                    },
                    textField: {
                      size: "small",
                      fullWidth: true,
                      placeholder: "DD/MM/AAAA",
                      error: Boolean(paymentDateError),
                      helperText: paymentDateError,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box>
              <FieldLabel required>
                {isPayable ? "Valor Efetivamente Pago" : "Valor Efetivamente Recebido"}
              </FieldLabel>
              <MoneyInput
                value={paidAmount}
                onChange={(val) => {
                  setPaidAmount(val);
                  if (val > 0) {
                    setPaidAmountError("");
                  }
                }}
                placeholder="0,00"
                fullWidth
                error={Boolean(paidAmountError)}
                helperText={paidAmountError}
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <FieldLabel>Desconto Obtido / Concedido</FieldLabel>
              <MoneyInput
                value={discountAmount}
                onChange={(val) => setDiscountAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>

            <Box>
              <FieldLabel>Juros / Multa</FieldLabel>
              <MoneyInput
                value={fineAmount}
                onChange={(val) => setFineAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>
          </Box>

          <Box>
            <FieldLabel required>Forma de Pagamento Utilizada</FieldLabel>
            <Select
              size="small"
              fullWidth
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FieldLabel>Observações da Liquidação (opcional)</FieldLabel>
            <TextField
              size="small"
              multiline
              rows={2}
              placeholder="Ex: Pago via app do banco, comprovante guardado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Box>
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
