import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  TextField,
} from "@mui/material";
import { X, CreditCard, QrCode, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "../../components/Button/Button";
import CheckoutForm from "./CheckoutForm";
import { QRCodeSVG } from "qrcode.react";
import { createCheckout, addPaymentMethod, cancelCharge } from "../../api/services/subscriptions";
import type { CheckoutPixResponse } from "./types";
import { maskDocument } from "../../utils/masks";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId: string;
  tenantDocument?: string | null;
  /** If provided, the PIX charge is already generated - skip to step 2 */
  existingPixData?: {
    pix_qr_code: string;
    pix_qr_code_url?: string | null;
    expires_at?: string | null;
  } | null;
  /** If provided, creates a card subscription starting at this date (for PIX→Card transitions) */
  startAt?: string | null;
}

type PayMethod = "card" | "pix";
type Step = 1 | 2 | 3;

const STEPS = ["Pagamento", "Confirmação", "Concluído"];

// Countdown timer component
const Countdown = ({ expiresAt }: { expiresAt: string }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = dayjs(expiresAt).diff(dayjs(), "second");
      setRemaining(Math.max(0, diff));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const expired = remaining === 0;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        bgcolor: expired ? "rgba(211,47,47,0.08)" : "rgba(255,193,7,0.1)",
        border: `1px solid ${expired ? "rgba(211,47,47,0.2)" : "rgba(255,193,7,0.3)"}`,
      }}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color={expired ? "error.main" : "warning.dark"}
      >
        {expired
          ? "PIX expirado"
          : `Expira em: ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
      </Typography>
    </Box>
  );
};

const CheckoutStepper = ({
  open,
  onClose,
  onSuccess,
  planId,
  tenantDocument,
  existingPixData,
  startAt,
}: Props) => {
  const [step, setStep] = useState<Step>(existingPixData ? 2 : 1);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(existingPixData ? "pix" : null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<CheckoutPixResponse | null>(
    existingPixData
      ? ({
          pagarme_subscription_id: "",
          status: "pending",
          pix_qr_code: existingPixData.pix_qr_code,
          pix_qr_code_url: existingPixData.pix_qr_code_url ?? "",
          expires_at: existingPixData.expires_at ?? "",
        } as CheckoutPixResponse)
      : null
  );
  const [pixChargeId, setPixChargeId] = useState<string | null>(null);
  const [pixDocument, setPixDocument] = useState(
    tenantDocument ? maskDocument(tenantDocument) : ""
  );
  const [copied, setCopied] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    plan: string;
    value: string;
    nextRenewal: string;
    method: string;
  } | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      if (existingPixData) {
        setStep(2);
        setPayMethod("pix");
        setPixData({
          pagarme_subscription_id: "",
          status: "pending",
          pix_qr_code: existingPixData.pix_qr_code,
          pix_qr_code_url: existingPixData.pix_qr_code_url ?? "",
          expires_at: existingPixData.expires_at ?? "",
        } as CheckoutPixResponse);
      } else {
        setStep(1);
        setPayMethod(null);
        setPixData(null);
        setError(null);
      }
      setPixDocument(tenantDocument ? maskDocument(tenantDocument) : "");
      setCopied(false);
      setConfirmationData(null);
    }
  }, [open, existingPixData, tenantDocument]);

  const handleSelectPix = () => {
    setPayMethod("pix");
    setStep(2);
  };

  const handleSelectCard = () => {
    setPayMethod("card");
    setStep(2);
  };

  const handleGeneratePix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = pixDocument.replace(/\D/g, "");
      const data = await createCheckout(planId, "pix", undefined, doc);
      if ("pix_qr_code" in data && "status" in data) {
        const pixResp = data as any;
        setPixData(data as CheckoutPixResponse);
        if (pixResp.charge_id) setPixChargeId(pixResp.charge_id);
        setConfirmationData(null);
      }
    } catch {
      setError("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [planId, pixDocument]);

  const handleCancelPix = async () => {
    if (!pixChargeId) { onClose(); return; }
    setCancelLoading(true);
    try {
      await cancelCharge(pixChargeId);
    } catch { /* ignore */ } finally {
      setCancelLoading(false);
      onClose();
    }
  };

  const handleCardSuccess = async (
    cardToken: string,
    document: string,
    billingAddress: any
  ) => {
    setLoading(true);
    setError(null);
    try {
      await createCheckout(
        planId,
        "credit_card",
        cardToken,
        document,
        billingAddress,
        startAt ?? undefined,
      );
      setConfirmationData({
        plan: "Plano Mensal",
        value: "R$ 99,90/mês",
        nextRenewal: dayjs().add(30, "day").format("DD/MM/YYYY"),
        method: "Cartão de Crédito",
      });
      setStep(3);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Erro ao processar pagamento.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (pixData?.pix_qr_code) {
      navigator.clipboard.writeText(pixData.pix_qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  // Step label mapping for the stepper indicator
  const activeStepIdx = step === 1 ? 0 : step === 2 ? 1 : 2;

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
          maxWidth: 760, // Aumentado para acomodar duas colunas confortavelmente
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "#1E2A6E",
            p: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Lock size={18} color="rgba(255,255,255,0.8)" />
            <Typography variant="subtitle1" fontWeight={700} color="white">
              Assinar Plano Mensal
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.8)" }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Stepper activeStep={activeStepIdx} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      display: "block",
                      color: "#757575", // Cinza visível para inativos (default/desativado)
                    },
                    "& .MuiStepLabel-label.Mui-disabled": {
                      color: "#9e9e9e", // Cinza médio para os próximos passos
                    },
                    "& .MuiStepLabel-label.Mui-active": {
                      color: "primary.main",
                      fontWeight: 700,
                    },
                    "& .MuiStepLabel-label.Mui-completed": {
                      color: "primary.main",
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Divider />

        {/* Step 1 — Choose method */}
        {step === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
              Escolha a forma de pagamento
            </Typography>
            <Stack direction="row" spacing={2}>
              {/* Card option */}
              <Box
                onClick={handleSelectCard}
                sx={{
                  flex: 1,
                  border: "2px solid",
                  borderColor: payMethod === "card" ? "primary.main" : "divider",
                  borderRadius: 3,
                  p: 2.5,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(49,52,133,0.03)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    bgcolor: "rgba(49,52,133,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <CreditCard size={26} color="#313485" />
                </Box>
                <Typography variant="body2" fontWeight={700}>
                  Cartão de crédito
                </Typography>
                <Typography variant="caption" color="text.primary" display="block" mt={0.5}>
                  Pague com cartão de crédito de forma segura.
                </Typography>
              </Box>

              {/* PIX option */}
              <Box
                onClick={handleSelectPix}
                sx={{
                  flex: 1,
                  border: "2px solid",
                  borderColor: payMethod === "pix" ? "primary.main" : "divider",
                  borderRadius: 3,
                  p: 2.5,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(49,52,133,0.03)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    bgcolor: "rgba(0,176,136,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <QrCode size={26} color="#00b088" />
                </Box>
                <Typography variant="body2" fontWeight={700}>
                  PIX
                </Typography>
                <Typography variant="caption" color="text.primary" display="block" mt={0.5}>
                  Pague via PIX e libere sua conta na hora.
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Step 2 — Card form */}
        {step === 2 && payMethod === "card" && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <IconButton
                size="small"
                onClick={() => { setStep(1); setError(null); }}
                sx={{ color: "text.primary" }}
              >
                <ArrowLeft size={18} />
              </IconButton>
              <Typography variant="subtitle1" fontWeight={700}>
                Dados do Cartão
              </Typography>
            </Box>

            {error && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: "rgba(211,47,47,0.06)", borderRadius: 2, border: "1px solid rgba(211,47,47,0.2)" }}>
                <Typography color="error" variant="body2">{error}</Typography>
              </Box>
            )}

            <CheckoutForm
              onSuccess={handleCardSuccess}
              buttonLabel="Confirmar pagamento"
              defaultDocument={tenantDocument}
            />
          </Box>
        )}

        {/* Step 2 — PIX */}
        {step === 2 && payMethod === "pix" && (
          <Box sx={{ p: 3 }}>
            {!existingPixData && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                <IconButton
                  size="small"
                  onClick={() => { setStep(1); setError(null); setPixData(null); }}
                  sx={{ color: "text.primary" }}
                >
                  <ArrowLeft size={18} />
                </IconButton>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pagamento via PIX
                </Typography>
              </Box>
            )}

            {!pixData ? (
              // Generate PIX
              <Box>
                <Typography variant="body2" color="text.primary" sx={{ mb: 2.5 }}>
                  Escaneie o QR Code ou copie o código abaixo para realizar o pagamento via PIX.
                </Typography>

                {!tenantDocument && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.primary" display="block" sx={{ mb: 0.5 }}>
                      CPF / CNPJ do titular
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={pixDocument}
                      onChange={(e) => setPixDocument(maskDocument(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                  </Box>
                )}

                {error && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: "rgba(211,47,47,0.06)", borderRadius: 2, border: "1px solid rgba(211,47,47,0.2)" }}>
                    <Typography color="error" variant="body2">{error}</Typography>
                  </Box>
                )}

                <Button
                  onClick={handleGeneratePix}
                  disabled={loading || (!tenantDocument && pixDocument.replace(/\D/g, "").length < 11)}
                  sx={{ width: "100%", py: 1.5, fontSize: "0.95rem", fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Gerar QR Code PIX"}
                </Button>
              </Box>
            ) : (
              // Show PIX QR Code
              <Box>
                <Typography variant="body2" color="text.primary" align="center" sx={{ mb: 2.5 }}>
                  Escaneie o QR Code ou copie o código abaixo para realizar o pagamento via PIX.
                </Typography>

                {/* QR Code */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2.5,
                    p: 2,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                  }}
                >
                  <QRCodeSVG value={pixData.pix_qr_code} size={200} />
                </Box>

                {/* Copy code field */}
                <Typography variant="caption" fontWeight={700} color="text.primary" display="block" sx={{ mb: 0.75 }}>
                  Código PIX (copie e cole)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "rgba(0,0,0,0.02)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      px: 1.5,
                      py: 1,
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: "0.7rem",
                    }}
                  >
                    {pixData.pix_qr_code}
                  </Typography>
                  <Button
                    size="small"
                    onClick={handleCopy}
                    sx={{
                      borderRadius: 0,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      px: 2,
                      py: 1.2,
                      minWidth: 70,
                      flexShrink: 0,
                    }}
                  >
                    {copied ? "Copiado ✓" : "Copiar"}
                  </Button>
                </Box>

                {/* Timer */}
                {pixData.expires_at && (
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    <Countdown expiresAt={pixData.expires_at} />
                  </Box>
                )}

                <Typography variant="caption" color="text.primary" align="center" display="block" sx={{ mb: 2.5 }}>
                  Assim que o pagamento for confirmado, sua assinatura será ativada automaticamente.
                </Typography>

                <Button
                  variant="text"
                  onClick={handleCancelPix}
                  disabled={cancelLoading}
                  sx={{ width: "100%", color: "text.primary", fontWeight: 600 }}
                >
                  {cancelLoading ? <CircularProgress size={16} /> : "Cancelar cobrança"}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "rgba(76,175,80,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <CheckCircle2 size={40} color="#4caf50" />
            </Box>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Pagamento confirmado!
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
              Sua assinatura foi ativada com sucesso.
            </Typography>

            {confirmationData && (
              <Box
                sx={{
                  bgcolor: "rgba(0,0,0,0.02)",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2.5,
                  mb: 3,
                  textAlign: "left",
                }}
              >
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.primary" fontWeight={600}>Plano</Typography>
                    <Typography variant="caption" fontWeight={700}>{confirmationData.plan}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.primary" fontWeight={600}>Valor</Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">{confirmationData.value}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.primary" fontWeight={600}>Próxima renovação</Typography>
                    <Typography variant="caption" fontWeight={700}>{confirmationData.nextRenewal}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.primary" fontWeight={600}>Forma de pagamento</Typography>
                    <Typography variant="caption" fontWeight={700}>{confirmationData.method}</Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Button
              onClick={() => { onSuccess(); onClose(); }}
              sx={{ width: "100%", py: 1.5, fontWeight: 700 }}
            >
              Ir para o Dashboard
            </Button>
          </Box>
        )}

        {/* Security note */}
        {step !== 3 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <Lock size={11} color="#9CA3AF" />
            <Typography variant="caption" color="text.disabled" fontSize="0.68rem">
              Ambiente seguro. Seus dados estão protegidos.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CheckoutStepper;
