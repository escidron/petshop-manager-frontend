import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Button } from "../../components/Button/Button";

interface Props {
  onSuccess: () => void;
}

const CheckoutForm = ({ onSuccess }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
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
      <PaymentElement />

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
        {loading ? <CircularProgress size={20} /> : "Confirmar assinatura"}
      </Button>
    </Box>
  );
};

export default CheckoutForm;
