import { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import CustomCard from "../../components/Card/CustomCard";
import { Button } from "../../components/Button/Button";
import CheckoutForm from "./CheckoutForm";
import PixQrCode from "./PixQrCode";
import {
  cancelSubscription,
  createCheckout,
  getMySubscription,
} from "../../api/services/subscriptions";
import type { CheckoutPixResponse } from "./types";

const STATUS_LABEL: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  active: { label: "Ativa", color: "success" },
  trialing: { label: "Trial", color: "warning" },
  incomplete: { label: "Pendente", color: "warning" },
  past_due: { label: "Pagamento atrasado", color: "error" },
  canceled: { label: "Cancelada", color: "error" },
};

const BillingPage = () => {
  const queryClient = useQueryClient();
  const [showCardForm, setShowCardForm] = useState(false);
  const [pixData, setPixData] = useState<CheckoutPixResponse | null>(null);
  const [pixDocument, setPixDocument] = useState("");
  const [showPixDocInput, setShowPixDocInput] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: getMySubscription,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: () => toast.error("Erro ao cancelar assinatura"),
  });

  const checkoutWithPix = useMutation({
    mutationFn: (doc: string) => createCheckout("MONTHLY", "pix", undefined, doc),
    onSuccess: (data) => {
      if ("pix_qr_code" in data) {
        setPixData(data as CheckoutPixResponse);
        setShowPixDocInput(false);
        setPixDocument("");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    },
    onError: () => toast.error("Erro ao gerar PIX"),
  });

  const handleCardSuccess = async (cardToken: string, document: string, billingAddress: import("./CheckoutForm").BillingAddress) => {
    try {
      await createCheckout("MONTHLY", "credit_card", cardToken, document, billingAddress);
      setShowCardForm(false);
      toast.success("Assinatura realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } catch {
      toast.error("Erro ao finalizar assinatura");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusInfo = subscription
    ? STATUS_LABEL[subscription.status] ?? { label: subscription.status, color: "default" as const }
    : null;

  const isExpired =
    subscription?.status === "active" &&
    !!subscription.current_period_end &&
    new Date(subscription.current_period_end) < new Date();

  const canSubscribe =
    !subscription ||
    subscription.status === "trialing" ||
    subscription.status === "past_due" ||
    subscription.status === "canceled" ||
    isExpired;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", mt: 4, px: 2 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Minha Assinatura
      </Typography>

      {subscription ? (
        <CustomCard sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6">{subscription.plan.name}</Typography>
            <Chip label={statusInfo?.label} color={statusInfo?.color} size="small" />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {subscription.status === "trialing"
              ? `Trial até ${dayjs(subscription.trial_ends_at).format("DD/MM/YYYY")}`
              : `Próxima cobrança: ${dayjs(subscription.current_period_end).format("DD/MM/YYYY")}`}
          </Typography>

          {canSubscribe && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button onClick={() => setShowCardForm(true)}>
                  Pagar com cartão
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowPixDocInput(true)}
                  disabled={checkoutWithPix.isPending}
                >
                  Pagar com PIX
                </Button>
                {subscription.status !== "canceled" && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja cancelar a assinatura?")) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    Cancelar assinatura
                  </Button>
                )}
              </Box>
            </>
          )}

          {subscription.status === "active" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  if (confirm("Tem certeza que deseja cancelar a assinatura?")) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                Cancelar assinatura
              </Button>
            </>
          )}
        </CustomCard>
      ) : (
        <CustomCard sx={{ mb: 3 }}>
          <Typography mb={2}>Você ainda não tem uma assinatura ativa.</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => setShowCardForm(true)}>
              Pagar com cartão
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPixDocInput(true)}
              disabled={checkoutWithPix.isPending}
            >
              Pagar com PIX
            </Button>
          </Box>
        </CustomCard>
      )}

      {/* Formulário de cartão */}
      {showCardForm && (
        <CustomCard sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Dados do cartão</Typography>
            <Button variant="text" onClick={() => setShowCardForm(false)}>Cancelar</Button>
          </Box>
          <CheckoutForm onSuccess={handleCardSuccess} />
        </CustomCard>
      )}

      {/* Documento para PIX */}
      {showPixDocInput && !pixData && (
        <CustomCard sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Informe seu CPF ou CNPJ</Typography>
            <Button variant="text" onClick={() => setShowPixDocInput(false)}>Cancelar</Button>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              fullWidth
              value={pixDocument}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                let formatted = digits;
                if (digits.length <= 11) {
                  formatted = digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                } else {
                  formatted = digits.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
                }
                setPixDocument(formatted);
              }}
              placeholder="000.000.000-00"
              size="small"
            />
            <Button
              onClick={() => checkoutWithPix.mutate(pixDocument)}
              disabled={checkoutWithPix.isPending || pixDocument.replace(/\D/g, "").length < 11}
            >
              {checkoutWithPix.isPending ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Gerar PIX"}
            </Button>
          </Box>
        </CustomCard>
      )}

      {/* QR Code PIX */}
      {pixData && (
        <CustomCard>
          <PixQrCode
            qrCode={pixData.pix_qr_code}
            qrCodeUrl={pixData.pix_qr_code_url}
            expiresAt={pixData.expires_at}
            onClose={() => setPixData(null)}
          />
        </CustomCard>
      )}
    </Box>
  );
};

export default BillingPage;
