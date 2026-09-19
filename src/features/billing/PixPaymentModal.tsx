import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import { X, Copy, Check, Clock, HelpCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import { maskDocument } from "../../utils/masks";
import { useToast } from "../../hooks/useToast";
import { getChargeStatus } from "../../api/services/subscriptions";

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  qrCode: string;
  qrCodeUrl?: string | null;
  expiresAt?: string | null;
  amount?: number | null; // Cents or total (e.g. 9990 or 99.90)
  chargeId?: string | null;
  payerName?: string;
  payerDocument?: string | null;
  title?: string;
  providerName?: string;
  providerCnpj?: string;
  onCancelCharge?: () => Promise<void>;
  onPaymentConfirmed?: () => void;
}

export default function PixPaymentModal({
  open,
  onClose,
  qrCode,
  expiresAt,
  amount = 9990,
  chargeId,
  payerName = "Seu Estabelecimento",
  payerDocument,
  title = "Pagamento da assinatura do sistema Data Pet",
  providerName = "Data Pet Tecnologia LTDA",
  providerCnpj = "54.123.456/0001-89",
  onCancelCharge,
  onPaymentConfirmed,
}: PixPaymentModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Auto-polling para detecção automática de Pix pago sem necessidade de refresh
  useEffect(() => {
    if (!open || !chargeId) return;

    const intervalId = setInterval(async () => {
      try {
        setCheckingPayment(true);
        const res = await getChargeStatus(chargeId);
        if (res.paid) {
          clearInterval(intervalId);
          toast.success("Pagamento PIX confirmado com sucesso!");
          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
          onClose();
        }
      } catch {
        // Ignora erros de rede durante o polling
      } finally {
        setTimeout(() => setCheckingPayment(false), 800);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [open, chargeId, onPaymentConfirmed, onClose, toast]);

  // Formata o valor para BRL
  const formattedAmount = (() => {
    if (!amount && amount !== 0) return "R$ 99,90";
    const val = amount > 1000 ? amount / 100 : amount;
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  })();

  // Timer decrescente de expiração
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("");
      return;
    }

    const calculateTime = () => {
      const diff = dayjs(expiresAt).diff(dayjs(), "second");
      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCancel = async () => {
    if (!onCancelCharge) return;
    setCanceling(true);
    try {
      await onCancelCharge();
      onClose();
    } catch {
      // Ignora erro de cancelamento
    } finally {
      setCanceling(false);
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1400,
        p: { xs: 1.5, sm: 2.5 },
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: { xs: 3, sm: 4 },
          width: "100%",
          maxWidth: 680,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          my: "auto",
          animation: "modalFadeIn 0.25s ease-out",
          "@keyframes modalFadeIn": {
            from: { opacity: 0, transform: "scale(0.97)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      >
        {/* ── 1. TOPO: FAIXA ESCURA INSTITUCIONAL (Estilo Bemprático) ── */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #164E43 0%, #0F3F36 100%)",
            color: "white",
            px: { xs: 2.5, sm: 3.5 },
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              letterSpacing: "-0.01em",
              textAlign: "center",
              flex: 1,
              pr: 2,
            }}
          >
            {title}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              "&:hover": { color: "white", bgcolor: "rgba(255, 255, 255, 0.12)" },
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* ── 2. CONTEÚDO PRINCIPAL ── */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {/* Identificação da Empresa e do Pagador */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2.5,
              mb: 3,
              pb: 2.5,
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            {/* Lado Esquerdo: Logo e Prestador de Serviço */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 240, flex: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2.5,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FAFAFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 100,
                  height: 48,
                }}
              >
                <img
                  src="/logo_dark.png"
                  alt="Data Pet"
                  style={{ height: 26, width: "auto", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={900}
                  color="#1E293B"
                  sx={{ display: "none", ".no-logo &": { display: "block" } }}
                >
                  Data Pet
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.72rem", lineHeight: 1.3 }}>
                  Responsável pelo recebimento e entrega dos serviços:
                </Typography>
                <Typography variant="body2" fontWeight={800} color="#0F172A" sx={{ fontSize: "0.85rem", mt: 0.2 }}>
                  {providerName}
                </Typography>
                <Typography variant="caption" color="#475569" sx={{ fontSize: "0.75rem" }}>
                  CNPJ: {providerCnpj}
                </Typography>
              </Box>
            </Box>

            {/* Lado Direito: Dados do Pagador e Valor */}
            <Box sx={{ textAlign: { xs: "left", sm: "right" }, minWidth: 180 }}>
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.72rem" }}>
                Pagador:
              </Typography>
              <Typography variant="body2" fontWeight={800} color="#0F172A" sx={{ fontSize: "0.9rem" }}>
                {payerName}
              </Typography>
              {payerDocument && (
                <Typography variant="caption" color="#475569" sx={{ display: "block", fontSize: "0.78rem" }}>
                  CNPJ/CPF: {maskDocument(payerDocument)}
                </Typography>
              )}

              <Box sx={{ mt: 1, display: "inline-flex", alignItems: "baseline", gap: 0.8 }}>
                <Typography variant="caption" fontWeight={700} color="#64748B" textTransform="uppercase">
                  Valor:
                </Typography>
                <Typography variant="h6" fontWeight={900} color="#166534" sx={{ fontSize: "1.25rem" }}>
                  {formattedAmount}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ── 3. CARD CINZA COM OPÇÃO 1 (QRCODE) E OPÇÃO 2 (COPIA E COLA) ── */}
          <Box
            sx={{
              bgcolor: "#F8FAFC",
              borderRadius: 3.5,
              border: "1.5px solid #E2E8F0",
              p: { xs: 2.5, sm: 3 },
              mb: 3,
            }}
          >
            {/* Seção Opção 1: QRCode */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
                pb: 3,
                borderBottom: "1px dashed #CBD5E1",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  color="#0F172A"
                  sx={{ fontSize: "1rem", mb: 0.5 }}
                >
                  Opção 1: QRCode
                </Typography>
                <Typography variant="body2" color="#475569" sx={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
                  Abra o App do seu Banco e escaneie o código QR ao lado para efetuar o pagamento.
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <Typography variant="caption" fontWeight={600} color="#166534">
                    Pagamento instantâneo via Banco Central
                  </Typography>
                </Box>
              </Box>

              {/* QR Code Container com logo do PIX */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "white",
                    borderRadius: 3,
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QRCodeSVG
                    value={qrCode}
                    size={150}
                    level="M"
                    marginSize={1}
                  />
                </Box>

                {/* Badge Oficial PIX */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(50, 188, 173, 0.08)",
                    border: "1px solid rgba(50, 188, 173, 0.25)",
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      transform: "rotate(45deg)",
                      bgcolor: "#32BCAD",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                  <Typography variant="caption" fontWeight={900} color="#0D9488" sx={{ fontSize: "0.8rem", letterSpacing: 0.5 }}>
                    pix
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Seção Opção 2: Pix Copia e Cola */}
            <Box sx={{ pt: 2.5 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                color="#0F172A"
                sx={{ fontSize: "0.95rem", mb: 1 }}
              >
                Opção 2: Pix Copia e Cola:
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "white",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: 2.5,
                  p: 0.8,
                  gap: 1,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": { borderColor: "#94A3B8" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 0.5,
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    userSelect: "all",
                  }}
                >
                  {qrCode}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleCopy}
                  startIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                  sx={{
                    bgcolor: copied ? "#16A34A" : "#1E293B",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    borderRadius: 2,
                    px: 2,
                    py: 0.9,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    textTransform: "none",
                    "&:hover": { bgcolor: copied ? "#15803D" : "#0F172A" },
                  }}
                >
                  {copied ? "Copiado!" : "Copiar código"}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* ── 4. STATUS: AGUARDANDO PAGAMENTO E TIMER ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
              mb: 3,
              p: 1.5,
              bgcolor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: 2.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
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
              <Box>
                <Typography variant="body2" fontWeight={800} color="#92400E" sx={{ fontSize: "0.85rem" }}>
                  Aguardando pagamento...
                </Typography>
                <Typography variant="caption" color="#B45309" sx={{ fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                  <RefreshCw size={11} style={{ animation: checkingPayment ? "spin 1s linear infinite" : "none" }} />
                  Verificando automaticamente a cada 3s
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Clock size={15} color="#92400E" />
              <Typography variant="caption" fontWeight={700} color="#92400E" sx={{ fontSize: "0.8rem" }}>
                {timeLeft ? `Expira em: ${timeLeft}` : expiresAt ? `Válido até ${dayjs(expiresAt).format("HH:mm")}` : "Válido por 1 hora"}
              </Typography>
            </Box>
          </Box>

          {/* ── 5. RODAPÉ: SUPORTE E BOTÕES ── */}
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.6, mb: 2 }}>
              <HelpCircle size={15} color="#64748B" />
              <Typography variant="caption" color="#64748B">
                Precisa de ajuda?{" "}
                <Box
                  component="a"
                  href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20pagamento%20PIX%20do%20Data%20Pet"
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    color: "#0F766E",
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    "&:hover": { color: "#115E59" },
                  }}
                >
                  Clique aqui para falar com nosso atendimento
                </Box>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 3.5,
                  py: 1,
                  color: "#334155",
                  borderColor: "#CBD5E1",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
                }}
              >
                Voltar para o sistema
              </Button>

              {onCancelCharge && (
                <Button
                  variant="text"
                  color="error"
                  onClick={handleCancel}
                  disabled={canceling}
                  sx={{
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.82rem",
                  }}
                >
                  {canceling ? <CircularProgress size={16} color="inherit" /> : "Cancelar cobrança PIX"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
