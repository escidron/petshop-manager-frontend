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
  FormLabel,
  Divider,
  Paper,
} from "@mui/material";
import { PointOfSale, AttachMoney, CreditCard, Pix } from "@mui/icons-material";
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
      // Invalidate both products (since stock changed) and sales queries
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <PointOfSale /> Finalizar Venda
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box
          sx={{ mb: 3, p: 2, bgcolor: "background.default", borderRadius: 1 }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            Total a Pagar
          </Typography>
          <Typography variant="h3" color="primary" sx={{ fontWeight: "bold" }}>
            R$ {totalAmount.toFixed(2)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: "bold" }}>
            Forma de Pagamento
          </FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as SaleCreate["payment_method"])
            }
          >
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <Paper
                as="label"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: paymentMethod === "credit_card" ? 2 : 1,
                  borderColor:
                    paymentMethod === "credit_card"
                      ? "primary.main"
                      : "divider",
                }}
              >
                <Radio value="credit_card" sx={{ p: 0, mr: 1 }} />
                <CreditCard sx={{ mr: 1, color: "text.secondary" }} />
                <Typography>Cartão de Crédito</Typography>
              </Paper>

              <Paper
                as="label"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: paymentMethod === "debit_card" ? 2 : 1,
                  borderColor:
                    paymentMethod === "debit_card" ? "primary.main" : "divider",
                }}
              >
                <Radio value="debit_card" sx={{ p: 0, mr: 1 }} />
                <CreditCard sx={{ mr: 1, color: "text.secondary" }} />
                <Typography>Cartão de Débito</Typography>
              </Paper>

              <Paper
                as="label"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: paymentMethod === "pix" ? 2 : 1,
                  borderColor:
                    paymentMethod === "pix" ? "primary.main" : "divider",
                }}
              >
                <Radio value="pix" sx={{ p: 0, mr: 1 }} />
                <Pix sx={{ mr: 1, color: "success.main" }} />
                <Typography>PIX</Typography>
              </Paper>

              <Paper
                as="label"
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  border: paymentMethod === "money" ? 2 : 1,
                  borderColor:
                    paymentMethod === "money" ? "primary.main" : "divider",
                }}
              >
                <Radio value="money" sx={{ p: 0, mr: 1 }} />
                <AttachMoney sx={{ mr: 1, color: "success.dark" }} />
                <Typography>Dinheiro / Espécie</Typography>
              </Paper>
            </Box>
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={saleMutation.isPending}>
          Voltar
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={handleCheckout}
          disabled={saleMutation.isPending}
        >
          {saleMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
