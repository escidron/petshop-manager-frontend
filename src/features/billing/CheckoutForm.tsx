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
import { CreditCard, Calendar, Lock, User, FileText, MapPin } from "lucide-react";
import { Button } from "../../components/Button/Button";

export interface BillingAddress {
  zip_code: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  country: string;
}

interface Props {
  onSuccess: (cardToken: string, document: string, billingAddress: BillingAddress) => void;
  buttonLabel?: string;
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

const CheckoutForm = ({ onSuccess, buttonLabel }: Props) => {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [document, setDocument] = useState("");
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
        setErrorMsg(err?.message ?? "Dados do cartão inválidos. Verifique e tente novamente.");
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
      onSuccess(data.id, document, billingAddress);
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#FAFAFA",
      "&:hover fieldset": { borderColor: "primary.main" },
    },
    "& label": { fontSize: "0.875rem" },
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {/* Card preview strip */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #313485 0%, #4B4EAD 100%)",
          borderRadius: 3,
          p: 2.5,
          mb: 3,
          color: "white",
          position: "relative",
          overflow: "hidden",
          minHeight: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
        <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1 }}>
          NÚMERO DO CARTÃO
        </Typography>
        <Typography variant="h6" sx={{ fontFamily: "monospace", letterSpacing: 3, opacity: card.number ? 1 : 0.4 }}>
          {card.number || "0000 0000 0000 0000"}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block", letterSpacing: 1 }}>TITULAR</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: card.holder_name ? 1 : 0.4 }}>
              {card.holder_name || "NOME DO TITULAR"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block", letterSpacing: 1 }}>VALIDADE</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: card.expiry ? 1 : 0.4 }}>
              {card.expiry || "MM/AA"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Duas colunas: dados do cartão | endereço */}
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* Coluna esquerda — dados do cartão */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CreditCard size={16} color="#6B7280" />
            <Typography variant="subtitle2" color="text.primary">Dados do cartão</Typography>
          </Box>

          <TextField
            fullWidth
            value={document}
            onChange={handleDocument}
            placeholder="CPF ou CNPJ"
            required
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FileText size={18} color="#9CA3AF" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            value={card.number}
            onChange={handleNumber}
            placeholder="0000 0000 0000 0000"
            required
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCard size={18} color="#9CA3AF" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            value={card.holder_name}
            onChange={handleName}
            placeholder="NOME SOBRENOME"
            required
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <User size={18} color="#9CA3AF" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              value={card.expiry}
              onChange={handleExpiry}
              placeholder="MM/AA"
              required
              sx={{ ...fieldSx, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Calendar size={18} color="#9CA3AF" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              value={card.cvv}
              onChange={handleCvv}
              placeholder="CVV"
              required
              sx={{ ...fieldSx, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} color="#9CA3AF" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem />

        {/* Coluna direita — endereço de cobrança */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MapPin size={16} color="#6B7280" />
            <Typography variant="subtitle2" color="text.primary">Endereço de cobrança</Typography>
          </Box>

          <TextField
            fullWidth
            value={address.zip_code}
            onChange={handleCep}
            placeholder="CEP"
            required
            sx={fieldSx}
            InputProps={{
              endAdornment: cepLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            }}
          />

          <TextField
            fullWidth
            value={address.line_1}
            onChange={(e) => setAddress((p) => ({ ...p, line_1: e.target.value }))}
            placeholder="Rua, número"
            required
            sx={fieldSx}
          />

          <TextField
            fullWidth
            value={address.line_2}
            onChange={(e) => setAddress((p) => ({ ...p, line_2: e.target.value }))}
            placeholder="Complemento (opcional)"
            sx={fieldSx}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              value={address.city}
              onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
              placeholder="Cidade"
              required
              sx={{ ...fieldSx, flex: 1 }}
            />
            <TextField
              value={address.state}
              onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
              placeholder="UF"
              required
              sx={{ ...fieldSx, width: 80 }}
            />
          </Box>
        </Stack>
      </Box>

      {errorMsg && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(211,47,47,0.06)", borderRadius: 2, border: "1px solid rgba(211,47,47,0.2)" }}>
          <Typography color="error" variant="body2">
            {errorMsg}
          </Typography>
        </Box>
      )}

      <Button
        type="submit"
        disabled={loading}
        sx={{ mt: 3, width: "100%", py: 1.5, fontSize: "1rem", fontWeight: 700, borderRadius: 2 }}
      >
        {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : (buttonLabel || "Confirmar assinatura")}
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 2 }}>
        <Lock size={12} color="#9CA3AF" />
        <Typography variant="caption" color="text.disabled">
          Dados criptografados e protegidos via Pagar.me
        </Typography>
      </Box>
    </Box>
  );
};

export default CheckoutForm;
