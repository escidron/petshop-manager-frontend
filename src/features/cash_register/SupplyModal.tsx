import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button as MuiButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { X, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCashSupply } from "../../api/services/cash";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";

interface SupplyModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
}

const ORIGIN_OPTIONS = [
  "Caixa Administrativo",
  "Cofre",
  "Conta Bancária (Saque / Troco)",
  "Aporte de Sócio / Administrador",
  "Ajuste de Saldo",
  "Outro",
];

export default function SupplyModal({
  open,
  onClose,
  currentBalance,
}: SupplyModalProps) {
  const [amountStr, setAmountStr] = useState<string>("0,00");
  const [origin, setOrigin] = useState<string>("Caixa Administrativo");
  const [description, setDescription] = useState<string>("");

  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setAmountStr("0,00");
      setOrigin("Caixa Administrativo");
      setDescription("");
    }
  }, [open]);

  const supplyMutation = useMutation({
    mutationFn: addCashSupply,
    onSuccess: () => {
      toast.success("Suprimento de caixa adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao adicionar suprimento.");
    },
  });

  const numericAmount = parseFloat(amountStr.replace(/\./g, "").replace(",", ".")) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numberValue = (parseInt(raw || "0", 10) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setAmountStr(numberValue);
  };

  const handleSubmit = () => {
    if (numericAmount <= 0) {
      toast.error("Informe um valor maior que zero para o suprimento.");
      return;
    }
    const finalDesc = description.trim() || `Suprimento vindo de ${origin}`;
    supplyMutation.mutate({
      amount: numericAmount,
      origin,
      description: finalDesc,
    });
  };

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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
          Suprimento de Caixa
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 2 }}>
        {/* Instruction Header */}
        <Box
          sx={{
            bgcolor: "#F3F4F6",
            borderRadius: 2.5,
            p: 2,
            mb: 2.5,
            border: "1px solid #E5E7EB",
          }}
        >
          <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.5, fontSize: "0.875rem" }}>
            Adicione dinheiro à gaveta do caixa para reposição de troco ou reforço financeiro.
          </Typography>
        </Box>

        {/* Current Drawer Cash */}
        <Box sx={{ textAlign: "center", mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: "#4B5563", fontWeight: 600 }}>
            Valor atual em dinheiro na gaveta
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mt: 0.5 }}>
            R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        {/* Amount Input */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: "#374151", fontWeight: 700, mb: 0.75 }}>
            Valor do Suprimento (R$)
          </Typography>
          <TextField
            autoFocus
            fullWidth
            value={amountStr}
            onChange={handleAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: "#111827" }}>R$</Typography></InputAdornment>,
            }}
            inputProps={{
              style: {
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#16A34A",
              },
            }}
          />
        </Box>

        {/* Origin Account */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="origin-select-label" sx={{ color: "#4B5563" }}>
            Conta de Origem
          </InputLabel>
          <Select
            labelId="origin-select-label"
            value={origin}
            label="Conta de Origem"
            onChange={(e) => setOrigin(e.target.value)}
            sx={{
              color: "#111827",
              fontWeight: 600,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
            }}
          >
            {ORIGIN_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ color: "#111827", fontWeight: 500 }}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Description / Notes */}
        <TextField
          label="Motivo / Observação"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
          fullWidth
          placeholder="Ex: Reposição de notas de R$ 5,00 e R$ 10,00"
          sx={{
            "& .MuiInputBase-input": { color: "#111827" },
            "& .MuiInputLabel-root": { color: "#4B5563" },
          }}
        />
      </DialogContent>

      <Divider sx={{ borderColor: "#E5E7EB" }} />

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <MuiButton
          onClick={onClose}
          sx={{
            color: "#4B5563",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { bgcolor: "#F3F4F6", color: "#111827" },
          }}
        >
          Cancelar
        </MuiButton>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={supplyMutation.isPending}
          disabled={numericAmount <= 0}
          startIcon={<ArrowUpRight size={18} />}
          sx={{
            bgcolor: "#16A34A",
            color: "#ffffff",
            fontWeight: 800,
            px: 3,
            py: 0.8,
            borderRadius: 2,
            "&:hover": { bgcolor: "#15803D" },
          }}
        >
          Gravar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
