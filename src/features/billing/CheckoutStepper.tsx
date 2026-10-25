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
  Chip,
  Alert,
} from "@mui/material";
import { X, CreditCard, QrCode, Lock, CheckCircle2, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "../../components/Button/Button";
import CheckoutForm from "./CheckoutForm";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import {
  createCheckout,
  cancelCharge,
  previewPackageProration,
  checkoutPackage,
  getChargeStatus,
} from "../../api/services/subscriptions";
import type {
  CheckoutPixResponse,
  PaymentMethod,
  ProrationPreviewResponse,
} from "./types";
import { maskDocument } from "../../utils/masks";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId?: string;
  packageCode?: string | null;
  tenantDocument?: string | null;
  /** If provided, the PIX charge is already generated - skip to step 2 */
  existingPixData?: {
    pix_qr_code: string;
    pix_qr_code_url?: string | null;
    expires_at?: string | null;
  } | null;
  /** If provided, creates a card subscription starting at this date (for PIX→Card transitions) */
  startAt?: string | null;
  title?: string;
  savedCards?: PaymentMethod[];
  defaultPaymentMethod?: "card" | "pix" | null;
  onPixGenerated?: (pixData: {
    qrCode: string;
    qrCodeUrl?: string | null;
    expiresAt?: string | null;
    amount?: number | null;
    chargeId?: string | null;
    title?: string;
  }) => void;
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

const formatDateSafe = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  return dayjs(clean).format("DD/MM/YYYY");
};

const CheckoutStepper = ({
  open,
  onClose,
  onSuccess,
  planId,
  packageCode,
  tenantDocument,
  existingPixData,
  startAt,
  title,
  savedCards,
  defaultPaymentMethod,
  onPixGenerated,
}: Props) => {
  const isPackage = !!packageCode;
  const isLockedPaymentMethod = isPackage && !!defaultPaymentMethod;
  const modalTitle = title || (isPackage ? "Ativação do Pacote WhatsApp" : "Pagamento & Assinatura");

  const [step, setStep] = useState<Step>(existingPixData || defaultPaymentMethod ? 2 : 1);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(
    existingPixData ? "pix" : defaultPaymentMethod || null
  );
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prorationData, setProrationData] = useState<ProrationPreviewResponse | null>(null);
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

  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | "new">(
    savedCards && savedCards.length > 0 ? (savedCards.find((c) => c.is_default)?.id || savedCards[0].id) : "new"
  );

  // Reset and load proration when opened
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
      } else if (defaultPaymentMethod) {
        setStep(2);
        setPayMethod(defaultPaymentMethod);
        setPixData(null);
        setError(null);
      } else {
        setStep(1);
        setPayMethod(null);
        setPixData(null);
        setError(null);
      }
      setPixDocument(tenantDocument ? maskDocument(tenantDocument) : "");
      setCopied(false);
      setConfirmationData(null);
      if (savedCards && savedCards.length > 0) {
        setSelectedSavedCardId(savedCards.find((c) => c.is_default)?.id || savedCards[0].id);
      } else {
        setSelectedSavedCardId("new");
      }

      if (packageCode) {
        previewPackageProration(packageCode)
          .then(setProrationData)
          .catch((err) => console.error("Erro ao carregar prévia do pacote", err));
      } else {
        setProrationData(null);
      }
    }
  }, [open, existingPixData, tenantDocument, savedCards, packageCode, defaultPaymentMethod]);

  // Auto-polling para detecção automática de Pix pago sem refresh manual
  useEffect(() => {
    if (!open || step !== 2 || payMethod !== "pix" || !pixData) return;

    const chargeId = pixChargeId || (pixData as any).charge_id || (pixData as any).id || (pixData as any).pagarme_charge_id;
    if (!chargeId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await getChargeStatus(chargeId);
        if (res.paid) {
          clearInterval(intervalId);
          toast.success("Pagamento Pix confirmado!");
          setStep(3);
          onSuccess();
        }
      } catch {
        // Silently ignore polling network errors
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [open, step, payMethod, pixData, pixChargeId, onSuccess, toast]);

  const handleSelectPix = () => {
    setPayMethod("pix");
    setStep(2);
  };

  const handleSelectCard = () => {
    setPayMethod("card");
    setStep(2);
  };

  const effectivePlanCode = (!planId || planId === "FREE_TRIAL") ? "MONTHLY" : planId;

  const handleGeneratePix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = pixDocument.replace(/\D/g, "");
      if (packageCode) {
        const data: any = await checkoutPackage({
          package_code: packageCode,
          payment_method: "pix",
          document: doc,
        });

        if (data.is_downgrade || data.amount === 0) {
          setConfirmationData({
            plan: prorationData?.package_name || "Pacote de Mensagens WhatsApp",
            value: `R$ 0,00 hoje (Nova mensalidade: R$ ${((prorationData?.monthly_price_cents || 0) / 100).toFixed(2).replace(".", ",")}/mês)`,
            nextRenewal: prorationData?.next_billing_date
              ? formatDateSafe(prorationData.next_billing_date)
              : dayjs().add(30, "day").format("DD/MM/YYYY"),
            method: "PIX",
          });
          setStep(3);
          return;
        }

        const pixPayload = {
          pagarme_subscription_id: "",
          status: "pending",
          pix_qr_code: String(data.pix_qr_code || ""),
          pix_qr_code_url: data.pix_qr_code_url ? String(data.pix_qr_code_url) : "",
          expires_at: data.expires_at ? String(data.expires_at) : "",
          charge_id: data.charge_id,
          amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || 0,
        };
        setPixData(pixPayload as any);
        if (data.charge_id) setPixChargeId(String(data.charge_id));

        if (onPixGenerated) {
          onPixGenerated({
            qrCode: String(data.pix_qr_code || ""),
            qrCodeUrl: data.pix_qr_code_url ? String(data.pix_qr_code_url) : null,
            expiresAt: data.expires_at ? String(data.expires_at) : null,
            amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || 0,
            chargeId: data.charge_id ? String(data.charge_id) : undefined,
            title: prorationData?.package_name ? `Ativação do ${prorationData.package_name}` : "Ativação do Pacote WhatsApp",
          });
          onClose();
          return;
        }
      } else {
        const data = await createCheckout(effectivePlanCode, "pix", undefined, doc);
        if ("pix_qr_code" in data && "status" in data) {
          const pixResp = data as any;
          const pixPayload = {
            ...data,
            charge_id: pixResp.charge_id || pixResp.id,
          };
          setPixData(pixPayload as any);
          if (pixResp.charge_id) setPixChargeId(String(pixResp.charge_id));

          if (onPixGenerated) {
            onPixGenerated({
              qrCode: data.pix_qr_code || "",
              qrCodeUrl: data.pix_qr_code_url ?? null,
              expiresAt: data.expires_at ?? null,
              amount: (data as any).amount || 14990,
              chargeId: pixResp.charge_id ? String(pixResp.charge_id) : undefined,
              title: "Pagamento da assinatura do sistema Data Pet",
            });
            onClose();
            return;
          }
        }
      }
      setConfirmationData(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Erro ao gerar PIX. Tente novamente.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  }, [effectivePlanCode, packageCode, pixDocument, onPixGenerated, prorationData, onClose]);

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

  const handleUseSavedCard = async (cardId: string) => {
    setLoading(true);
    setError(null);
    try {
      const chosenCard = savedCards?.find((c) => c.id === cardId);
      if (packageCode) {
        const data: any = await checkoutPackage({
          package_code: packageCode,
          payment_method: "credit_card",
          card_id: cardId,
        });
        setConfirmationData({
          plan: prorationData?.package_name || "Pacote de Mensagens WhatsApp",
          value: (data.is_downgrade || prorationData?.is_downgrade)
            ? `R$ 0,00 hoje (Nova mensalidade: R$ ${((prorationData?.monthly_price_cents || 0) / 100).toFixed(2).replace(".", ",")}/mês)`
            : prorationData?.is_prorated
            ? `R$ ${(prorationData.prorated_price_cents / 100).toFixed(2).replace(".", ",")}`
            : `R$ ${((prorationData?.monthly_price_cents || 3790) / 100).toFixed(2).replace(".", ",")}/mês`,
          nextRenewal: prorationData?.next_billing_date
            ? formatDateSafe(prorationData.next_billing_date)
            : dayjs().add(30, "day").format("DD/MM/YYYY"),
          method: chosenCard ? `Cartão (${chosenCard.brand.toUpperCase()} •••• ${chosenCard.last4})` : "Cartão de Crédito",
        });
      } else {
        await createCheckout(
          effectivePlanCode,
          "credit_card",
          undefined,
          undefined,
          undefined,
          startAt ?? undefined,
          cardId
        );
        setConfirmationData({
          plan: "Plano Data Pet Pro",
          value: "R$ 149,90/mês",
          nextRenewal: dayjs().add(30, "day").format("DD/MM/YYYY"),
          method: chosenCard ? `Cartão •••• ${chosenCard.last4}` : "Cartão de Crédito",
        });
      }
      setStep(3);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Erro ao processar pagamento.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
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
      if (packageCode) {
        const data: any = await checkoutPackage({
          package_code: packageCode,
          payment_method: "credit_card",
          card_token: cardToken,
          document,
          billing_address: billingAddress,
        });
        setConfirmationData({
          plan: prorationData?.package_name || "Pacote de Mensagens WhatsApp",
          value: (data.is_downgrade || prorationData?.is_downgrade)
            ? `R$ 0,00 hoje (Nova mensalidade: R$ ${((prorationData?.monthly_price_cents || 0) / 100).toFixed(2).replace(".", ",")}/mês)`
            : prorationData?.is_prorated
            ? `R$ ${(prorationData.prorated_price_cents / 100).toFixed(2).replace(".", ",")}`
            : `R$ ${((prorationData?.monthly_price_cents || 3790) / 100).toFixed(2).replace(".", ",")}/mês`,
          nextRenewal: prorationData?.next_billing_date
            ? formatDateSafe(prorationData.next_billing_date)
            : dayjs().add(30, "day").format("DD/MM/YYYY"),
          method: "Cartão de Crédito",
        });
      } else {
        await createCheckout(
          effectivePlanCode,
          "credit_card",
          cardToken,
          document,
          billingAddress,
          startAt ?? undefined,
        );
        setConfirmationData({
          plan: "Plano Data Pet Pro",
          value: "R$ 149,90/mês",
          nextRenewal: dayjs().add(30, "day").format("DD/MM/YYYY"),
          method: "Cartão de Crédito",
        });
      }
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

  const renderPackageSummary = () => {
    if (!isPackage || !prorationData) return null;

    const packageMsgMap: Record<string, number> = {
      pkg_200: 200,
      pkg_300: 300,
      pkg_500: 500,
      pkg_750: 750,
      pkg_1000: 1000,
      pkg_2000: 2000,
    };
    const totalMsgs =
      prorationData.total_messages ||
      (packageCode ? packageMsgMap[packageCode] : null) ||
      500;
    const proratedMsgs =
      prorationData.prorated_messages ||
      Math.max(
        1,
        Math.round(
          (totalMsgs / (prorationData.total_days_in_cycle || 30)) *
            prorationData.days_remaining
        )
      );

    return (
      <Box
        sx={{
          mb: 3,
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          border: "1.5px solid #E2E8F0",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {/* Header do Pacote */}
        <Box
          sx={{
            p: 2.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            borderBottom: (prorationData.is_prorated || prorationData.is_downgrade) ? "1px solid #F1F5F9" : "none",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "#DCFCE7",
                border: "1px solid #BBF7D0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16A34A",
                flexShrink: 0,
              }}
            >
              <MessageCircle size={22} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0F172A" lineHeight={1.2}>
                {prorationData.package_name}
              </Typography>
              <Typography variant="caption" color="#475569" fontWeight={500}>
                Mensalidade regular: <strong>R$ {(prorationData.monthly_price_cents / 100).toFixed(2).replace(".", ",")}/mês</strong>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Typography variant="caption" color="#64748B" display="block" fontWeight={600}>
              {prorationData.is_downgrade ? "Você paga hoje:" : prorationData.is_prorated ? "Você paga hoje:" : "Valor da mensalidade:"}
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#16A34A" lineHeight={1.1}>
              R$ {prorationData.is_downgrade ? "0,00" : ((prorationData.is_prorated ? prorationData.prorated_price_cents : prorationData.monthly_price_cents) / 100).toFixed(2).replace(".", ",")}
            </Typography>
          </Box>
        </Box>

        {/* Explicação Didática de Downgrade */}
        {prorationData.is_downgrade && (
          <Box sx={{ p: 2, bgcolor: "#F8FAFC" }}>
            <Stack spacing={1.2}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#DCFCE7",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  1
                </Box>
                <Typography variant="body2" color="#334155" sx={{ fontSize: "0.84rem" }}>
                  <strong>Sem cobrança no ciclo atual (R$ 0,00):</strong> Como você já pagou pelo pacote vigente neste mês, não há nenhuma cobrança hoje e você continua com suas mensagens atuais até o término do ciclo em {formatDateSafe(prorationData.next_billing_date)}.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#E0E7FF",
                    color: "#3730A3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  2
                </Box>
                <Typography variant="body2" color="#334155" sx={{ fontSize: "0.84rem" }}>
                  <strong>Próximas renovações:</strong> A partir de {formatDateSafe(prorationData.next_billing_date)}, a cota será ajustada para <strong>{totalMsgs.toLocaleString("pt-BR")} mensagens</strong> no novo valor reduzido de <strong>R$ {(prorationData.monthly_price_cents / 100).toFixed(2).replace(".", ",")}/mês</strong>, cobrado todo dia {prorationData.billing_day} junto com sua assinatura.
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Explicação Didática do Ciclo Proporcional (Upgrade / Novo) */}
        {!prorationData.is_downgrade && prorationData.is_prorated && (
          <Box sx={{ p: 2, bgcolor: "#F8FAFC" }}>
            <Stack spacing={1.2}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#FEF3C7",
                    color: "#92400E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  1
                </Box>
                <Typography variant="body2" color="#334155" sx={{ fontSize: "0.84rem" }}>
                  <strong>Pagamento proporcional hoje:</strong> Você paga apenas <strong>R$ {(prorationData.prorated_price_cents / 100).toFixed(2).replace(".", ",")}</strong> com cota de <strong>{proratedMsgs.toLocaleString("pt-BR")} mensagens</strong> para utilizar nos <strong>{prorationData.days_remaining} dias</strong> restantes até o dia {prorationData.billing_day}.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: "#E0E7FF",
                    color: "#3730A3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.2,
                  }}
                >
                  2
                </Box>
                <Typography variant="body2" color="#334155" sx={{ fontSize: "0.84rem" }}>
                  <strong>Próximas renovações:</strong> A partir de {formatDateSafe(prorationData.next_billing_date)}, a cota é renovada para <strong>{totalMsgs.toLocaleString("pt-BR")} mensagens</strong> no valor regular de <strong>R$ {(prorationData.monthly_price_cents / 100).toFixed(2).replace(".", ",")}/mês</strong>, cobrado automaticamente todo dia {prorationData.billing_day} junto com sua assinatura.
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  if (!open) return null;

  // Step label mapping for the stepper indicator
  const activeStepIdx = step === 1 ? 0 : step === 2 ? 1 : 2;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: { xs: 0, sm: 2 },
      }}
    >
      <Box
        sx={{
          bgcolor: "#313485",
          borderRadius: { xs: 0, sm: "16px" },
          width: "100%",
          maxWidth: 760,
          height: { xs: "100dvh", sm: "auto" },
          maxHeight: { xs: "100dvh", sm: "92vh" },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "#313485",
            p: { xs: "16px 20px", sm: "20px 24px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Lock size={18} color="rgba(255,255,255,0.9)" />
            <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              {modalTitle}
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

        {/* Modal Body Container */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            pb: { xs: "calc(24px + env(safe-area-inset-bottom, 0px))", sm: 2 },
          }}
        >
          {/* Stepper */}
          <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 2, pb: 1, flexShrink: 0 }}>
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
            {/* Package Proration Summary if in package mode */}
            {renderPackageSummary()}

            {/* Base Plan Summary if in subscription mode */}
            {!isPackage && (
              <Box
                sx={{
                  mb: 3,
                  p: 2.2,
                  borderRadius: 3,
                  bgcolor: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: "rgba(49, 52, 133, 0.08)",
                      border: "1px solid rgba(49, 52, 133, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#313485",
                      flexShrink: 0,
                    }}
                  >
                    <CreditCard size={22} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#0F172A" lineHeight={1.2}>
                      Plano Data Pet Pro
                    </Typography>
                    <Typography variant="caption" color="#475569" fontWeight={500}>
                      Acesso completo ao sistema, clientes, pets e agendamentos
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                  <Typography variant="caption" color="#64748B" display="block" fontWeight={600}>
                    Valor da assinatura:
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="#313485" lineHeight={1.1}>
                    R$ 149,90<Typography component="span" variant="caption" sx={{ color: "#64748B", ml: 0.5 }}>/mês</Typography>
                  </Typography>
                </Box>
              </Box>
            )}

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

        {/* Step 2 — Card form / Saved Card Selection */}
        {step === 2 && payMethod === "card" && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              {!isLockedPaymentMethod && (
                <IconButton
                  size="small"
                  onClick={() => { setStep(1); setError(null); }}
                  sx={{ color: "text.primary" }}
                >
                  <ArrowLeft size={18} />
                </IconButton>
              )}
              <Typography variant="subtitle1" fontWeight={700}>
                {savedCards && savedCards.length > 0 ? "Escolha o Cartão" : "Dados do Cartão"}
              </Typography>
            </Box>

            {isLockedPaymentMethod && (
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                Sua assinatura atual é cobrada no <strong>Cartão de Crédito</strong> com renovação automática unificada. Para manter seu plano sincronizado, a contratação deste pacote será vinculada diretamente ao seu cartão.
              </Alert>
            )}

            {renderPackageSummary()}

            {error && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: "rgba(211,47,47,0.06)", borderRadius: 2, border: "1px solid rgba(211,47,47,0.2)" }}>
                <Typography color="error" variant="body2">{error}</Typography>
              </Box>
            )}

            {savedCards && savedCards.length > 0 && selectedSavedCardId !== "new" ? (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>
                  Selecione um dos seus cartões cadastrados ou adicione um novo:
                </Typography>

                <Stack spacing={1.5}>
                  {savedCards.map((card) => {
                    const isSelected = selectedSavedCardId === card.id;
                    return (
                      <Box
                        key={card.id}
                        onClick={() => setSelectedSavedCardId(card.id)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          borderRadius: 3,
                          border: "1.5px solid",
                          borderColor: isSelected ? "#313485" : "#E2E8F0",
                          bgcolor: isSelected ? "rgba(49, 52, 133, 0.04)" : "white",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: "#313485",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <CreditCard size={20} color="#313485" />
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" fontWeight={800} color="#0F172A">
                                {card.brand.toUpperCase()} •••• {card.last4}
                              </Typography>
                              {card.is_default && (
                                <Chip
                                  label="Padrão"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.62rem",
                                    fontWeight: 800,
                                    bgcolor: "#313485",
                                    color: "#fff",
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              Expira {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: isSelected ? "#313485" : "#CBD5E1",
                            bgcolor: isSelected ? "#313485" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && (
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "white" }} />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>

                <Box sx={{ pt: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setSelectedSavedCardId("new")}
                    sx={{ fontWeight: 700, color: "#313485" }}
                  >
                    + Pagar com um novo cartão
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => handleUseSavedCard(selectedSavedCardId)}
                    disabled={loading}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 2.5,
                      px: 3,
                      py: 1.2,
                      bgcolor: "#313485",
                      "&:hover": { bgcolor: "#24276A" },
                    }}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : prorationData?.is_downgrade ? "Confirmar Downgrade" : "Confirmar e Pagar"}
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Box>
                {savedCards && savedCards.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setSelectedSavedCardId(savedCards.find((c) => c.is_default)?.id || savedCards[0].id)}
                      startIcon={<ArrowLeft size={16} />}
                      sx={{ fontWeight: 700, color: "#313485" }}
                    >
                      Voltar para cartões salvos
                    </Button>
                  </Box>
                )}
                <CheckoutForm
                  onSuccess={handleCardSuccess}
                  buttonLabel={prorationData?.is_downgrade ? "Confirmar Downgrade" : "Confirmar pagamento"}
                  defaultDocument={tenantDocument}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Step 2 — PIX */}
        {step === 2 && payMethod === "pix" && (
          <Box sx={{ p: 3 }}>
            {!existingPixData && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                {!isLockedPaymentMethod && (
                  <IconButton
                    size="small"
                    onClick={() => { setStep(1); setError(null); setPixData(null); }}
                    sx={{ color: "text.primary" }}
                  >
                    <ArrowLeft size={18} />
                  </IconButton>
                )}
                <Typography variant="subtitle1" fontWeight={700}>
                  Pagamento via PIX
                </Typography>
              </Box>
            )}

            {isLockedPaymentMethod && (
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                Sua assinatura atual está configurada via <strong>PIX</strong>.{prorationData?.is_downgrade ? " A alteração do pacote será aplicada na sua assinatura unificada na próxima renovação." : " A cobrança deste pacote será gerada na mesma modalidade de pagamento."}
              </Alert>
            )}

            {!pixData ? (
              // Generate PIX
              <Box>
                {renderPackageSummary()}
                <Typography variant="body2" color="text.primary" sx={{ mb: 2.5 }}>
                  {prorationData?.is_downgrade
                    ? "O downgrade não gera nenhuma cobrança no ciclo atual. Clique no botão abaixo para confirmar a alteração para a próxima renovação."
                    : "Escaneie o QR Code ou copie o código abaixo para realizar o pagamento via PIX."}
                </Typography>

                {!prorationData?.is_downgrade && !tenantDocument && (
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
                  disabled={loading || (!prorationData?.is_downgrade && !tenantDocument && pixDocument.replace(/\D/g, "").length < 11)}
                  sx={{ width: "100%", py: 1.5, fontSize: "0.95rem", fontWeight: 700 }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : prorationData?.is_downgrade ? (
                    "Confirmar Downgrade"
                  ) : (
                    "Gerar QR Code PIX"
                  )}
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

                {/* Status de Polling Ativo */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.2,
                    mb: 2,
                    p: 1.2,
                    bgcolor: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#D97706",
                      boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.2)",
                      animation: "pulseDot 1.6s infinite ease-in-out",
                      "@keyframes pulseDot": {
                        "0%": { transform: "scale(0.9)", opacity: 0.7 },
                        "50%": { transform: "scale(1.2)", opacity: 1 },
                        "100%": { transform: "scale(0.9)", opacity: 0.7 },
                      },
                    }}
                  />
                  <Typography variant="caption" fontWeight={700} color="#92400E">
                    Aguardando pagamento... (verificando automaticamente a cada 3s)
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 2.5 }}>
                  Assim que o pagamento for confirmado, seu pacote ou assinatura será ativado automaticamente.
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
              {prorationData?.is_downgrade
                ? "Downgrade agendado!"
                : isPackage
                ? "Pacote WhatsApp ativado!"
                : "Pagamento confirmado!"}
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
              {prorationData?.is_downgrade
                ? `Sua alteração para o pacote de ${prorationData.total_messages || 200} mensagens foi agendada. Você continua utilizando o saldo do pacote atual até a data de renovação.`
                : isPackage
                ? "Seu pacote de mensagens foi ativado com sucesso. Agora os lembretes automáticos estão liberados!"
                : "Sua assinatura foi ativada com sucesso."}
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
                    <Typography variant="caption" color="text.primary" fontWeight={600}>
                      {isPackage ? "Pacote" : "Plano"}
                    </Typography>
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
              {isPackage ? "Concluir" : "Ir para o Dashboard"}
            </Button>
          </Box>
        )}

        {/* Security note */}
        {step !== 3 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <Lock size={11} color="#9CA3AF" />
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem" }}>
              Ambiente seguro. Seus dados estão protegidos.
            </Typography>
          </Box>
        )}
        </Box>
      </Box>
    </Box>
  );
};

export default CheckoutStepper;
