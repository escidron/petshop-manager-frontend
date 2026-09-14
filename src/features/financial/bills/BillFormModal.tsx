import { useState, useEffect, useMemo } from "react";
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
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Chip,
  Paper,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import {
  X,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Split,
} from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import MoneyInput from "../MoneyInput";
import type {
  FinancialBill,
  BillType,
  FinancialBillCreate,
  FinancialBillUpdate,
} from "./types";
import type { DREAccount } from "../../../api/services/financial";
import type { Supplier } from "../../suppliers/types";
import type { Client } from "../../clients/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: FinancialBillCreate | FinancialBillUpdate, isEdit: boolean) => Promise<void>;
  editingBill?: FinancialBill | null;
  categories: DREAccount[];
  suppliers: Supplier[];
  clients: Client[];
  defaultType?: BillType;
}

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "bank_slip", label: "Boleto Bancário" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência Bancária (TED/DOC)" },
  { value: "money", label: "Dinheiro em Espécie" },
  { value: "other", label: "Outro" },
];

export default function BillFormModal({
  open,
  onClose,
  onSave,
  editingBill,
  categories,
  suppliers,
  clients,
  defaultType = "payable",
}: Props) {
  const theme = useTheme();
  const isEdit = Boolean(editingBill);

  const [billType, setBillType] = useState<BillType>(defaultType);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [clientId, setClientId] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [documentNumber, setDocumentNumber] = useState("");
  const [barcode, setBarcode] = useState("");
  const [notes, setNotes] = useState("");

  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa formulário
  useEffect(() => {
    if (editingBill) {
      setBillType(editingBill.bill_type);
      setDescription(editingBill.description || "");
      setAmount(editingBill.amount || 0);
      setDueDate(editingBill.due_date || dayjs().format("YYYY-MM-DD"));
      setIssueDate(editingBill.issue_date || dayjs().format("YYYY-MM-DD"));
      setCategoryId(editingBill.category_id || "");
      setSupplierId(editingBill.supplier_id || "");
      setClientId(editingBill.client_id || "");
      setPaymentMethod(editingBill.payment_method || "pix");
      setDocumentNumber(editingBill.document_number || "");
      setBarcode(editingBill.barcode || "");
      setNotes(editingBill.notes || "");
      setIsInstallment(false);
    } else {
      setBillType(defaultType);
      setDescription("");
      setAmount(0);
      setDueDate(dayjs().format("YYYY-MM-DD"));
      setIssueDate(dayjs().format("YYYY-MM-DD"));
      setCategoryId("");
      setSupplierId("");
      setClientId("");
      setPaymentMethod("pix");
      setDocumentNumber("");
      setBarcode("");
      setNotes("");
      setIsInstallment(false);
      setTotalInstallments(2);
    }
  }, [editingBill, defaultType, open]);

  // Filtra categorias apropriadas para despesa ou receita
  const filteredCategories = useMemo(() => {
    if (billType === "payable") {
      return categories.filter((c) =>
        ["fixed_expense", "variable_expense", "cmv", "financial_expense"].includes(
          c.group_type
        )
      );
    }
    return categories.filter((c) =>
      ["gross_revenue", "financial_revenue"].includes(c.group_type)
    );
  }, [categories, billType]);

  // Prévia das parcelas
  const installmentPreviews = useMemo(() => {
    if (!isInstallment || totalInstallments <= 1 || amount <= 0) return [];
    const baseAmount = Math.floor((amount / totalInstallments) * 100) / 100;
    const remainder = Math.round((amount - baseAmount * totalInstallments) * 100) / 100;
    const start = dayjs(dueDate);

    return Array.from({ length: totalInstallments }, (_, idx) => {
      const parcelNum = idx + 1;
      const parcelDate = start.add(idx, "month").format("DD/MM/YYYY");
      const parcelAmt = idx === 0 ? baseAmount + remainder : baseAmount;
      return { parcelNum, parcelDate, parcelAmt };
    });
  }, [isInstallment, totalInstallments, amount, dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Informe a descrição da conta.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }
    if (!dueDate) {
      toast.error("Informe a data de vencimento.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEdit && editingBill) {
        const payload: FinancialBillUpdate = {
          description: description.trim(),
          amount,
          due_date: dueDate,
          issue_date: issueDate,
          category_id: categoryId ? Number(categoryId) : null,
          supplier_id: billType === "payable" && supplierId ? Number(supplierId) : null,
          client_id: billType === "receivable" && clientId ? Number(clientId) : null,
          payment_method: paymentMethod || null,
          document_number: documentNumber.trim() || null,
          barcode: barcode.trim() || null,
          notes: notes.trim() || null,
        };
        await onSave(payload, true);
      } else {
        const payload: FinancialBillCreate = {
          bill_type: billType,
          description: description.trim(),
          amount,
          due_date: dueDate,
          issue_date: issueDate,
          category_id: categoryId ? Number(categoryId) : null,
          supplier_id: billType === "payable" && supplierId ? Number(supplierId) : null,
          client_id: billType === "receivable" && clientId ? Number(clientId) : null,
          payment_method: paymentMethod || null,
          document_number: documentNumber.trim() || null,
          barcode: barcode.trim() || null,
          notes: notes.trim() || null,
          total_installments: isInstallment ? totalInstallments : 1,
        };
        await onSave(payload, false);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao salvar conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPayable = billType === "payable";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
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
                bgcolor: isPayable ? alpha("#EF4444", 0.12) : alpha("#10B981", 0.12),
                color: isPayable ? "#EF4444" : "#10B981",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isPayable ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {isEdit ? "Editar Conta" : isPayable ? "Nova Conta a Pagar" : "Nova Conta a Receber"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isPayable ? "Lançamento de despesa / saída financeira" : "Lançamento de receita / entrada financeira"}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Seletor de Tipo (A Pagar vs A Receber) caso não seja edição */}
          {!isEdit && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                type="button"
                variant={billType === "payable" ? "contained" : "outlined"}
                onClick={() => setBillType("payable")}
                startIcon={<ArrowUpRight size={18} />}
                fullWidth
                sx={{
                  py: 1,
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: billType === "payable" ? "#DC2626" : "transparent",
                  borderColor: "#DC2626",
                  color: billType === "payable" ? "white" : "#DC2626",
                  "&:hover": {
                    bgcolor: billType === "payable" ? "#B91C1C" : alpha("#DC2626", 0.08),
                  },
                }}
              >
                Conta a Pagar (Despesa)
              </Button>

              <Button
                type="button"
                variant={billType === "receivable" ? "contained" : "outlined"}
                onClick={() => setBillType("receivable")}
                startIcon={<ArrowDownLeft size={18} />}
                fullWidth
                sx={{
                  py: 1,
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: billType === "receivable" ? "#059669" : "transparent",
                  borderColor: "#059669",
                  color: billType === "receivable" ? "white" : "#059669",
                  "&:hover": {
                    bgcolor: billType === "receivable" ? "#047857" : alpha("#059669", 0.08),
                  },
                }}
              >
                Conta a Receber (Receita)
              </Button>
            </Box>
          )}

          {/* Dados Principais: Descrição e Valor */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
            <TextField
              label="Descrição do Título / Conta *"
              size="small"
              fullWidth
              placeholder={isPayable ? "Ex: Aluguel do imóvel, Ração Golden 15kg" : "Ex: Venda de pacotes, Contrato mensal"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Valor Nominal *
              </Typography>
              <MoneyInput
                value={amount}
                onChange={(val) => setAmount(val)}
                placeholder="0,00"
                fullWidth
              />
            </Box>
          </Box>

          {/* Datas: Vencimento e Emissão */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Data de Vencimento *"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />

            <TextField
              label="Data de Emissão / Competência"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Box>

          {/* Categoria DRE e Fornecedor/Cliente */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {/* Categoria DRE */}
            <FormControl size="small" fullWidth>
              <InputLabel id="bill-category-label">Categoria (Plano de Contas DRE)</InputLabel>
              <Select
                labelId="bill-category-label"
                value={categoryId}
                label="Categoria (Plano de Contas DRE)"
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
              >
                <MenuItem value="">-- Nenhuma Categoria --</MenuItem>
                {filteredCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.code ? `[${c.code}] ` : ""}{c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Contato: Fornecedor (se Pagar) ou Cliente (se Receber) */}
            {isPayable ? (
              <Autocomplete
                size="small"
                options={suppliers}
                getOptionLabel={(opt) => opt.name || ""}
                value={suppliers.find((s) => s.id === supplierId) || null}
                onChange={(_, val) => setSupplierId(val ? val.id : "")}
                renderInput={(params) => (
                  <TextField {...params} label="Fornecedor (Favorecido)" placeholder="Selecione um fornecedor..." />
                )}
                noOptionsText="Nenhum fornecedor cadastrado"
              />
            ) : (
              <Autocomplete
                size="small"
                options={clients}
                getOptionLabel={(opt) => opt.name || ""}
                value={clients.find((c) => c.id === clientId) || null}
                onChange={(_, val) => setClientId(val ? val.id : "")}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente (Pagador)" placeholder="Selecione um cliente..." />
                )}
                noOptionsText="Nenhum cliente cadastrado"
              />
            )}
          </Box>

          {/* Forma de Pagamento e Nº do Documento */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="bill-payment-method-label">Forma de Pagamento Prevista</InputLabel>
              <Select
                labelId="bill-payment-method-label"
                value={paymentMethod}
                label="Forma de Pagamento Prevista"
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
              label="Nº do Documento / Nota Fiscal / Boleto"
              size="small"
              placeholder="Ex: NF-e 4529"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </Box>

          {/* Código de Barras / Linha Digitável */}
          <TextField
            label="Código de Barras / Linha Digitável do Boleto"
            size="small"
            placeholder="Copie ou digite os números do boleto..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            fullWidth
          />

          {/* Observações */}
          <TextField
            label="Observações Internas"
            size="small"
            multiline
            rows={2}
            placeholder="Informações adicionais sobre esta despesa ou receita..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />

          {/* Assistente de Parcelamento (Apenas na criação) */}
          {!isEdit && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: isInstallment ? "primary.main" : "divider",
                borderRadius: 2,
                bgcolor: isInstallment ? alpha(theme.palette.primary.main, 0.03) : "background.paper",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isInstallment}
                      onChange={(e) => setIsInstallment(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Split size={16} color={theme.palette.primary.main} />
                      <Typography variant="body2" fontWeight={700}>
                        Repetir ou Parcelar esta conta
                      </Typography>
                    </Box>
                  }
                />

                {isInstallment && (
                  <FormControl size="small" sx={{ width: 140 }}>
                    <InputLabel id="installments-count-label">Parcelas</InputLabel>
                    <Select
                      labelId="installments-count-label"
                      value={totalInstallments}
                      label="Parcelas"
                      onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                        <MenuItem key={n} value={n}>
                          {n} vezes ({n}x)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {isInstallment && installmentPreviews.length > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.75 }}>
                    Prévia do Cronograma de Parcelas:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      maxHeight: 120,
                      overflowY: "auto",
                    }}
                  >
                    {installmentPreviews.map((p) => (
                      <Chip
                        key={p.parcelNum}
                        label={`${p.parcelNum}/${totalInstallments}: ${p.parcelAmt.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em ${p.parcelDate}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar Alterações" : isInstallment ? `Gerar ${totalInstallments} Parcelas` : "Cadastrar Conta"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
