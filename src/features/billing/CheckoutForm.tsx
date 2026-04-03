import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Button } from "../../components/Button/Button";

interface Props {
  clientSecret: string;
  onSuccess: (paymentMethodId?: string) => void;
}

const CheckoutForm = ({ clientSecret, onSuccess }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSetup = clientSecret.startsWith("seti_");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMsg(null);

    if (isSetup) {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/settings?tab=billing",
          payment_method_data: {
            billing_details: { address: { country: "BR" } },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMsg(error.message ?? "Erro ao salvar cartão");
        setLoading(false);
        return;
      }

      const pmId = typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

      onSuccess(pmId);
      setLoading(false);
      return;
    }

    // PaymentIntent
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
        payment_method_data: {
          billing_details: { address: { country: "BR" } },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message ?? "Erro ao processar pagamento");
      setLoading(false);
      return;
    }

    onSuccess();
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <PaymentElement
        options={{
          fields: {
            billingDetails: {
              address: { country: "never" },
            },
          },
          defaultValues: {
            billingDetails: {
              address: { country: "BR" },
            },
          },
        }}
      />

      {errorMsg && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {errorMsg}
        </Typography>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        sx={{ mt: 3, width: "100%" }}
      >
        {loading ? (
          <CircularProgress size={20} />
        ) : isSetup ? (
          "Salvar cartão"
        ) : (
          "Confirmar assinatura"
        )}
      </Button>
    </Box>
  );
};

export default CheckoutForm;
