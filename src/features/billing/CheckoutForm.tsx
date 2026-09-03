import { useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CreditCard, Lock, MapPin } from "lucide-react";
import { Button } from "../../components/Button/Button";
import type { BillingAddress } from "./types";

export type { BillingAddress };

interface Props {
  onSuccess: (cardToken: string, document: string, billingAddress: BillingAddress) => Promise<void> | void;
  buttonLabel?: string;
  defaultDocument?: string | null;
}

const PAGARME_ERROR_MAP: Record<string, string> = {
  "Card expired.": "Cartão expirado. Verifique a validade e tente novamente.",
  "Invalid card number.": "Número do cartão inválido.",
  "Invalid cvv.": "CVV inválido.",
  "Invalid expiration date.": "Data de validade inválida.",
  "Card number is required.": "Número do cartão é obrigatório.",
  "Holder name is required.": "Nome do titular é obrigatório.",
  "Invalid holder name.": "Nome do titular inválido.",
  "Card declined.": "Cartão recusado. Entre em contato com seu banco.",
  "Insufficient funds.": "Saldo insuficiente.",
  "Card blocked.": "Cartão bloqueado. Entre em contato com seu banco.",
};

function translatePagarmeError(err: { message?: string; errors?: Record<string, string[]> }): string {
  // Tenta pegar o erro específico dentro de `errors`
  if (err.errors) {
    const firstErrors = Object.values(err.errors).flat();
    for (const msg of firstErrors) {
      if (PAGARME_ERROR_MAP[msg]) return PAGARME_ERROR_MAP[msg];
    }
    // Retorna o primeiro erro específico traduzido ou em PT fallback
    if (firstErrors.length > 0) {
      return PAGARME_ERROR_MAP[firstErrors[0]] ?? "Dados do cartão inválidos. Verifique e tente novamente.";
    }
  }
  return "Dados do cartão inválidos. Verifique e tente novamente.";
}

const formatCardNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
};

const formatDocument = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return digits.slice(0, 5) + "-" + digits.slice(5);
  return digits;
};

const CheckoutForm = ({ onSuccess, buttonLabel, defaultDocument }: Props) => {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [document, setDocument] = useState(defaultDocument || "");
  const [card, setCard] = useState({
    number: "",
    holder_name: "",
    expiry: "",
    cvv: "",
  });
  const [address, setAddress] = useState({
    zip_code: "",
    line_1: "",
    line_2: "",
    city: "",
    state: "",
  });

  const handleCep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setAddress((p) => ({ ...p, zip_code: formatted }));

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          setAddress((p) => ({
            ...p,
            line_1: data.logradouro || p.line_1,
            city: data.localidade || p.city,
            state: data.uf || p.state,
          }));
        }
      } catch {
        // ignora erro de busca de CEP
      } finally {
        setCepLoading(false);
      }
    }
  };


  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((p) => ({ ...p, number: formatCardNumber(e.target.value) }));

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }));

  const handleCvv = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }));

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((p) => ({ ...p, holder_name: e.target.value.toUpperCase() }));

  const handleDocument = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDocument(formatDocument(e.target.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const [expMonth, expYear] = card.expiry.split("/");

    try {
      const resp = await fetch(
        `https://api.pagar.me/core/v5/tokens?appId=${import.meta.env.VITE_PAGARME_PUBLIC_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "card",
            card: {
              number: card.number.replace(/\s/g, ""),
              holder_name: card.holder_name,
              exp_month: expMonth,
              exp_year: expYear,
              cvv: card.cvv,
            },
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        setErrorMsg(translatePagarmeError(err));
        return;
      }

      const data = await resp.json();
      const billingAddress: BillingAddress = {
        country: "BR",
        state: address.state,
        city: address.city,
        zip_code: address.zip_code.replace(/\D/g, ""),
        line_1: address.line_1,
        ...(address.line_2 ? { line_2: address.line_2 } : {}),
      };
      await onSuccess(data.id, document, billingAddress);
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#FFFFFF",
      "&:hover fieldset": { borderColor: "primary.main" },
    },
  };

  const labelSx = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#334155",
    mb: 0.5,
    display: "block",
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", gap: { xs: 2.5, md: 3 }, alignItems: "flex-start", flexDirection: { xs: "column", md: "row" } }}>
        <Stack spacing={2} sx={{ flex: 1, width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: -0.5 }}>
            <CreditCard size={18} color="#313485" />
            <Typography variant="subtitle2" fontWeight={800} color="#0F172A">Dados do cartão</Typography>
          </Box>
          <Box>
            <Typography sx={labelSx}>Número do cartão</Typography>
            <TextField
              fullWidth
              value={card.number}
              onChange={handleNumber}
              placeholder="0000 0000 0000 0000"
              required
              size="small"
              sx={fieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard size={18} color="#64748B" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
  
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={labelSx}>Validade</Typography>
              <TextField
                value={card.expiry}
                onChange={handleExpiry}
                placeholder="MM/AA"
                required
                size="small"
                sx={fieldSx}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={labelSx}>CVV</Typography>
              <TextField
                value={card.cvv}
                onChange={handleCvv}
                placeholder="123"
                required
                size="small"
                sx={fieldSx}
                fullWidth
              />
            </Box>
          </Box>
  
          <Box>
            <Typography sx={labelSx}>Nome do titular</Typography>
            <TextField
              fullWidth
              value={card.holder_name}
              onChange={handleName}
              placeholder="Como impresso no cartão"
              required
              size="small"
              sx={fieldSx}
            />
          </Box>
  
          <Box>
            <Typography sx={labelSx}>CPF do titular</Typography>
            <TextField
              fullWidth
              value={document}
              onChange={handleDocument}
              placeholder="000.000.000-00"
              required
              size="small"
              sx={fieldSx}
            />
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

        <Stack spacing={2} sx={{ flex: 1, width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: -0.5 }}>
            <MapPin size={18} color="#313485" />
            <Typography variant="subtitle2" fontWeight={800} color="#0F172A">Endereço de cobrança</Typography>
          </Box>
          <Box>
            <Typography sx={labelSx}>CEP</Typography>
            <TextField
              fullWidth
              value={address.zip_code}
              onChange={handleCep}
              placeholder="00000-000"
              required
              size="small"
              sx={fieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MapPin size={18} color="#64748B" />
                    </InputAdornment>
                  ),
                  endAdornment: cepLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
          </Box>
  
          <Box>
            <Typography sx={labelSx}>Rua e número</Typography>
            <TextField
              fullWidth
              value={address.line_1}
              onChange={(e) => setAddress((p) => ({ ...p, line_1: e.target.value }))}
              placeholder="Ex: Av. Paulista, 1000"
              required
              size="small"
              sx={fieldSx}
            />
          </Box>
  
          <Box>
            <Typography sx={labelSx}>Complemento (opcional)</Typography>
            <TextField
              fullWidth
              value={address.line_2}
              onChange={(e) => setAddress((p) => ({ ...p, line_2: e.target.value }))}
              placeholder="Ex: Apto 101"
              size="small"
              sx={fieldSx}
            />
          </Box>
  
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 2 }}>
              <Typography sx={labelSx}>Cidade</Typography>
              <TextField
                fullWidth
                value={address.city}
                onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                placeholder="Ex: São Paulo"
                required
                size="small"
                sx={fieldSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={labelSx}>UF</Typography>
              <TextField
                fullWidth
                value={address.state}
                onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="Ex: SP"
                required
                size="small"
                sx={fieldSx}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      {errorMsg && (
        <Box sx={{ mt: 2.5, p: 1.5, bgcolor: "rgba(211,47,47,0.06)", borderRadius: 2, border: "1px solid rgba(211,47,47,0.2)" }}>
          <Typography color="error" variant="body2" fontWeight={600}>
            {errorMsg}
          </Typography>
        </Box>
      )}

      <Button
        type="submit"
        disabled={loading}
        variant="contained"
        sx={{
          mt: 3,
          width: "100%",
          py: 1.5,
          fontSize: "0.95rem",
          fontWeight: 800,
          borderRadius: 2.5,
          minHeight: 48,
          bgcolor: "#313485",
          "&:hover": { bgcolor: "#24276b" },
        }}
      >
        {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <Lock size={18} />
            {buttonLabel || "Confirmar pagamento"}
          </Box>
        )}
      </Button>
    </Box>
  );
};

export default CheckoutForm;
