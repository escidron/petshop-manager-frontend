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
import { X, ArrowDownRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCashBleed, listCashDestinationAccounts } from "../../api/services/cash";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";

interface BleedModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  cashRegisterId?: number | null;
}

export default function BleedModal({
  open,
  onClose,
  currentBalance,
  cashRegisterId,
}: BleedModalProps) {
  const { data: accounts = [] } = useQuery({
    queryKey: ["cash-destination-accounts"],
    queryFn: () => listCashDestinationAccounts(false),
    staleTime: 1000 * 60 * 5,
  });

  const defaultAccountName = accounts.find((a) => a.is_default)?.name || accounts[0]?.name || "Caixa Administrativo";

  const [amountStr, setAmountStr] = useState<string>("0,00");
  const [destination, setDestination] = useState<string>(defaultAccountName);
  const [description, setDescription] = useState<string>("");

  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setAmountStr("0,00");
      setDestination(defaultAccountName);
      setDescription("");
    }
  }, [open, defaultAccountName]);

  const bleedMutation = useMutation({
    mutationFn: addCashBleed,
    onSuccess: () => {
      toast.success("Sangria de caixa realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao realizar sangria.");
    },
  });

  const numericAmount = parseFloat(amountStr.replace(/\./g, "").replace(",", ".")) || 0;
  const isExceeding = numericAmount > currentBalance;

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
      toast.error("Informe um valor maior que zero para a sangria.");
      return;
    }
    const finalDesc = description.trim() || `Sangria para ${destination}`;
    bleedMutation.mutate({
      amount: numericAmount,
      destination,
      description: finalDesc,
      cash_register_id: cashRegisterId,
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
          Sangria de Caixa
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
            Retire o valor que está na gaveta do caixa e destine a outra conta interna ou despesa.
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
            Valor da Sangria (R$)
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
                color: isExceeding ? "#DC2626" : "#111827",
              },
            }}
          />
          {isExceeding && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, color: "#DC2626" }}>
              <AlertTriangle size={16} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#DC2626" }}>
                Atenção: Valor informado é maior que o saldo disponível na gaveta.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Destination Account */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="destination-select-label" sx={{ color: "#4B5563" }}>
            Conta Destino
          </InputLabel>
          <Select
            labelId="destination-select-label"
            value={destination}
            label="Conta Destino"
            onChange={(e) => setDestination(e.target.value)}
            sx={{
              color: "#111827",
              fontWeight: 600,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
            }}
          >
            {accounts.map((acc) => (
              <MenuItem key={acc.id} value={acc.name} sx={{ color: "#111827", fontWeight: 500 }}>
                {acc.name}
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
          placeholder="Ex: Retirada diária para o cofre / motoboy"
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
          loading={bleedMutation.isPending}
          disabled={numericAmount <= 0}
          startIcon={<ArrowDownRight size={18} />}
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
