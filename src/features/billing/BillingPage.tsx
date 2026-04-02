import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import CustomCard from "../../components/Card/CustomCard";
import { Button } from "../../components/Button/Button";
import CheckoutForm from "./CheckoutForm";
import {
  cancelSubscription,
  createCheckout,
  createSetupIntent,
  getMySubscription,
} from "../../api/services/subscriptions";
import type { CheckoutResponse } from "./types";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STATUS_LABEL: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  active: { label: "Ativa", color: "success" },
  trialing: { label: "Trial", color: "warning" },
  incomplete: { label: "Pendente", color: "warning" },
  past_due: { label: "Pagamento atrasado", color: "error" },
  canceled: { label: "Cancelada", color: "error" },
};

const BillingPage = () => {
  const queryClient = useQueryClient();
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: getMySubscription,
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => createCheckout("MONTHLY"),
    onSuccess: (data) => {
      if ("client_secret" in data) {
        setCheckoutSecret((data as CheckoutResponse).client_secret);
      }
    },
    onError: () => toast.error("Erro ao iniciar checkout"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: () => toast.error("Erro ao cancelar assinatura"),
  });

  const setupMutation = useMutation({
    mutationFn: createSetupIntent,
    onSuccess: (data) => setSetupSecret(data.client_secret),
    onError: () => toast.error("Erro ao iniciar troca de cartão"),
  });

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

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", mt: 4, px: 2 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Minha Assinatura
      </Typography>

      {/* Current subscription card */}
      {subscription ? (
        <CustomCard sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6">{subscription.plan.name}</Typography>
            <Chip
              label={statusInfo?.label}
              color={statusInfo?.color}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {subscription.status === "trialing"
              ? `Trial até ${dayjs(subscription.trial_ends_at).format("DD/MM/YYYY")}`
              : `Próxima cobrança: ${dayjs(subscription.current_period_end).format("DD/MM/YYYY")}`}
          </Typography>

          {subscription.status !== "canceled" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {(subscription.status === "trialing" || subscription.status === "past_due") && (
                  <Button
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? <CircularProgress size={18} /> : "Assinar plano mensal"}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  onClick={() => setupMutation.mutate()}
                  disabled={setupMutation.isPending}
                >
                  Trocar cartão
                </Button>

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
              </Box>
            </>
          )}

          {subscription.status === "canceled" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
                {checkoutMutation.isPending ? <CircularProgress size={18} /> : "Reativar assinatura"}
              </Button>
            </>
          )}
        </CustomCard>
      ) : (
        <CustomCard sx={{ mb: 3 }}>
          <Typography mb={2}>Você ainda não tem uma assinatura ativa.</Typography>
          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? <CircularProgress size={18} /> : "Assinar plano mensal"}
          </Button>
        </CustomCard>
      )}

      {/* Checkout flow */}
      {checkoutSecret && (
        <CustomCard sx={{ mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Dados de pagamento
          </Typography>
          <Elements stripe={stripePromise} options={{ clientSecret: checkoutSecret }}>
            <CheckoutForm
              onSuccess={() => {
                setCheckoutSecret(null);
                toast.success("Assinatura realizada com sucesso!");
                queryClient.invalidateQueries({ queryKey: ["subscription"] });
              }}
            />
          </Elements>
        </CustomCard>
      )}

      {/* Change card flow */}
      {setupSecret && (
        <CustomCard>
          <Typography variant="h6" mb={2}>
            Novo cartão
          </Typography>
          <Elements stripe={stripePromise} options={{ clientSecret: setupSecret }}>
            <CheckoutForm
              onSuccess={() => {
                setSetupSecret(null);
                toast.success("Cartão atualizado com sucesso!");
              }}
            />
          </Elements>
        </CustomCard>
      )}
    </Box>
  );
};

export default BillingPage;
