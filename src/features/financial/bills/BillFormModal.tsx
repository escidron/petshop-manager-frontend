import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Chip,
  Paper,
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
import { Button } from "../../../components/Button/Button";
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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      color="text.secondary"
      sx={{ display: "block", mb: 0.5, fontSize: "0.78rem" }}
    >
      {children}
      {required && (
        <Typography component="span" color="error.main" sx={{ ml: 0.5, fontWeight: 700 }}>
          *
        </Typography>
      )}
    </Typography>
  );
}

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
  const descriptionInputRef = useRef<HTMLInputElement>(null);

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

  // Validação com mensagens inline
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    dueDate?: string;
  }>({});

  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa formulário e foca no input de descrição ao abrir
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
    setErrors({});
  }, [editingBill, defaultType, open]);

  // Foca imediatamente no campo de descrição assim que o modal se abre
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

    const newErrors: {
      description?: string;
      amount?: string;
      dueDate?: string;
    } = {};

    if (!description.trim()) {
      newErrors.description = "A descrição da conta é obrigatória.";
    }
    if (!amount || amount <= 0) {
      newErrors.amount = "Informe um valor válido maior que zero.";
    }
    if (!dueDate) {
      newErrors.dueDate = "A data de vencimento é obrigatória.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.description) {
        descriptionInputRef.current?.focus();
      }
      return;
    }

    setErrors({});

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        onEntered: () => descriptionInputRef.current?.focus(),
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
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

        <DialogContent sx={{ pt: 2.5, pb: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Seletor de Tipo (A Pagar vs A Receber) caso não seja edição com margem visual no topo */}
          {!isEdit && (
            <Box sx={{ display: "flex", gap: 1.5, mt: 1, mb: 0.5 }}>
              <Button
                type="button"
                variant={billType === "payable" ? "contained" : "outlined"}
                onClick={() => setBillType("payable")}
                startIcon={<ArrowUpRight size={18} />}
                fullWidth
                sx={{
                  py: 1.1,
                  fontWeight: 700,
                  borderRadius: 2,
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
                  py: 1.1,
                  fontWeight: 700,
                  borderRadius: 2,
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
            <Box>
              <FieldLabel required>Descrição do Título / Conta</FieldLabel>
              <TextField
                inputRef={descriptionInputRef}
                autoFocus
                size="small"
                fullWidth
                placeholder={isPayable ? "Ex: Aluguel do imóvel, Ração Golden 15kg" : "Ex: Venda de pacotes, Contrato mensal"}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                error={Boolean(errors.description)}
                helperText={errors.description}
              />
            </Box>

            <Box>
              <FieldLabel required>Valor Nominal</FieldLabel>
              <MoneyInput
                value={amount}
                onChange={(val) => {
                  setAmount(val);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                }}
                placeholder="0,00"
                fullWidth
                error={Boolean(errors.amount)}
                helperText={errors.amount}
              />
            </Box>
          </Box>

          {/* Datas: Vencimento e Emissão */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <FieldLabel required>Data de Vencimento</FieldLabel>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) {
                    setErrors((prev) => ({ ...prev, dueDate: undefined }));
                  }
                }}
                error={Boolean(errors.dueDate)}
                helperText={errors.dueDate}
              />
            </Box>

            <Box>
              <FieldLabel>Data de Emissão / Competência</FieldLabel>
              <TextField
                size="small"
                fullWidth
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Box>
          </Box>

          {/* Categoria DRE e Fornecedor/Cliente */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {/* Categoria DRE com Autocomplete e limite de altura da lista */}
            <Box>
              <FieldLabel>Categoria (Plano de Contas DRE)</FieldLabel>
              <Autocomplete
                size="small"
                options={filteredCategories}
                getOptionLabel={(opt) => (opt.code ? `[${opt.code}] ${opt.name}` : opt.name || "")}
                value={filteredCategories.find((c) => c.id === categoryId) || null}
                onChange={(_, val) => setCategoryId(val ? val.id : "")}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Selecione ou busque uma categoria..." />
                )}
                noOptionsText="Nenhuma categoria encontrada"
                ListboxProps={{
                  sx: { maxHeight: 240 },
                }}
              />
            </Box>

            {/* Contato: Fornecedor (se Pagar) ou Cliente (se Receber) */}
            <Box>
              <FieldLabel>{isPayable ? "Fornecedor (Favorecido)" : "Cliente (Pagador)"}</FieldLabel>
              {isPayable ? (
                <Autocomplete
                  size="small"
                  options={suppliers}
                  getOptionLabel={(opt) => opt.name || ""}
                  value={suppliers.find((s) => s.id === supplierId) || null}
                  onChange={(_, val) => setSupplierId(val ? val.id : "")}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Selecione um fornecedor..." />
                  )}
                  noOptionsText="Nenhum fornecedor cadastrado"
                  ListboxProps={{
                    sx: { maxHeight: 240 },
                  }}
                />
              ) : (
                <Autocomplete
                  size="small"
                  options={clients}
                  getOptionLabel={(opt) => opt.name || ""}
                  value={clients.find((c) => c.id === clientId) || null}
                  onChange={(_, val) => setClientId(val ? val.id : "")}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Selecione um cliente..." />
                  )}
                  noOptionsText="Nenhum cliente cadastrado"
                  ListboxProps={{
                    sx: { maxHeight: 240 },
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Forma de Pagamento e Nº do Documento */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <FieldLabel>Forma de Pagamento Prevista</FieldLabel>
              <FormControl size="small" fullWidth>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <FieldLabel>Nº do Documento / Nota Fiscal / Boleto</FieldLabel>
              <TextField
                size="small"
                fullWidth
                placeholder="Ex: NF-e 4529"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </Box>
          </Box>

          {/* Código de Barras / Linha Digitável */}
          <Box>
            <FieldLabel>Código de Barras / Linha Digitável do Boleto</FieldLabel>
            <TextField
              size="small"
              placeholder="Copie ou digite os números do boleto..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              fullWidth
            />
          </Box>

          {/* Observações */}
          <Box>
            <FieldLabel>Observações Internas</FieldLabel>
            <TextField
              size="small"
              multiline
              rows={2}
              placeholder="Informações adicionais sobre esta despesa ou receita..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Box>

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
                  <Box sx={{ width: 140 }}>
                    <FieldLabel>Parcelas</FieldLabel>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(Number(e.target.value))}
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n} vezes ({n}x)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
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

        <DialogActions sx={{ p: 2, px: 3, borderTop: "1px solid", borderColor: "divider", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{ borderRadius: 2, color: "text.secondary", borderColor: "divider" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            loading={isSubmitting}
            startIcon={!isSubmitting ? <Save size={16} /> : undefined}
            sx={{ fontWeight: 700, borderRadius: 2, px: 2.5 }}
          >
            {isEdit ? "Salvar Alterações" : isInstallment ? `Gerar ${totalInstallments} Parcelas` : "Cadastrar Conta"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
