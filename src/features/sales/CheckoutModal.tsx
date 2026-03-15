import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControl,
  Divider,
  Paper,
  IconButton,
  alpha,
} from "@mui/material";
import {
  PointOfSale,
  AttachMoney,
  CreditCard,
  Pix,
  Close as CloseIcon,
  CheckCircle,
} from "@mui/icons-material";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "../../api/services/sales";
import type { SaleItem, SaleCreate } from "./schemas";
import { toast } from "react-toastify";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: SaleItem[];
  totalAmount: number;
  clientId: number | null;
  onSuccess: () => void;
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  totalAmount,
  clientId,
  onSuccess,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<SaleCreate["payment_method"]>("credit_card");
  const queryClient = useQueryClient();

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success("Venda finalizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao processar venda");
    },
  });

  const handleCheckout = () => {
    const payload: SaleCreate = {
      client_id: clientId,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      status: "completed",
      items: cart,
    };
    saleMutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "primary.main",
          color: "white",
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PointOfSale />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Finalizar Venda
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box
          sx={{
            mb: 4,
            p: 3,
            bgcolor: alpha("#1976d2", 0.05),
            borderRadius: 3,
            textAlign: "center",
            border: "1px solid",
            borderColor: alpha("#1976d2", 0.1),
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            TOTAL A RECEBER
          </Typography>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 900 }}>
            R$ {totalAmount.toFixed(2)}
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <Typography
            variant="subtitle1"
            sx={{ mb: 2, fontWeight: 700, color: "text.primary" }}
          >
            Selecione a Forma de Pagamento
          </Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as SaleCreate["payment_method"])
            }
          >
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <PaymentMethodCard
                value="credit_card"
                label="Cartão de Crédito"
                icon={CreditCard}
                color="#1976d2"
                selectedPaymentMethod={paymentMethod}
              />
              <PaymentMethodCard
                value="debit_card"
                label="Cartão de Débito"
                icon={CreditCard}
                color="#0288d1"
                selectedPaymentMethod={paymentMethod}
              />
              <PaymentMethodCard
                value="pix"
                label="PIX"
                icon={Pix}
                color="#2e7d32"
                selectedPaymentMethod={paymentMethod}
              />
              <PaymentMethodCard
                value="money"
                label="Dinheiro"
                icon={AttachMoney}
                color="#ed6c02"
                selectedPaymentMethod={paymentMethod}
              />
            </Box>
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={saleMutation.isPending}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          fullWidth
          onClick={handleCheckout}
          disabled={saleMutation.isPending}
          sx={{
            borderRadius: 2,
            height: 52,
            fontWeight: 800,
            boxShadow: "0 4px 14px 0 rgba(46, 125, 50, 0.39)",
          }}
        >
          {saleMutation.isPending ? "Processando..." : "CONFIRMAR E FINALIZAR"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface PaymentMethodCardProps {
  value: SaleCreate["payment_method"];
  label: string;
  icon: React.ElementType;
  color: string;
  selectedPaymentMethod: string;
}

const PaymentMethodCard = ({
  value,
  label,
  icon: Icon,
  color,
  selectedPaymentMethod,
}: PaymentMethodCardProps) => {
  const isSelected = selectedPaymentMethod === value;

  return (
    <Paper
      elevation={0}
      component="label"
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "2px solid",
        borderColor: isSelected ? color : "divider",
        bgcolor: isSelected ? alpha(color, 0.04) : "background.paper",
        borderRadius: 3,
        transition: "all 0.2s",
        gap: 1,
        position: "relative",
        "&:hover": {
          borderColor: isSelected ? color : alpha(color, 0.5),
          bgcolor: alpha(color, 0.02),
        },
      }}
    >
      <Radio
        value={value}
        sx={{ position: "absolute", top: 8, right: 8, p: 0 }}
        checked={isSelected}
      />
      <Icon
        sx={{ fontSize: 32, color: isSelected ? color : "text.secondary" }}
      />
      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "center" }}>
        {label}
      </Typography>
      {isSelected && (
        <CheckCircle
          sx={{
            position: "absolute",
            bottom: -10,
            bgcolor: "white",
            borderRadius: "50%",
            color: color,
            fontSize: 20,
          }}
        />
      )}
    </Paper>
  );
};
