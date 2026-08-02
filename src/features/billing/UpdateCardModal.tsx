import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { X } from "lucide-react";
import CheckoutForm, { type BillingAddress } from "./CheckoutForm";
import { addPaymentMethod, setDefaultPaymentMethod } from "../../api/services/subscriptions";
import { useToast } from "../../hooks/useToast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantDocument?: string | null;
}

export default function UpdateCardModal({ open, onClose, onSuccess, tenantDocument }: Props) {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleCardSuccess = async (
    cardToken: string,
    document: string,
    billingAddress: BillingAddress
  ) => {
    setError(null);
    try {
      // 1. Adiciona o cartão ao customer no Pagar.me
      const paymentMethod = await addPaymentMethod(cardToken, billingAddress, document);
      
      // 2. Define como padrão, o que atualiza a assinatura ativa no backend
      await setDefaultPaymentMethod(paymentMethod.id);
      
      toast.success("Cartão atualizado com sucesso!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Erro ao atualizar cartão.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      toast.error("Erro ao atualizar cartão.");
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 4,
          width: "100%",
          maxWidth: 760,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 16, top: 16 }}
        >
          <X size={20} color="#9CA3AF" />
        </IconButton>

        <Typography variant="h5" fontWeight={800} color="primary.main" mb={1}>
          Atualizar Cartão
        </Typography>
        <Typography variant="body2" color="text.primary" mb={3}>
          Insira os dados do novo cartão de crédito. Ele passará a ser cobrado nos próximos ciclos.
        </Typography>

        {error && (
          <Box sx={{ p: 2, bgcolor: "#FEE2E2", color: "#DC2626", borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              {error}
            </Typography>
          </Box>
        )}

        <CheckoutForm
          onSuccess={handleCardSuccess}
          buttonLabel="Atualizar Cartão"
          defaultDocument={tenantDocument}
        />
      </Box>
    </Box>
  );
}
