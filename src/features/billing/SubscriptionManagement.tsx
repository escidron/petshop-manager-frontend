import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Crown,
  CreditCard,
  Calendar,
  Clock,
  Edit2,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  Layers,
  Info,
  Copy,
  Check,
  HelpCircle,
  Plus,
  ShieldAlert,
  RotateCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { toast } from "react-toastify";
import PixIcon from "../../components/PixIcon";
import {
  addPaymentMethod,
  changeSubscriptionToPix,
  setDefaultPaymentMethod,
  createCheckout,
  getChargeStatus,
  reactivateSubscription,
} from "../../api/services/subscriptions";
import { translatePagarmeError } from "../../utils/translatePagarmeError";
import type { PaymentMethod, SubscriptionCharge } from "./types";

dayjs.locale("pt-br");

interface SubscriptionManagementProps {
  tenant: any;
  savedCards: PaymentMethod[];
  charges: SubscriptionCharge[];
  activePendingPix: {
    qrCode: string;
    qrCodeUrl?: string | null;
    expiresAt?: string | null;
    amount?: number | null;
    chargeId?: string | null;
    title?: string;
  } | null;
  onOpenCancelModal: () => void;
  onRefreshData: () => Promise<void>;
  onToggleInvoices?: () => void;
  showInvoices?: boolean;
  autoOpenPix?: boolean;
  onOpenPixModal?: (pixData?: any) => void;
}

type ModalStep =
  | "manage"
  | "change_payment"
  | "add_card"
  | "pix_payment"
  | "success";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  tenant,
  savedCards,
  charges = [],
  activePendingPix,
  onOpenCancelModal,
  onRefreshData,
  onToggleInvoices,
  autoOpenPix,
  onOpenPixModal,
}) => {
  const sub = tenant?.subscription;
  const isPixMethod = sub?.payment_method === "pix";
  const defaultCard = savedCards?.find((c) => c.is_default) || savedCards?.[0] || null;
  const hasCard = Boolean(defaultCard);

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("manage");
  const [modalEntryStep, setModalEntryStep] = useState<"manage" | "change_payment" | "add_card">("manage");

  // Opção selecionada no fluxo de alteração
  const [selectedMethodOption, setSelectedMethodOption] = useState<"card" | "pix">("card");
  const [openPixConfirmDialog, setOpenPixConfirmDialog] = useState(false);
  const [loadingPixChange, setLoadingPixChange] = useState(false);
  const [successMethod, setSuccessMethod] = useState<"Cartão de Crédito" | "PIX">("PIX");

  // Form de adição de cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardCpf, setCardCpf] = useState(tenant?.document ? formatCpf(tenant.document) : "");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loadingSaveCard, setLoadingSaveCard] = useState(false);
  const [cardFormError, setCardFormError] = useState<string | null>(null);

  const [selectedCardId, setSelectedCardId] = useState<string>(() => defaultCard?.id || savedCards?.[0]?.id || "new");
  const [loadingSwitchCard, setLoadingSwitchCard] = useState(false);

  React.useEffect(() => {
    if (savedCards && savedCards.length > 0) {
      const def = savedCards.find((c) => c.is_default) || savedCards[0];
      if (def && (!selectedCardId || selectedCardId === "new")) {
        setSelectedCardId(def.id);
      }
    }
  }, [savedCards]);

  // Estado de cópia de PIX
  const [copiedPix, setCopiedPix] = useState(false);

  // Estado local de PIX gerado no Pagar.me
  const [localPixData, setLocalPixData] = useState<{
    qrCode: string;
    qrCodeUrl?: string | null;
    expiresAt?: string | null;
    amount: number;
    chargeId?: string;
  } | null>(null);
  const [loadingGeneratePix, setLoadingGeneratePix] = useState(false);

  const hasPendingChargeInDb = useMemo(() => {
    return charges?.some((c) => c.status === "pending" && c.payment_method === "pix");
  }, [charges]);

  const effectivePixData = useMemo(() => {
    if (sub?.status === "active" && !hasPendingChargeInDb) {
      return null;
    }
    if (localPixData?.qrCode) return localPixData;
    if (activePendingPix?.qrCode) return activePendingPix;
    return null;
  }, [localPixData, activePendingPix, sub?.status, hasPendingChargeInDb]);

  // Helper para parsing seguro de datas sem retroceder o dia por fuso horário
  const parseDateSafe = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const datePart = dateStr.split("T")[0];
    if (datePart && datePart.includes("-")) {
      const parts = datePart.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return dayjs(new Date(parts[0], parts[1] - 1, parts[2]));
      }
    }
    return dayjs(dateStr);
  };

  // STATUS REAL E DINÂMICO DA ASSINATURA
  const subscriptionStatus = useMemo(() => {
    if (!sub) {
      return {
        key: "none",
        label: "Sem assinatura",
        color: "#64748B",
        bgColor: "#F1F5F9",
        dotColor: "#94A3B8",
      };
    }

    const nowMs = Date.now();
    const trialEndMs = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;
    const isTrialFuture = Boolean(trialEndMs && trialEndMs > nowMs);

    // Cancelado
    if (sub.status === "canceled" || Boolean(sub.canceled_at)) {
      return {
        key: "canceled",
        label: "Cancelada",
        color: "#DC2626",
        bgColor: "#FEE2E2",
        dotColor: "#EF4444",
      };
    }

    // Inadimplente / Pagamento pendente
    if (sub.status === "past_due") {
      return {
        key: "past_due",
        label: "Pagamento pendente",
        color: "#D97706",
        bgColor: "#FEF3C7",
        dotColor: "#F59E0B",
      };
    }

    // Período de teste expirado
    if (trialEndMs && trialEndMs <= nowMs && sub.status === "trialing") {
      // Playbook §9: Se current_period_end > trial_ends_at e ainda no futuro,
      // significa que o primeiro período já está pago (PIX antecipado) — tratar como ATIVO
      const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      if (periodEndMs && periodEndMs > trialEndMs && periodEndMs > nowMs) {
        return {
          key: "active",
          label: "Ativo",
          color: "#166534",
          bgColor: "#DCFCE7",
          dotColor: "#10B981",
        };
      }

      return {
        key: "trial_expired",
        label: "Teste expirado",
        color: "#DC2626",
        bgColor: "#FEE2E2",
        dotColor: "#EF4444",
      };
    }

    // Período de teste ativo (só muda para ativo quando o trial realmente expirar)
    if (isTrialFuture || sub.status === "trialing") {
      return {
        key: "trialing",
        label: "Em teste grátis",
        color: "#2563EB",
        bgColor: "#EFF6FF",
        dotColor: "#3B82F6",
      };
    }

    // Assinatura ativa com período vencido além da tolerância
    if (sub.status === "active") {
      const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      const graceMs = (sub.payment_method === "pix" ? 3 : 0) * 24 * 60 * 60 * 1000;
      if (periodEndMs && nowMs > periodEndMs + graceMs) {
        return {
          key: "expired",
          label: "Assinatura expirada",
          color: "#DC2626",
          bgColor: "#FEE2E2",
          dotColor: "#EF4444",
        };
      }

      return {
        key: "active",
        label: "Ativo",
        color: "#166534",
        bgColor: "#DCFCE7",
        dotColor: "#10B981",
      };
    }

    // Pendente / Incompleto / Agendamento futuro no gateway
    if (sub.status === "incomplete" || sub.status === "pending" || sub.status === "payment_pending") {
      const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
      // Playbook §11/§12: Se o período atual está pago e vigente (ex: pago com PIX e cartão agendado no gateway),
      // a situação comercial é ATIVA!
      if (periodEndMs && periodEndMs > nowMs) {
        return {
          key: "active",
          label: "Ativo",
          color: "#166534",
          bgColor: "#DCFCE7",
          dotColor: "#10B981",
        };
      }

      return {
        key: "past_due",
        label: "Pagamento pendente",
        color: "#D97706",
        bgColor: "#FEF3C7",
        dotColor: "#F59E0B",
      };
    }

    // Tradução garantida de todos os status para português
    const statusLabels: Record<string, string> = {
      active: "Ativo",
      trialing: "Em teste grátis",
      past_due: "Pagamento pendente",
      payment_pending: "Pagamento pendente",
      canceled: "Cancelada",
      incomplete: "Pendente",
      pending: "Pendente",
      suspended: "Suspensa",
      expired: "Expirada",
      trial_expired: "Teste expirado",
    };

    return {
      key: sub.status,
      label: statusLabels[sub.status] || "Ativo",
      color: "#64748B",
      bgColor: "#F1F5F9",
      dotColor: "#94A3B8",
    };
  }, [sub]);

  const isTrialActive = subscriptionStatus.key === "trialing";
  const isTrialExpired = subscriptionStatus.key === "trial_expired";
  const isCanceled = sub?.status === "canceled" || Boolean(sub?.canceled_at);

  // Se o usuário está em teste grátis mas antecipou o pagamento via PIX (período além do trial)
  const hasPaidInAdvance = useMemo(() => {
    if (isCanceled) return false;
    if (!sub?.trial_ends_at || !sub?.current_period_end) return false;
    const dTrial = parseDateSafe(sub.trial_ends_at);
    const dPeriod = parseDateSafe(sub.current_period_end);
    return Boolean(dTrial && dPeriod && dPeriod.isAfter(dTrial, "day"));
  }, [sub?.trial_ends_at, sub?.current_period_end, isCanceled]);

  // Verifica se o ciclo atual já está quitado e ainda não atingiu a janela de renovação (5 dias antes do vencimento)
  const isPeriodPaidAndNotDueYet = useMemo(() => {
    if (!sub || isCanceled) return false;
    // Se está em teste grátis e já antecipou além do trial:
    if (hasPaidInAdvance) return true;

    // Se estiver em trial normal: o período está coberto pelo trial se faltam mais de 5 dias
    if (isTrialActive && sub.trial_ends_at) {
      const dTrial = parseDateSafe(sub.trial_ends_at);
      if (dTrial) {
        const daysUntilTrialEnd = dTrial.diff(dayjs(), "day", true);
        if (daysUntilTrialEnd > 5) {
          return true;
        }
      }
    }

    // Se a assinatura for ativa (ou tiver current_period_end no futuro):
    if (sub.status === "active" && sub.current_period_end) {
      const dPeriod = parseDateSafe(sub.current_period_end);
      if (dPeriod) {
        const daysUntilDue = dPeriod.diff(dayjs(), "day", true);
        // Se ainda faltam mais de 5 dias para o vencimento, o ciclo atual está 100% quitado e a renovação ainda não abriu
        if (daysUntilDue > 5) {
          return true;
        }
      }
    }
    return false;
  }, [sub, hasPaidInAdvance, isTrialActive, isCanceled]);

  // Datas calculadas
  const trialEndDateFormatted = useMemo(() => {
    const d = parseDateSafe(sub?.trial_ends_at);
    return d ? d.format("DD/MM/YYYY") : null;
  }, [sub?.trial_ends_at]);

  const nextPaymentDateFormatted = useMemo(() => {
    if (isCanceled) {
      return "Nenhum (Cancelada)";
    }

    // 1. Se antecipou o pagamento além do trial (ex: pagou com PIX adiantado):
    // Playbook §4.3: Próximo período já está pago — a próxima COBRANÇA é no final do período pago
    if (hasPaidInAdvance && sub?.current_period_end) {
      const dPeriod = parseDateSafe(sub.current_period_end);
      if (dPeriod) return dPeriod.format("DD/MM/YYYY");
    }

    // 2. Se ainda está em teste grátis sem antecipação, o próximo pagamento é no término do teste
    if (isTrialActive && sub?.trial_ends_at) {
      const dTrial = parseDateSafe(sub.trial_ends_at);
      if (dTrial) return dTrial.format("DD/MM/YYYY");
    }

    // 3. Se a assinatura estiver incompleta ou pendente (primeiro pagamento devido agora)
    if (sub?.status === "incomplete" || sub?.status === "pending" || sub?.status === "past_due") {
      return "Hoje";
    }

    // 4. Assinatura ativa ou regular
    const dPeriod = parseDateSafe(sub?.current_period_end);
    if (dPeriod) return dPeriod.format("DD/MM/YYYY");

    const dTrial = parseDateSafe(sub?.trial_ends_at);
    if (dTrial) return dTrial.format("DD/MM/YYYY");

    return dayjs().add(1, "month").format("DD/MM/YYYY");
  }, [sub?.current_period_end, sub?.trial_ends_at, sub?.status, isTrialActive, hasPaidInAdvance, isCanceled]);

  const nextPaymentLongDate = useMemo(() => {
    if (isCanceled) {
      return "Assinatura cancelada";
    }

    // 1. Se antecipou o pagamento além do trial (ex: pagou com PIX adiantado):
    if (hasPaidInAdvance && sub?.current_period_end) {
      const dPeriod = parseDateSafe(sub.current_period_end);
      if (dPeriod) return dPeriod.locale("pt-br").format("D [de] MMMM [de] YYYY");
    }

    // 2. Se ainda está em teste grátis sem antecipação, o próximo pagamento é no término do teste
    if (isTrialActive && sub?.trial_ends_at) {
      const dTrial = parseDateSafe(sub.trial_ends_at);
      if (dTrial) return dTrial.locale("pt-br").format("D [de] MMMM [de] YYYY");
    }

    // 3. Se a assinatura estiver incompleta ou pendente
    if (sub?.status === "incomplete" || sub?.status === "pending" || sub?.status === "past_due") {
      return "Hoje (Aguardando pagamento)";
    }

    // 4. Assinatura ativa ou regular
    const dPeriod = parseDateSafe(sub?.current_period_end);
    if (dPeriod) return dPeriod.locale("pt-br").format("D [de] MMMM [de] YYYY");

    const dTrial = parseDateSafe(sub?.trial_ends_at);
    if (dTrial) return dTrial.locale("pt-br").format("D [de] MMMM [de] YYYY");

    return dayjs().add(1, "month").locale("pt-br").format("D [de] MMMM [de] YYYY");
  }, [sub?.current_period_end, sub?.trial_ends_at, sub?.status, isTrialActive, hasPaidInAdvance, isCanceled]);

  // Detalhes do pacote de WhatsApp ativo para discriminação no próximo pagamento
  const whatsappPackageDetails = useMemo(() => {
    const effectivePackageId = sub?.whatsapp_next_package_id || sub?.whatsapp_package_id;
    if (!effectivePackageId || sub?.whatsapp_package_status !== "active") {
      return null;
    }
    const map: Record<string, { name: string; priceCents: number; priceFormatted: string }> = {
      pkg_200: { name: "WhatsApp 200 mensagens", priceCents: 2490, priceFormatted: "R$ 24,90" },
      pkg_300: { name: "WhatsApp 300 mensagens", priceCents: 3490, priceFormatted: "R$ 34,90" },
      pkg_500: { name: "WhatsApp 500 mensagens", priceCents: 4990, priceFormatted: "R$ 49,90" },
      pkg_750: { name: "WhatsApp 750 mensagens", priceCents: 6990, priceFormatted: "R$ 69,90" },
      pkg_1000: { name: "WhatsApp 1.000 mensagens", priceCents: 9990, priceFormatted: "R$ 99,90" },
      pkg_2000: { name: "WhatsApp 2.000 mensagens", priceCents: 16990, priceFormatted: "R$ 169,90" },
    };
    return map[effectivePackageId] || { name: `WhatsApp (${effectivePackageId})`, priceCents: 0, priceFormatted: "" };
  }, [sub?.whatsapp_package_id, sub?.whatsapp_next_package_id, sub?.whatsapp_package_status]);

  const totalNextPaymentFormatted = useMemo(() => {
    const baseCents = 14990;
    const addonCents = whatsappPackageDetails ? whatsappPackageDetails.priceCents : 0;
    const total = (baseCents + addonCents) / 100;
    return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }, [whatsappPackageDetails]);

  const billingDay = useMemo(() => {
    if (sub?.billing_day && sub.billing_day >= 1 && sub.billing_day <= 31) {
      return String(sub.billing_day).padStart(2, "0");
    }
    if (hasPaidInAdvance && sub?.current_period_end) {
      const dPeriod = parseDateSafe(sub.current_period_end);
      if (dPeriod) return dPeriod.format("DD");
    }
    if (isTrialActive && sub?.trial_ends_at) {
      const dTrial = parseDateSafe(sub.trial_ends_at);
      if (dTrial) return dTrial.format("DD");
    }
    const dPeriod = parseDateSafe(sub?.current_period_end);
    if (dPeriod) return dPeriod.format("DD");

    const dTrial = parseDateSafe(sub?.trial_ends_at);
    if (dTrial) return dTrial.format("DD");

    return "17";
  }, [sub?.current_period_end, sub?.trial_ends_at, sub?.billing_day, isTrialActive, hasPaidInAdvance]);

  // Abertura do Modal
  const handleOpenModal = (step: "manage" | "change_payment" | "add_card") => {
    setModalStep(step);
    setModalEntryStep(step);
    setSelectedMethodOption(isPixMethod ? "pix" : "card");
    setCardFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (loadingSaveCard || loadingPixChange) return;
    setIsModalOpen(false);
    setOpenPixConfirmDialog(false);
    setCardFormError(null);
  };

  const handleModalBack = () => {
    if (modalStep === "add_card") {
      if (modalEntryStep === "add_card") {
        handleCloseModal();
      } else {
        setModalStep("change_payment");
      }
    } else if (modalStep === "change_payment") {
      if (modalEntryStep === "manage") {
        setModalStep("manage");
      } else {
        handleCloseModal();
      }
    } else if (modalStep === "pix_payment") {
      if (modalEntryStep === "manage") {
        setModalStep("manage");
      } else {
        handleCloseModal();
      }
    } else {
      handleCloseModal();
    }
  };

  const handleCopyPixCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    toast.success("Código PIX copiado com sucesso!");
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleGenerateOrShowPix = async () => {
    if (effectivePixData?.qrCode) {
      if (onOpenPixModal) {
        onOpenPixModal({
          qrCode: effectivePixData.qrCode,
          qrCodeUrl: effectivePixData.qrCodeUrl,
          expiresAt: effectivePixData.expiresAt,
          amount: effectivePixData.amount || 14990,
          chargeId: (effectivePixData as any).chargeId || (effectivePixData as any).charge_id,
          title: "Pagamento da assinatura do sistema Data Pet",
        });
        return;
      }
      setModalStep("pix_payment");
      setIsModalOpen(true);
      return;
    }

    if (isPeriodPaidAndNotDueYet && !isCanceled) {
      toast.info(`O período atual já está pago até ${nextPaymentDateFormatted}. A emissão de Pix para renovação estará disponível 5 dias antes do vencimento.`);
      return;
    }

    setLoadingGeneratePix(true);
    try {
      const cleanDoc = tenant?.document ? tenant.document.replace(/\D/g, "") : undefined;
      const data = await createCheckout("MONTHLY", "pix", undefined, cleanDoc);
      if ("pix_qr_code" in data && data.pix_qr_code) {
        const pixPayload = {
          qrCode: data.pix_qr_code,
          qrCodeUrl: data.pix_qr_code_url,
          expiresAt: data.expires_at,
          amount: data.amount || 14990,
          chargeId: (data as any).charge_id,
        };
        setLocalPixData(pixPayload);
        await onRefreshData();
        if (onOpenPixModal) {
          onOpenPixModal({
            ...pixPayload,
            title: "Pagamento da assinatura do sistema Data Pet",
          });
          return;
        }
        setModalStep("pix_payment");
        setIsModalOpen(true);
      } else {
        toast.error("Não foi possível gerar a cobrança PIX. Tente novamente.");
      }
    } catch (err: any) {
      console.error("Erro ao gerar PIX no Pagar.me:", err);
      const msg = err?.response?.data?.detail || "Erro ao gerar cobrança PIX no Pagar.me.";
      toast.error(msg);
    } finally {
      setLoadingGeneratePix(false);
    }
  };

  // Abertura automática disparada por banner ou ação externa (action=pix)
  const autoOpenPixTriggered = React.useRef(false);
  React.useEffect(() => {
    if (autoOpenPix && !autoOpenPixTriggered.current) {
      autoOpenPixTriggered.current = true;
      // Se já existir uma cobrança Pix pendente, abre o modal direto para exibição
      if (effectivePixData?.qrCode) {
        if (onOpenPixModal) {
          onOpenPixModal({
            qrCode: effectivePixData.qrCode,
            qrCodeUrl: effectivePixData.qrCodeUrl,
            expiresAt: effectivePixData.expiresAt,
            amount: effectivePixData.amount || 14990,
            chargeId: (effectivePixData as any).chargeId || (effectivePixData as any).charge_id,
            title: "Pagamento da assinatura do sistema Data Pet",
          });
          return;
        }
        setModalStep("pix_payment");
        setIsModalOpen(true);
      }
    }
  }, [autoOpenPix, effectivePixData, onOpenPixModal]);

  // Auto-polling para confirmação automática de Pix no modal aberto
  React.useEffect(() => {
    if (!isModalOpen || modalStep !== "pix_payment" || !effectivePixData) return;

    const chargeId = (effectivePixData as any)?.charge_id || (effectivePixData as any)?.id || (effectivePixData as any)?.pagarme_charge_id || (effectivePixData as any)?.chargeId;
    if (!chargeId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await getChargeStatus(chargeId);
        if (res.paid) {
          clearInterval(intervalId);
          setLocalPixData(null);
          toast.success("Pagamento Pix confirmado!");
          await onRefreshData();
          setSuccessMethod("PIX");
          setModalStep("success");
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isModalOpen, modalStep, effectivePixData, onRefreshData]);

  // Polling em segundo plano na tela de pagamentos para atualizar assim que qualquer Pix pendente for pago
  React.useEffect(() => {
    const pendingCharge = charges?.find((c) => c.status === "pending" && c.payment_method === "pix");
    const pendingChargeId =
      (effectivePixData as any)?.chargeId ||
      (effectivePixData as any)?.charge_id ||
      pendingCharge?.id;
    const hasPending = Boolean(pendingChargeId);

    if (!hasPending) return;

    const intervalId = setInterval(async () => {
      try {
        if (pendingChargeId) {
          const res = await getChargeStatus(pendingChargeId);
          if (res.paid) {
            setLocalPixData(null);
            toast.success("Pagamento PIX confirmado com sucesso!");
            await onRefreshData();
            return;
          }
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [effectivePixData, charges, onRefreshData]);

  const handleConfirmPixChange = async () => {
    setLoadingPixChange(true);
    try {
      await changeSubscriptionToPix();
      await onRefreshData();
      setOpenPixConfirmDialog(false);
      setSuccessMethod("PIX");
      setModalStep("success");
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Erro ao alterar para PIX. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoadingPixChange(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardFormError(null);

    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (cleanNumber.length < 13) {
      setCardFormError("Número de cartão inválido.");
      return;
    }

    const [expMonth, expYear] = cardExpiry.split("/");
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      setCardFormError("Validade inválida. Use o formato MM/AA.");
      return;
    }

    const cleanCvv = cardCvv.trim();
    if (cleanCvv.length < 3) {
      setCardFormError("Código CVV inválido.");
      return;
    }

    if (!cardHolder.trim()) {
      setCardFormError("Informe o nome impresso no cartão.");
      return;
    }

    const cleanCpf = cardCpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setCardFormError("Informe um CPF válido com 11 dígitos.");
      return;
    }

    setLoadingSaveCard(true);

    try {
      // 1. Tokenização no Pagar.me
      const resp = await fetch(
        `https://api.pagar.me/core/v5/tokens?appId=${import.meta.env.VITE_PAGARME_PUBLIC_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "card",
            card: {
              number: cleanNumber,
              holder_name: cardHolder.trim().toUpperCase(),
              exp_month: expMonth,
              exp_year: expYear,
              cvv: cleanCvv,
            },
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        setCardFormError(translatePagarmeError(err));
        setLoadingSaveCard(false);
        return;
      }

      const tokenData = await resp.json();
      const cardToken = tokenData.id;

      // Monta endereço de cobrança se houver dados no tenant
      const billingAddress = tenant?.cep
        ? {
            country: "BR",
            state: tenant.state || "",
            city: tenant.city || "",
            zip_code: (tenant.cep || "").replace(/\D/g, ""),
            line_1: `${tenant.street || ""}, ${tenant.number || ""}`,
            ...(tenant.complement ? { line_2: tenant.complement } : {}),
          }
        : undefined;

      // 2. Salva método de pagamento
      const newPaymentMethod = await addPaymentMethod(cardToken, billingAddress, cleanCpf);

      // 3. Define como principal se marcado ou se for o primeiro cartão
      // O back-end cuida automaticamente de:
      // - Se o trial expirou: cobra e ativa imediatamente hoje
      // - Se o trial está no futuro: agenda a assinatura para o fim do trial
      // - Se o período foi pago via PIX: agenda para o fim do período sem cobrar agora
      // - Se já tem assinatura criada: apenas atualiza o cartão sem duplicar cobrança
      const isFirstCard = !savedCards || savedCards.length === 0;
      if ((setAsDefault || isFirstCard) && newPaymentMethod?.id) {
        await setDefaultPaymentMethod(newPaymentMethod.id);
      }

      await onRefreshData();

      // Limpa formulário
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardHolder("");

      setSuccessMethod("Cartão de Crédito");
      setModalStep("success");
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.message || err;
      setCardFormError(translatePagarmeError(msg));
    } finally {
      setLoadingSaveCard(false);
    }
  };

  const handleFinishSuccess = async () => {
    handleCloseModal();
    await onRefreshData();
  };

  // Estado e handler do diálogo de reativação de assinatura com cartão salvo
  const [openReactivateDialog, setOpenReactivateDialog] = useState(false);
  const [loadingReactivate, setLoadingReactivate] = useState(false);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("action") === "reactivate" && isCanceled && hasCard) {
      setOpenReactivateDialog(true);
    }
  }, [isCanceled, hasCard]);

  const handleReactivate = async () => {
    setLoadingReactivate(true);
    try {
      await reactivateSubscription(defaultCard?.id);
      toast.success("Assinatura reativada com sucesso!");
      setOpenReactivateDialog(false);
      setIsModalOpen(false);
      await onRefreshData();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.message || "Erro ao reativar assinatura. Verifique seu cartão ou tente novamente.";
      toast.error(msg);
    } finally {
      setLoadingReactivate(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Cabeçalho da Página Principal */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: "#64748B",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "block",
            mb: 0.5,
          }}
        >
          Assinatura
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#0F172A",
            fontSize: { xs: "1.45rem", sm: "1.85rem" },
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          Dados da sua assinatura
        </Typography>
        <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.95rem" }}>
          Gerencie seu plano, forma de pagamento e veja as próximas cobranças.
        </Typography>
      </Box>

      {/* ALERTA DE COBRANÇA PIX PENDENTE COM POLLING ATIVO */}
      {Boolean(effectivePixData?.qrCode) && (
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: "16px",
            bgcolor: "rgba(245, 158, 11, 0.08)",
            border: "1.5px solid rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#D97706",
                boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.2)",
                animation: "pulseDot 1.6s infinite ease-in-out",
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#92400E">
                {sub?.whatsapp_package_status === "pending_payment"
                  ? "Pagamento PIX do Pacote WhatsApp pendente"
                  : "Cobrança PIX pendente de confirmação"}
              </Typography>
              <Typography variant="caption" color="#B45309" sx={{ display: "block", mt: 0.2 }}>
                Aguardando confirmação bancária • Verificando automaticamente a cada 4s
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="small"
            onClick={handleGenerateOrShowPix}
            startIcon={<PixIcon size={16} color="#FFFFFF" />}
            sx={{
              bgcolor: "#00B49D",
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              py: 0.9,
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              boxShadow: "none",
              "&:hover": { bgcolor: "#009682" },
            }}
          >
            Ver QR Code PIX
          </Button>
        </Box>
      )}

      {/* 3 CARDS HORIZONTAIS DA PÁGINA PRINCIPAL (Imagem 2) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* CARD 1: PLANO */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2.5,
            transition: "all 0.2s ease-in-out",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {/* Lado Esquerdo: Ícone + Título do Plano */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1.2, minWidth: 260 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                bgcolor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#313485",
                flexShrink: 0,
              }}
            >
              <Crown size={26} strokeWidth={2.2} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.6px",
                  display: "block",
                  textTransform: "uppercase",
                }}
              >
                Plano
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0F172A",
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  mt: 0.2,
                }}
              >
                Data Pet Pro
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748B", fontSize: "0.85rem", mt: 0.4 }}
              >
                Tenha acesso a todas as funcionalidades do sistema para gerenciar seu pet shop.
              </Typography>
            </Box>
          </Box>

          {/* Coluna do Meio: Datas e Status Dinâmico */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              borderLeft: { xs: "none", md: "1px solid #E2E8F0" },
              borderTop: { xs: "1px solid #E2E8F0", md: "none" },
              pl: { xs: 0, md: 3 },
              pt: { xs: 2, md: 0 },
              minWidth: 220,
            }}
          >
            {/* Período de teste */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Calendar size={16} color="#64748B" />
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                Período de teste
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isTrialExpired || isCanceled ? "#DC2626" : "#0F172A",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  ml: "auto",
                }}
              >
                {isTrialActive
                  ? `Até ${trialEndDateFormatted || nextPaymentDateFormatted}`
                  : isCanceled && sub?.canceled_at
                    ? `Cancelado em ${parseDateSafe(sub.canceled_at)?.format("DD/MM/YYYY") || "Cancelado"}`
                    : trialEndDateFormatted
                      ? `Encerrado em ${trialEndDateFormatted}`
                      : "Encerrado"}
              </Typography>
            </Box>

            {/* Próximo pagamento */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Clock size={16} color="#64748B" />
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                {isCanceled ? "Cobranças futuras" : hasPaidInAdvance && isTrialActive ? "Próxima cobrança" : "Próximo pagamento"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isCanceled ? "#DC2626" : hasPaidInAdvance && isTrialActive ? "#166534" : "#0F172A",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  ml: "auto",
                }}
              >
                {isCanceled ? "Nenhuma" : nextPaymentDateFormatted}
              </Typography>
            </Box>

            {/* Status Dinâmico */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: subscriptionStatus.dotColor,
                }}
              />
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                Status
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: subscriptionStatus.color,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  ml: "auto",
                }}
              >
                {subscriptionStatus.label}
              </Typography>
            </Box>
          </Box>

          {/* Lado Direito: Botões de Ação */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
            {isCanceled && hasCard && (
              <Button
                variant="contained"
                onClick={() => setOpenReactivateDialog(true)}
                startIcon={<RotateCw size={16} />}
                sx={{
                  bgcolor: "#2E308E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.75,
                  py: 1.1,
                  fontSize: "0.9rem",
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    bgcolor: "#24276A",
                    boxShadow: "0 2px 8px rgba(46, 48, 142, 0.25)",
                  },
                }}
              >
                Reativar assinatura
              </Button>
            )}
            <Button
              variant={isCanceled && hasCard ? "outlined" : "contained"}
              onClick={() => handleOpenModal("manage")}
              endIcon={<ArrowRight size={16} />}
              sx={{
                bgcolor: isCanceled && hasCard ? "#FFFFFF" : "#2E308E",
                borderColor: isCanceled && hasCard ? "#CBD5E1" : "transparent",
                color: isCanceled && hasCard ? "#334155" : "#FFFFFF",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                px: 2.75,
                py: 1.1,
                fontSize: "0.9rem",
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: isCanceled && hasCard ? "#F8FAFC" : "#24276A",
                  borderColor: isCanceled && hasCard ? "#94A3B8" : "transparent",
                  boxShadow: isCanceled && hasCard ? "none" : "0 2px 8px rgba(46, 48, 142, 0.25)",
                },
              }}
            >
              Gerenciar assinatura
            </Button>
          </Box>
        </Box>

        {/* CARD 2: FORMA DE PAGAMENTO */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2.5,
            transition: "all 0.2s ease-in-out",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {/* Lado Esquerdo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                bgcolor: isPixMethod
                  ? "#ECFDF5"
                  : hasCard
                  ? "#EEF2FF"
                  : "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isPixMethod
                  ? "#00B49D"
                  : hasCard
                  ? "#313485"
                  : "#D97706",
                flexShrink: 0,
              }}
            >
              {isPixMethod ? (
                <PixIcon size={26} color="#00B49D" />
              ) : (
                <CreditCard size={26} strokeWidth={2.2} />
              )}
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.6px",
                  display: "block",
                  textTransform: "uppercase",
                }}
              >
                Forma de Pagamento
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0F172A",
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  mt: 0.2,
                }}
              >
                {isPixMethod
                  ? "PIX"
                  : hasCard
                  ? "Cartão de Crédito"
                  : "Nenhum cartão cadastrado"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748B", fontSize: "0.85rem", mt: 0.4 }}
              >
                {isPixMethod
                  ? hasPaidInAdvance || (subscriptionStatus.key === "active" && sub?.current_period_end)
                    ? `Período atual garantido até ${nextPaymentDateFormatted}. Sua mensalidade está quitada via PIX.`
                    : "Gere um QR Code e pague quando quiser."
                  : defaultCard
                  ? hasPaidInAdvance || (subscriptionStatus.key === "active" && sub?.current_period_end)
                    ? `Período atual garantido até ${nextPaymentDateFormatted}. A próxima renovação será cobrada automaticamente no cartão final ${defaultCard.last4} (${defaultCard.brand?.toUpperCase() || "CRÉDITO"}).`
                    : `Cobrança automática no cartão final ${defaultCard.last4} (${defaultCard.brand?.toUpperCase() || "CRÉDITO"}).`
                  : isTrialExpired
                  ? "Cadastre um cartão para reativar seu acesso ao sistema."
                  : isTrialActive
                  ? "Nenhum cartão vinculado. Cadastre um cartão para evitar o bloqueio após o teste."
                  : "Nenhuma forma de pagamento vinculada. Adicione um cartão para ativar a renovação."}
              </Typography>
            </Box>
          </Box>

          {/* Lado Direito: Dois botões (Alterar forma de pagamento e Adicionar cartão) */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
            }}
          >
            <Button
              variant="outlined"
              onClick={() => handleOpenModal("change_payment")}
              startIcon={<Edit2 size={16} />}
              sx={{
                borderColor: "#E2E8F0",
                color: "#334155",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "10px",
                px: 2,
                py: 1,
                fontSize: "0.88rem",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              Alterar forma de pagamento
            </Button>

            {isPixMethod ? (
              effectivePixData?.qrCode ? (
                <Button
                  variant="contained"
                  onClick={handleGenerateOrShowPix}
                  disabled={loadingGeneratePix}
                  startIcon={
                    loadingGeneratePix ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PixIcon size={16} color="#FFFFFF" />
                    )
                  }
                  sx={{
                    bgcolor: "#00B49D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 2.2,
                    py: 1,
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#009682",
                      boxShadow: "0 2px 8px rgba(0, 180, 157, 0.25)",
                    },
                  }}
                >
                  Ver QR Code PIX
                </Button>
              ) : isPeriodPaidAndNotDueYet ? (
                <Tooltip
                  title={`Sua assinatura está paga até ${nextPaymentDateFormatted}. A emissão de Pix para o próximo ciclo estará disponível 5 dias antes do vencimento.`}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      bgcolor: "#ECFDF5",
                      border: "1px solid #A7F3D0",
                      color: "#065F46",
                      px: 2,
                      py: 0.9,
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      userSelect: "none",
                      cursor: "default",
                      boxShadow: "0 1px 2px rgba(16, 185, 129, 0.05)",
                    }}
                  >
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Próximo ciclo já pago</span>
                  </Box>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleGenerateOrShowPix}
                  disabled={loadingGeneratePix}
                  startIcon={
                    loadingGeneratePix ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PixIcon size={16} color="#FFFFFF" />
                    )
                  }
                  sx={{
                    bgcolor: isCanceled ? "#313485" : "#00B49D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 2.2,
                    py: 1,
                    fontSize: "0.88rem",
                    whiteSpace: "nowrap",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: isCanceled ? "#24276A" : "#009682",
                      boxShadow: "0 2px 8px rgba(0, 180, 157, 0.25)",
                    },
                  }}
                >
                  {isCanceled ? "Reativar com PIX" : "Gerar PIX"}
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={() => handleOpenModal("add_card")}
                startIcon={<Plus size={16} />}
                sx={{
                  bgcolor: "#2E308E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "10px",
                  px: 2.2,
                  py: 1,
                  fontSize: "0.88rem",
                  whiteSpace: "nowrap",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#24276A",
                    boxShadow: "0 2px 8px rgba(46, 48, 142, 0.25)",
                  },
                }}
              >
                Adicionar cartão
              </Button>
            )}
          </Box>
        </Box>

        {/* CARD 3: FATURA E PRÓXIMO PAGAMENTO */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2.5,
            transition: "all 0.2s ease-in-out",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          {/* Lado Esquerdo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                bgcolor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#313485",
                flexShrink: 0,
              }}
            >
              <Calendar size={26} strokeWidth={2.2} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  letterSpacing: "0.6px",
                  display: "block",
                  textTransform: "uppercase",
                }}
              >
                {isCanceled ? "Fatura e Status" : "Fatura e Próximo Pagamento"}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isCanceled ? "#DC2626" : "#0F172A",
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  mt: 0.2,
                }}
              >
                {nextPaymentLongDate}
              </Typography>
              {whatsappPackageDetails ? (
                <Box sx={{ mt: 0.8 }}>
                  <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap", mb: 0.4 }}>
                    <Box sx={{ bgcolor: "#F1F5F9", px: 1, py: 0.3, borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>
                      Plano Base: R$ 149,90
                    </Box>
                    <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700 }}>+</Typography>
                    <Box sx={{ bgcolor: "#EFF6FF", px: 1, py: 0.3, borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, color: "#1D4ED8" }}>
                      {whatsappPackageDetails.name}: {whatsappPackageDetails.priceFormatted}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 800, fontSize: "0.92rem" }}>
                    Total previsto: {totalNextPaymentFormatted} / mês
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: "#64748B", fontSize: "0.85rem", mt: 0.4 }}
                >
                  Valor mensal do plano: R$ 149,90
                </Typography>
              )}
            </Box>
          </Box>

          {/* Lado Direito: Botão Ver faturas */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={onToggleInvoices}
              startIcon={<FileText size={16} />}
              sx={{
                borderColor: "#E2E8F0",
                color: "#334155",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "10px",
                px: 2.2,
                py: 1,
                fontSize: "0.88rem",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              Ver faturas
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* MODAL PRINCIPAL: GERENCIA SUB-FLUXOS (IMAGEM 1: TELAS 1 A 6)               */}
      {/* ========================================================================= */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: { xs: 2.5, sm: 3.5 },
            position: "relative",
            maxHeight: "90vh",
            overflowY: "auto",
          },
        }}
      >
        {/* Top Header do Modal: Botão Voltar (quando aplicável) e Botão Fechar (✕) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          {/* Botão Voltar */}
          {modalStep !== "success" && (
            <Button
              onClick={handleModalBack}
              startIcon={<ArrowLeft size={16} />}
              sx={{
                color: "#64748B",
                fontWeight: 700,
                textTransform: "none",
                p: 0,
                minWidth: 0,
                fontSize: "0.85rem",
                "&:hover": { bgcolor: "transparent", color: "#2E308E" },
              }}
            >
              Voltar
            </Button>
          )}

          {modalStep === "success" && <Box />}

          {/* Botão Fechar */}
          <IconButton
            onClick={handleCloseModal}
            size="small"
            sx={{
              color: "#64748B",
              ml: "auto",
              "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* ----------------------------------------------------------------- */}
        {/* TELA 1 DO MODAL: GERENCIAR ASSINATURA                              */}
        {/* ----------------------------------------------------------------- */}
        {modalStep === "manage" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Gerenciar assinatura
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Aqui você pode acompanhar o status da sua assinatura, ver detalhes do plano e gerenciar sua forma de pagamento.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Detalhes do Plano */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2.5 }}>
                  {/* Esquerda: Nome e valor */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "#EEF2FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#313485",
                        flexShrink: 0,
                      }}
                    >
                      <Crown size={22} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}
                      >
                        Plano
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                          Data Pet Pro
                        </Typography>
                        {/* Badge dinâmico de status */}
                        <Box
                          sx={{
                            bgcolor: subscriptionStatus.bgColor,
                            color: subscriptionStatus.color,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            px: 1,
                            py: 0.2,
                            borderRadius: "12px",
                          }}
                        >
                          {subscriptionStatus.label}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "0.78rem", mt: 1.5, display: "block" }}
                      >
                        Valor mensal regular
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                        R$ 149,90/mês
                      </Typography>
                    </Box>
                  </Box>

                  {/* Direita: Datas */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, minWidth: 180 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Calendar size={15} color="#64748B" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                          Período de teste
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isTrialExpired ? "#DC2626" : "#0F172A",
                            fontSize: "0.82rem",
                          }}
                        >
                          {isTrialActive
                            ? `Até ${trialEndDateFormatted || nextPaymentDateFormatted}`
                            : trialEndDateFormatted
                              ? `Encerrado em ${trialEndDateFormatted}`
                              : "Encerrado"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Calendar size={15} color="#64748B" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                          Próximo pagamento
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem" }}>
                          {nextPaymentDateFormatted}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Clock size={15} color="#64748B" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                          Renovação
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem" }}>
                          Todo dia {billingDay} do mês
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Sub-card: Forma de pagamento */}
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isPixMethod
                        ? "#ECFDF5"
                        : hasCard
                        ? "#EEF2FF"
                        : "#FEF3C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isPixMethod
                        ? "#00B49D"
                        : hasCard
                        ? "#313485"
                        : "#D97706",
                      flexShrink: 0,
                    }}
                  >
                    {isPixMethod ? (
                      <PixIcon size={22} color="#00B49D" />
                    ) : (
                      <CreditCard size={22} />
                    )}
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}
                    >
                      Forma de pagamento
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      {isPixMethod
                        ? "PIX"
                        : hasCard
                        ? "Cartão de crédito"
                        : "Nenhum cartão cadastrado"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                      {isPixMethod
                        ? "Pagamento manual via QR Code"
                        : defaultCard
                        ? `•••• ${defaultCard.last4} - ${defaultCard.brand?.toUpperCase() || "CRÉDITO"}`
                        : "Nenhum cartão foi adicionado à sua conta ainda."}
                    </Typography>
                  </Box>
                </Box>

                {hasCard || isPixMethod ? (
                  <Button
                    onClick={() => setModalStep("change_payment")}
                    sx={{
                      color: "#2E308E",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "0.88rem",
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Alterar
                  </Button>
                ) : (
                  <Button
                    onClick={() => setModalStep("add_card")}
                    startIcon={<Plus size={14} />}
                    sx={{
                      bgcolor: "#EEF2FF",
                      color: "#2E308E",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "0.82rem",
                      borderRadius: "8px",
                      px: 1.5,
                      "&:hover": { bgcolor: "#E0E7FF" },
                    }}
                  >
                    Cadastrar
                  </Button>
                )}
              </Box>

              {/* Se for PIX, mostra opção de ver QR Code ou status de ciclo pago */}
              {isPixMethod && (
                effectivePixData?.qrCode ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGenerateOrShowPix}
                    disabled={loadingGeneratePix}
                    startIcon={
                      loadingGeneratePix ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PixIcon size={18} color="#FFFFFF" />
                      )
                    }
                    sx={{
                      bgcolor: "#00B49D",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.1,
                      fontSize: "0.88rem",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#009682" },
                    }}
                  >
                    Ver código e QR Code PIX
                  </Button>
                ) : isPeriodPaidAndNotDueYet ? (
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: "12px",
                      bgcolor: "#ECFDF5",
                      border: "1px solid #A7F3D0",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                    }}
                  >
                    <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: "#065F46", fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.35 }}>
                      Próximo ciclo já pago. O Pix para renovação estará disponível 5 dias antes do vencimento.
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGenerateOrShowPix}
                    disabled={loadingGeneratePix}
                    startIcon={
                      loadingGeneratePix ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PixIcon size={18} color="#FFFFFF" />
                      )
                    }
                    sx={{
                      bgcolor: "#00B49D",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.1,
                      fontSize: "0.88rem",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#009682" },
                    }}
                  >
                    Gerar cobrança PIX
                  </Button>
                )
              )}

              {isCanceled ? (
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "14px",
                    bgcolor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <ShieldAlert size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#991B1B" }}>
                        Assinatura Cancelada
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#B91C1C", fontSize: "0.82rem", lineHeight: 1.4, display: "block", mt: 0.3 }}>
                        {hasCard
                          ? `Sua assinatura está inativa. Você pode reativá-la agora mesmo utilizando seu cartão cadastrado final ${defaultCard?.last4} para restabelecer o acesso imediatamente.`
                          : "Sua assinatura está inativa. Adicione uma forma de pagamento para reativar seu acesso."}
                      </Typography>
                    </Box>
                  </Box>

                  {hasCard ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        handleCloseModal();
                        setOpenReactivateDialog(true);
                      }}
                      startIcon={<RotateCw size={16} />}
                      sx={{
                        bgcolor: "#2E308E",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "10px",
                        py: 1.2,
                        fontSize: "0.88rem",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#24276A" },
                      }}
                    >
                      Reativar assinatura com cartão final {defaultCard?.last4}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setModalStep("add_card")}
                      startIcon={<Plus size={16} />}
                      sx={{
                        bgcolor: "#2E308E",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "10px",
                        py: 1.2,
                        fontSize: "0.88rem",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#24276A" },
                      }}
                    >
                      Cadastrar cartão para reativar
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  {/* Alerta de renovação */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      bgcolor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.4 }}>
                      {hasCard
                        ? `Sua assinatura é renovada automaticamente todo dia ${billingDay}. Você pode alterar sua forma de pagamento a qualquer momento.`
                        : isPixMethod
                        ? `O pagamento do seu plano é realizado mensalmente via PIX até o dia ${billingDay}.`
                        : `Para garantir a continuidade dos serviços, adicione um cartão de crédito para a cobrança no dia ${billingDay}.`}
                    </Typography>
                  </Box>

                  {/* Botão Cancelar Assinatura */}
                  <Box sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        handleCloseModal();
                        onOpenCancelModal();
                      }}
                      startIcon={<Trash2 size={16} />}
                      sx={{
                        borderColor: "#FECACA",
                        bgcolor: "#FFFFFF",
                        color: "#DC2626",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "10px",
                        py: 1.2,
                        fontSize: "0.88rem",
                        "&:hover": {
                          borderColor: "#F87171",
                          bgcolor: "#FEF2F2",
                        },
                      }}
                    >
                      Cancelar assinatura
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TELA 2 DO MODAL: ALTERAR FORMA DE PAGAMENTO                        */}
        {/* ----------------------------------------------------------------- */}
        {modalStep === "change_payment" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Alterar forma de pagamento
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Escolha como deseja pagar sua assinatura.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Opção 1: Cartão de crédito */}
              <Box
                onClick={() => setSelectedMethodOption("card")}
                sx={{
                  p: 2.2,
                  borderRadius: "14px",
                  border: selectedMethodOption === "card" ? "1.5px solid #2E308E" : "1px solid #E2E8F0",
                  bgcolor: selectedMethodOption === "card" ? "#F8FAFF" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  "&:hover": {
                    borderColor: "#2E308E",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: selectedMethodOption === "card" ? "6px solid #2E308E" : "2px solid #CBD5E1",
                      bgcolor: "#FFFFFF",
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: "#EEF2FF",
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                      Cartão de crédito
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                      {hasCard
                        ? `Usar cartão final ${defaultCard?.last4} ou cadastrar um novo.`
                        : "Cadastre um cartão para cobrança automática."}
                    </Typography>
                  </Box>
                </Box>
                <ChevronRight size={18} color="#94A3B8" />
              </Box>

              {/* Se Cartão selecionado e possui cartões salvos: Seleção de Cartão Salvo */}
              {selectedMethodOption === "card" && savedCards && savedCards.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "#475569",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Selecione o cartão para a assinatura:
                  </Typography>

                  {savedCards.map((card) => {
                    const isSelected = selectedCardId === card.id;
                    return (
                      <Box
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: "10px",
                          border: isSelected ? "1.5px solid #2E308E" : "1px solid #E2E8F0",
                          bgcolor: isSelected ? "#F8FAFF" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          "&:hover": { borderColor: "#2E308E" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: isSelected ? "5px solid #2E308E" : "2px solid #CBD5E1",
                              bgcolor: "#FFFFFF",
                              flexShrink: 0,
                            }}
                          />
                          <CreditCard size={18} color="#475569" />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.85rem" }}>
                            {card.brand ? card.brand.toUpperCase() : "Cartão"} final {card.last4}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.78rem" }}>
                            ({card.exp_month.toString().padStart(2, "0")}/{card.exp_year.toString().slice(-2)})
                          </Typography>
                          {card.is_default && (
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.2,
                                borderRadius: "6px",
                                bgcolor: "#DCFCE7",
                                color: "#166534",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              Padrão
                            </Box>
                          )}
                        </Box>
                        {isSelected && <Check size={16} color="#2E308E" />}
                      </Box>
                    );
                  })}

                  {/* Opção: Cadastrar um novo cartão */}
                  <Box
                    onClick={() => setSelectedCardId("new")}
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      border: selectedCardId === "new" ? "1.5px solid #2E308E" : "1px dashed #CBD5E1",
                      bgcolor: selectedCardId === "new" ? "#F8FAFF" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "#2E308E" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: selectedCardId === "new" ? "5px solid #2E308E" : "2px solid #CBD5E1",
                        bgcolor: "#FFFFFF",
                        flexShrink: 0,
                      }}
                    />
                    <Plus size={18} color="#2E308E" />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#2E308E", fontSize: "0.85rem" }}>
                      Cadastrar um novo cartão
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Opção 2: PIX */}
              <Box
                onClick={() => setSelectedMethodOption("pix")}
                sx={{
                  p: 2.2,
                  borderRadius: "14px",
                  border: selectedMethodOption === "pix" ? "1.5px solid #2E308E" : "1px solid #E2E8F0",
                  bgcolor: selectedMethodOption === "pix" ? "#F8FAFF" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  "&:hover": {
                    borderColor: "#2E308E",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: selectedMethodOption === "pix" ? "6px solid #2E308E" : "2px solid #CBD5E1",
                      bgcolor: "#FFFFFF",
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: "#ECFDF5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PixIcon size={24} color="#00B49D" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                      PIX
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                      Gere um QR Code e pague quando quiser.
                    </Typography>
                  </Box>
                </Box>
                <ChevronRight size={18} color="#94A3B8" />
              </Box>

              {/* Alerta de data de vencimento */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.4 }}>
                  A troca da forma de pagamento não altera sua data de vencimento. Seu próximo pagamento continua sendo no dia {nextPaymentDateFormatted}.
                </Typography>
              </Box>

              {/* Botão Continuar */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                <Button
                  variant="contained"
                  disabled={loadingSwitchCard}
                  endIcon={loadingSwitchCard ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
                  onClick={async () => {
                    if (selectedMethodOption === "pix") {
                      setOpenPixConfirmDialog(true);
                      return;
                    }

                    // Se selecionou cartão:
                    const hasSavedCards = Boolean(savedCards && savedCards.length > 0);
                    if (!hasSavedCards || selectedCardId === "new") {
                      setModalStep("add_card");
                      return;
                    }

                    // Usar cartão já salvo existente
                    try {
                      setLoadingSwitchCard(true);
                      await setDefaultPaymentMethod(selectedCardId);
                      await onRefreshData();
                      setSuccessMethod("Cartão de Crédito");
                      setModalStep("success");
                    } catch (err: any) {
                      console.error("Erro ao configurar cartão:", err);
                      const msg = err?.response?.data?.detail || "Erro ao configurar cartão. Tente novamente.";
                      toast.error(msg);
                    } finally {
                      setLoadingSwitchCard(false);
                    }
                  }}
                  sx={{
                    bgcolor: "#2E308E",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 3.5,
                    py: 1.2,
                    fontSize: "0.9rem",
                    "&:hover": { bgcolor: "#24276A" },
                  }}
                >
                  {selectedMethodOption === "card" && savedCards && savedCards.length > 0 && selectedCardId !== "new"
                    ? "Confirmar e usar este cartão"
                    : "Continuar"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TELA 3 DO MODAL: ADICIONAR CARTÃO DE CRÉDITO                      */}
        {/* ----------------------------------------------------------------- */}
        {modalStep === "add_card" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Adicionar cartão de crédito
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Cadastre um cartão para ser usado nos próximos pagamentos da sua assinatura.
            </Typography>

            {cardFormError && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 2.5,
                  borderRadius: "10px",
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#DC2626",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {cardFormError}
              </Box>
            )}

            <Box component="form" onSubmit={handleSaveCard} sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
              {/* Número do cartão */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.75, display: "block" }}>
                  Número do cartão
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  slotProps={{
                    input: {
                      endAdornment: <CreditCard size={18} color="#94A3B8" />,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: "#FFFFFF",
                      fontSize: "0.9rem",
                    },
                  }}
                />
              </Box>

              {/* Grid Validade e CVV */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.75, display: "block" }}>
                    Validade
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        bgcolor: "#FFFFFF",
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.75, display: "block" }}>
                    CVV
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <Tooltip title="Código de segurança de 3 ou 4 dígitos no verso do cartão">
                            <HelpCircle size={16} color="#94A3B8" style={{ cursor: "pointer" }} />
                          </Tooltip>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        bgcolor: "#FFFFFF",
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Nome no cartão */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.75, display: "block" }}>
                  Nome no cartão
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Como está no cartão"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: "#FFFFFF",
                      fontSize: "0.9rem",
                    },
                  }}
                />
              </Box>

              {/* CPF do titular */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.75, display: "block" }}>
                  CPF do titular
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="000.000.000-00"
                  value={cardCpf}
                  onChange={(e) => setCardCpf(formatCpf(e.target.value))}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: "#FFFFFF",
                      fontSize: "0.9rem",
                    },
                  }}
                />
              </Box>

              {/* Checkbox Definir como principal */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    sx={{
                      color: "#CBD5E1",
                      "&.Mui-checked": { color: "#2E308E" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600, fontSize: "0.85rem" }}>
                    Definir como forma de pagamento principal
                  </Typography>
                }
              />

              {/* Botões Cancelar e Salvar */}
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleModalBack}
                  disabled={loadingSaveCard}
                  sx={{
                    borderColor: "#E2E8F0",
                    color: "#334155",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    py: 1.2,
                    "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loadingSaveCard}
                  sx={{
                    bgcolor: "#2E308E",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    py: 1.2,
                    "&:hover": { bgcolor: "#24276A" },
                  }}
                >
                  {loadingSaveCard ? <CircularProgress size={20} color="inherit" /> : "Salvar cartão"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TELA 4 DO MODAL: PAGAR COM PIX / QR CODE                           */}
        {/* ----------------------------------------------------------------- */}
        {modalStep === "pix_payment" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Pagar com PIX
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Pague via QR Code ou copie o código Pix gerado no Pagar.me. O pagamento será confirmado automaticamente.
            </Typography>

            {loadingGeneratePix ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <CircularProgress size={36} sx={{ color: "#00B49D", mb: 2 }} />
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  Gerando cobrança PIX no Pagar.me...
                </Typography>
              </Box>
            ) : !effectivePixData?.qrCode ? (
              <Box
                sx={{
                  p: 4,
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                <PixIcon size={44} color="#00B49D" style={{ marginBottom: 12 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 1 }}>
                  Nenhuma cobrança PIX ativa
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", mb: 3, maxWidth: 380, mx: "auto" }}>
                  Gere uma nova cobrança oficial via Pagar.me para obter o QR Code e código Copia e Cola.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerateOrShowPix}
                  startIcon={<PixIcon size={18} color="#FFFFFF" />}
                  sx={{
                    bgcolor: "#00B49D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "10px",
                    px: 3,
                    py: 1.2,
                    "&:hover": { bgcolor: "#009682" },
                  }}
                >
                  Gerar cobrança PIX
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                {/* Linha QR Code + Dados */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      display: "inline-flex",
                    }}
                  >
                    <QRCodeSVG
                      value={effectivePixData.qrCode}
                      size={120}
                    />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                      Valor
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", mb: 1 }}>
                      {effectivePixData.amount
                        ? `R$ ${(effectivePixData.amount / 100).toFixed(2).replace(".", ",")}`
                        : "R$ 149,90"}
                    </Typography>

                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                      Vencimento do PIX
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                        {effectivePixData.expiresAt
                          ? dayjs(effectivePixData.expiresAt).format("DD/MM/YYYY [às] HH:mm")
                          : dayjs().add(3, "day").format("DD/MM/YYYY [às] 23:59")}
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "#ECFDF5",
                          color: "#047857",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          px: 1,
                          py: 0.2,
                          borderRadius: "10px",
                        }}
                      >
                        Pagamento Único
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Campo Código PIX */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", mb: 0.5, display: "block" }}>
                    Código PIX Copia e Cola
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#F8FAFC",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#475569",
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mr: 1,
                      }}
                    >
                      {effectivePixData.qrCode}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyPixCode(effectivePixData.qrCode)}
                      sx={{ color: "#00B49D" }}
                    >
                      {copiedPix ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Alerta */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                  }}
                >
                  <Info size={18} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.4 }}>
                    Após o pagamento no seu app bancário, o Pagar.me confirmará a transação automaticamente e o sistema será liberado.
                  </Typography>
                </Box>

                {/* Botões */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCopyPixCode(effectivePixData.qrCode)}
                    startIcon={copiedPix ? <Check size={16} /> : <Copy size={16} />}
                    sx={{
                      bgcolor: "#00B49D",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: "10px",
                      py: 1.3,
                      fontSize: "0.92rem",
                      "&:hover": { bgcolor: "#009682" },
                    }}
                  >
                    {copiedPix ? "Código PIX copiado!" : "Copiar código PIX"}
                  </Button>


                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleModalBack}
                    sx={{
                      color: "#334155",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "0.88rem",
                    }}
                  >
                    Voltar
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TELA 6 DO MODAL: SUCESSO                                          */}
        {/* ----------------------------------------------------------------- */}
        {modalStep === "success" && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                bgcolor: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
              }}
            >
              <CheckCircle2 size={40} color="#16A34A" strokeWidth={2.5} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Forma de pagamento atualizada!
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Sua assinatura agora está configurada para pagamento via {successMethod}.
            </Typography>

            {/* Card Resumo */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mb: 3,
                textAlign: "left",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Item 1: Plano */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    bgcolor: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#313485",
                  }}
                >
                  <Layers size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>
                    Plano
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    Data Pet Pro
                  </Typography>
                </Box>
              </Box>

              {/* Item 2: Próximo pagamento */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    bgcolor: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#313485",
                  }}
                >
                  <Calendar size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>
                    Próximo pagamento
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    {nextPaymentDateFormatted}
                  </Typography>
                </Box>
              </Box>

              {/* Item 3: Forma de pagamento */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    bgcolor: successMethod === "PIX" ? "#ECFDF5" : "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: successMethod === "PIX" ? "#00B49D" : "#313485",
                  }}
                >
                  {successMethod === "PIX" ? (
                    <PixIcon size={20} color="#00B49D" />
                  ) : (
                    <CreditCard size={20} />
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>
                    Forma de pagamento
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    {successMethod}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Botão Voltar para a assinatura */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleFinishSuccess}
              sx={{
                bgcolor: "#2E308E",
                color: "#FFFFFF",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                py: 1.3,
                fontSize: "0.92rem",
                "&:hover": { bgcolor: "#24276A" },
              }}
            >
              Voltar para a assinatura
            </Button>
          </Box>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG DE CONFIRMAÇÃO PARA TROCA PARA PIX (TELA 5 DA IMAGEM 1)           */}
      {/* ========================================================================= */}
      <Dialog
        open={openPixConfirmDialog}
        onClose={() => !loadingPixChange && setOpenPixConfirmDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: { xs: 2.5, sm: 3.5 },
            maxWidth: 440,
            width: "100%",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <IconButton
            onClick={() => setOpenPixConfirmDialog(false)}
            disabled={loadingPixChange}
            size="small"
            sx={{ position: "absolute", right: -8, top: -8, color: "#64748B" }}
          >
            <X size={20} />
          </IconButton>

          {/* Ícone de sincronização circular */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#313485",
              mx: "auto",
              mb: 2,
            }}
          >
            <RefreshCw size={26} />
          </Box>

          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "#0F172A", textAlign: "center", mb: 1 }}
          >
            Confirmar troca de pagamento
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "#64748B", textAlign: "center", fontSize: "0.85rem", lineHeight: 1.45, mb: 2.5 }}
          >
            Você está prestes a alterar a forma de pagamento da sua assinatura para PIX. Sua assinatura continuará ativa e o próximo vencimento será em {nextPaymentDateFormatted}.
          </Typography>

          {/* Box Importante */}
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Info size={16} color="#313485" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.82rem" }}>
                Importante
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2.5, m: 0, color: "#64748B", fontSize: "0.8rem", lineHeight: 1.5 }}>
              <li>A troca não altera sua data de vencimento.</li>
              <li>O pagamento será feito via PIX.</li>
              <li>Você receberá o código e o QR Code após a confirmação.</li>
            </Box>
          </Box>

          {/* Botões */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenPixConfirmDialog(false)}
              disabled={loadingPixChange}
              sx={{
                borderColor: "#E2E8F0",
                color: "#334155",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                py: 1.1,
                "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleConfirmPixChange}
              disabled={loadingPixChange}
              sx={{
                bgcolor: "#2E308E",
                color: "#FFFFFF",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                py: 1.1,
                "&:hover": { bgcolor: "#24276A" },
              }}
            >
              {loadingPixChange ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE REATIVAÇÃO */}
      <Dialog
        open={openReactivateDialog}
        onClose={() => !loadingReactivate && setOpenReactivateDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "18px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", pb: 1, display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2E308E",
            }}
          >
            <RotateCw size={20} />
          </Box>
          Reativar Assinatura
        </DialogTitle>
        <DialogContent sx={{ pb: 1.5 }}>
          <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
            Você está prestes a reativar sua assinatura do <strong>Data Pet Pro</strong>.
          </Typography>

          <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.2 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>Plano</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>Data Pet Pro</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.2 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>Valor mensal</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>R$ 149,90 / mês</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.82rem" }}>Forma de cobrança</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#2E308E" }}>
                Cartão final {defaultCard?.last4} ({defaultCard?.brand?.toUpperCase() || "CRÉDITO"})
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ color: "#64748B", display: "block", lineHeight: 1.45 }}>
            A cobrança do primeiro ciclo será processada imediatamente no seu cartão salvo e todos os recursos do sistema serão restabelecidos agora mesmo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleReactivate}
            disabled={loadingReactivate}
            startIcon={loadingReactivate ? <CircularProgress size={16} color="inherit" /> : <RotateCw size={16} />}
            sx={{
              bgcolor: "#2E308E",
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "10px",
              py: 1.2,
              fontSize: "0.9rem",
              boxShadow: "none",
              "&:hover": { bgcolor: "#24276A" },
            }}
          >
            {loadingReactivate ? "Reativando assinatura..." : "Confirmar e Reativar Agora"}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setOpenReactivateDialog(false)}
            disabled={loadingReactivate}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Voltar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;
