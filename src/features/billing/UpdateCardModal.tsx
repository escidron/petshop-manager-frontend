import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { X, Lock } from "lucide-react";
import CheckoutForm from "./CheckoutForm";
import type { BillingAddress } from "./types";
import { addPaymentMethod, setDefaultPaymentMethod } from "../../api/services/subscriptions";
import { useToast } from "../../hooks/useToast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantDocument?: string | null;
  title?: string;
}

export default function UpdateCardModal({
  open,
  onClose,
  onSuccess,
  tenantDocument,
  title = "Cadastrar Cartão de Crédito",
}: Props) {
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

      // 2. Define como padrão
      await setDefaultPaymentMethod(paymentMethod.id);

      toast.success("Cartão salvo com sucesso!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Erro ao salvar cartão.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      toast.error("Erro ao salvar cartão.");
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
          bgcolor: "#313485",
          borderRadius: "16px",
          width: "100%",
          maxWidth: 760,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "#313485",
            p: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Lock size={18} color="rgba(255,255,255,0.9)" />
            <Typography variant="subtitle1" fontWeight={700} color="white">
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)", color: "white" },
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ bgcolor: "#FFFFFF", p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
            Insira os dados do cartão de crédito. Ele ficará salvo como sua forma de pagamento padrão para renovações e contratações.
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
            buttonLabel="Salvar Cartão de Crédito"
            defaultDocument={tenantDocument}
          />
        </Box>
      </Box>
    </Box>
  );
}
