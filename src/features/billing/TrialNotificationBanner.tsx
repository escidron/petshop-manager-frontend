import { useState, useMemo } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  X,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PixIcon from "../../components/PixIcon";

export default function TrialNotificationBanner() {
  const {
    tenant,
    isSubscriptionActive,
    isSubscriptionInGracePeriod,
    gracePeriodDaysLeft,
  } = useAuth();
  const navigate = useNavigate();

  const sub = tenant?.subscription;

  // Determina o estágio e configuração do banner unificado
  const bannerState = useMemo(() => {
    // 1. Não exibe se tenant tiver acesso livre ou não tiver assinatura
    if (tenant?.feature_flags?.free_access || !sub) return null;

    const now = new Date();
    const nowMs = now.getTime();
    const isPix = sub.payment_method === "pix";
    const status = sub.status;

    // 2. Playbook §9 & §16: Se o período atual (ou antecipado) já está pago no futuro:
    const periodEndMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
    const trialEndMs = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null;

    // Se está em teste grátis mas já antecipou o primeiro período pago além do trial:
    if (trialEndMs && trialEndMs > nowMs && periodEndMs && periodEndMs > trialEndMs) {
      return null;
    }

    // 3. Status CANCELADO
    if (status === "canceled") {
      return {
        stage: "canceled" as const,
        diffDays: 0,
        canDismiss: false,
        actionUrl: "/settings?tab=billing",
      };
    }

    // 4. PERÍODO DE TOLERÂNCIA (Inadimplência dentro do prazo de tolerância)
    if (isSubscriptionInGracePeriod) {
      if (isPix) {
        return {
          stage: "grace_pix" as const,
          diffDays: gracePeriodDaysLeft,
          canDismiss: false,
          actionUrl: "/settings?tab=billing&action=pix",
        };
      }
      return {
        stage: "grace_card" as const,
        diffDays: gracePeriodDaysLeft,
        canDismiss: false,
        actionUrl: "/settings?tab=billing",
      };
    }

    // 5. ASSINATURA ATIVA - VENCIMENTO DO PIX EM ATÉ 5 DIAS (Janela de renovação) OU HOJE
    if (status === "active" && isPix && periodEndMs) {
      const diffMs = periodEndMs - nowMs;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 5 && diffDays >= 0) {
        return {
          stage: "pix_due" as const,
          diffDays,
          canDismiss: true,
          actionUrl: "/settings?tab=billing&action=pix",
        };
      }
    }

    // 6. ASSINATURA BLOQUEADA / EXPIRADA / MODO LEITURA (isSubscriptionActive === false)
    if (!isSubscriptionActive) {
      // Se era teste grátis que expirou
      if (status === "trialing" || sub.plan?.code === "FREE_TRIAL") {
        return {
          stage: "trial_expired" as const,
          diffDays: 0,
          canDismiss: false,
          actionUrl: isPix ? "/settings?tab=billing&action=pix" : "/settings?tab=billing",
        };
      }
      // Assinatura regular atrasada/bloqueada
      return {
        stage: "read_only_past_due" as const,
        diffDays: 0,
        canDismiss: false,
        actionUrl: isPix ? "/settings?tab=billing&action=pix" : "/settings?tab=billing",
      };
    }

    // 7. TESTE GRÁTIS ATIVO (Contagem regressiva dos últimos 3 dias)
    if (status === "trialing" || sub.plan?.code === "FREE_TRIAL") {
      const hasScheduledCard = Boolean(sub.pagarme_subscription_id && sub.payment_method === "card");
      // Se já tem cartão agendado no Pagar.me com renovação automática, não precisa alarmar
      if (hasScheduledCard) return null;

      const rawTrialEnd = sub.trial_ends_at || sub.current_period_end;
      if (!rawTrialEnd) return null;

      const trialEnd = new Date(rawTrialEnd);
      const diffMs = trialEnd.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs <= 0) {
        return {
          stage: "trial_expired" as const,
          diffDays: 0,
          canDismiss: false,
          actionUrl: isPix ? "/settings?tab=billing&action=pix" : "/settings?tab=billing",
        };
      }

      if (diffHours <= 24 && diffMs > 0) {
        return {
          stage: "trial_last_day" as const,
          diffDays: 1,
          canDismiss: true,
          actionUrl: "/settings?tab=billing",
        };
      }

      if (diffDays <= 5 && diffMs > 0) {
        return {
          stage: "trial_warning_3d" as const,
          diffDays,
          canDismiss: true,
          actionUrl: "/settings?tab=billing",
        };
      }
    }

    return null;
  }, [tenant, sub, isSubscriptionActive, isSubscriptionInGracePeriod, gracePeriodDaysLeft]);

  // Controle de fechamento por sessão (vinculado ao estágio e aos dias restantes)
  const storageKey = bannerState ? `dismissed_billing_banner_${bannerState.stage}_${bannerState.diffDays}_${tenant?.id}` : "";
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (!storageKey) return false;
    return sessionStorage.getItem(storageKey) === "true";
  });

  if (!bannerState) return null;
  if (bannerState.canDismiss && dismissed) return null;

  const handleDismiss = () => {
    if (!bannerState.canDismiss) return;
    sessionStorage.setItem(storageKey, "true");
    setDismissed(true);
  };

  const handleGoToAction = () => {
    navigate(bannerState.actionUrl || "/settings?tab=billing");
  };

  // Configuração visual completa por estágio
  const configs: Record<string, any> = {
    // 1. Trial Faltam 3 dias
    trial_warning_3d: {
      bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
      border: "#FDE68A",
      shadow: "0 4px 14px rgba(217, 119, 6, 0.08)",
      iconBg: "#F59E0B",
      iconColor: "#FFFFFF",
      titleColor: "#92400E",
      descColor: "#B45309",
      btnBg: "#D97706",
      btnHover: "#B45309",
      closeColor: "#B45309",
      icon: <Clock size={18} />,
      title: `Faltam ${bannerState?.diffDays} dias para acabar seu período gratuito!`,
      desc: "Cadastre seu cartão de crédito ou prepare sua renovação via Pix para manter seu petshop ativo sem interrupções.",
      btnLabel: "Escolher Forma de Pagamento",
      badge: null,
    },
    // 2. Trial Último dia (24h)
    trial_last_day: {
      bg: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
      border: "#FDBA74",
      shadow: "0 4px 14px rgba(234, 88, 12, 0.12)",
      iconBg: "#EA580C",
      iconColor: "#FFFFFF",
      titleColor: "#9A3412",
      descColor: "#C2410C",
      btnBg: "#EA580C",
      btnHover: "#C2410C",
      closeColor: "#C2410C",
      icon: <AlertTriangle size={18} />,
      title: "Amanhã acaba seu período de teste grátis!",
      desc: "Seu acesso gratuito encerra em menos de 24 horas. Adicione uma forma de pagamento para não ter seus agendamentos bloqueados.",
      btnLabel: "Adicionar Pagamento",
      badge: null,
    },
    // 3. Pix no Vencimento (Hoje ou em até 2 dias)
    pix_due: {
      bg: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)",
      border: "#6EE7B7",
      shadow: "0 4px 14px rgba(5, 150, 105, 0.1)",
      iconBg: "#059669",
      iconColor: "#FFFFFF",
      titleColor: "#065F46",
      descColor: "#047857",
      btnBg: "#059669",
      btnHover: "#047857",
      closeColor: "#047857",
      icon: <PixIcon size={18} color="#FFFFFF" />,
      title: bannerState?.diffDays === 0
        ? "Sua assinatura vence hoje! Fatura Pix pronta para pagamento."
        : `Sua assinatura vence em ${bannerState?.diffDays} dia(s)! Fatura Pix pronta.`,
      desc: "Sua cobrança Pix para renovação mensal já está disponível. Pague agora para manter seu acesso sem interrupções.",
      btnLabel: "Ver QR Code Pix",
      badge: null,
    },
    // 4. Tolerância - Pix Vencido (Grace Period)
    grace_pix: {
      bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
      border: "#FCD34D",
      shadow: "0 4px 14px rgba(217, 119, 6, 0.12)",
      iconBg: "#D97706",
      iconColor: "#FFFFFF",
      titleColor: "#92400E",
      descColor: "#B45309",
      btnBg: "#D97706",
      btnHover: "#B45309",
      closeColor: "#B45309",
      icon: <PixIcon size={18} color="#FFFFFF" />,
      title: "Fatura Pix aguardando pagamento",
      desc: `Sua mensalidade via Pix está aguardando pagamento. Restam ${bannerState?.diffDays} dia(s) de tolerância antes do bloqueio de agendamentos.`,
      btnLabel: "Pagar com Pix",
      badge: {
        text: `Tolerância: ${bannerState?.diffDays} dia(s)`,
        bg: "#FEF3C7",
        border: "#FDE68A",
        color: "#92400E",
      },
    },
    // 5. Tolerância - Falha no Cartão (Grace Period)
    grace_card: {
      bg: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
      border: "#FCD34D",
      shadow: "0 4px 14px rgba(217, 119, 6, 0.12)",
      iconBg: "#D97706",
      iconColor: "#FFFFFF",
      titleColor: "#92400E",
      descColor: "#B45309",
      btnBg: "#D97706",
      btnHover: "#B45309",
      closeColor: "#B45309",
      icon: <CreditCard size={18} />,
      title: "Houve uma falha na cobrança do seu cartão",
      desc: `Não conseguimos processar a renovação no seu cartão de crédito. Restam ${bannerState?.diffDays} dia(s) de tolerância para atualizar seus dados antes do bloqueio.`,
      btnLabel: "Atualizar Cartão",
      badge: {
        text: `Tolerância: ${bannerState?.diffDays} dia(s)`,
        bg: "#FEF3C7",
        border: "#FDE68A",
        color: "#92400E",
      },
    },
    // 6. Teste Expirado (Bloqueado)
    trial_expired: {
      bg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
      border: "#F87171",
      shadow: "0 6px 20px rgba(220, 38, 38, 0.16)",
      iconBg: "#DC2626",
      iconColor: "#FFFFFF",
      titleColor: "#991B1B",
      descColor: "#B91C1C",
      btnBg: "#DC2626",
      btnHover: "#B91C1C",
      closeColor: "#DC2626",
      icon: <AlertOctagon size={20} />,
      title: "Seu período de teste grátis expirou!",
      desc: "O sistema está em modo somente leitura. Novos agendamentos, vendas e cadastros estão bloqueados até a regularização. Ative sua assinatura para continuar usando.",
      btnLabel: sub?.payment_method === "pix" ? "Pagar com Pix" : "Ativar Assinatura",
      badge: {
        text: "Modo Somente Leitura",
        bg: "#FEE2E2",
        border: "#FCA5A5",
        color: "#991B1B",
      },
    },
    // 7. Assinatura Regular Bloqueada (Past Due sem tolerância)
    read_only_past_due: {
      bg: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
      border: "#F87171",
      shadow: "0 6px 20px rgba(220, 38, 38, 0.16)",
      iconBg: "#DC2626",
      iconColor: "#FFFFFF",
      titleColor: "#991B1B",
      descColor: "#B91C1C",
      btnBg: "#DC2626",
      btnHover: "#B91C1C",
      closeColor: "#DC2626",
      icon: <AlertOctagon size={20} />,
      title: "Pagamento pendente — Acesso restrito",
      desc: "O período de tolerância encerrou e o sistema está em modo somente leitura. Regularize sua mensalidade para liberar novos agendamentos e vendas imediatamente.",
      btnLabel: sub?.payment_method === "pix" ? "Pagar com Pix" : "Regularizar Pagamento",
      badge: {
        text: "Modo Somente Leitura",
        bg: "#FEE2E2",
        border: "#FCA5A5",
        color: "#991B1B",
      },
    },
    // 8. Assinatura Cancelada
    canceled: {
      bg: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
      border: "#CBD5E1",
      shadow: "0 4px 14px rgba(100, 116, 139, 0.1)",
      iconBg: "#64748B",
      iconColor: "#FFFFFF",
      titleColor: "#1E293B",
      descColor: "#475569",
      btnBg: "#334155",
      btnHover: "#1E293B",
      closeColor: "#475569",
      icon: <ShieldAlert size={18} />,
      title: "Assinatura cancelada",
      desc: "Sua assinatura do Data Pet Pro foi cancelada e o sistema está em modo consulta. Reative quando desejar voltar a usar todas as funcionalidades.",
      btnLabel: "Reativar Assinatura",
      badge: null,
    },
  };

  const current = configs[bannerState.stage] || configs.trial_expired;

  return (
    <Box
      sx={{
        margin: "0 auto 1.25rem auto",
        width: "100%",
        maxWidth: 1400,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 2, sm: 3 },
        py: { xs: 1.75, sm: 2 },
        borderRadius: 3,
        background: current.bg,
        border: `1.5px solid ${current.border}`,
        boxShadow: current.shadow,
        position: "relative",
      }}
    >
      {/* Lado Esquerdo: Ícone + Textos Informativos */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, flex: 1, pr: bannerState.canDismiss ? 4 : 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: current.iconBg,
            color: current.iconColor,
            borderRadius: "50%",
            width: 36,
            height: 36,
            flexShrink: 0,
            mt: 0.25,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {current.icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: current.titleColor, fontSize: { xs: "0.9rem", sm: "0.95rem" }, lineHeight: 1.2 }}
            >
              {current.title}
            </Typography>

            {current.badge && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.2,
                  bgcolor: current.badge.bg,
                  border: `1px solid ${current.badge.border}`,
                  borderRadius: 1.5,
                  color: current.badge.color,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                <ShieldAlert size={12} />
                {current.badge.text}
              </Box>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{ color: current.descColor, mt: 0.5, fontSize: { xs: "0.82rem", sm: "0.86rem" }, lineHeight: 1.4 }}
          >
            {current.desc}
          </Typography>
        </Box>
      </Box>

      {/* Lado Direito: Ação + Botão Fechar (quando permitido) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", md: "auto" }, justifyContent: { xs: "stretch", md: "flex-end" } }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleGoToAction}
          endIcon={<ArrowRight size={15} />}
          sx={{
            py: 0.85,
            px: 2.2,
            fontSize: "0.82rem",
            fontWeight: 800,
            textTransform: "none",
            borderRadius: 2.5,
            bgcolor: current.btnBg,
            color: "white",
            boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
            flexShrink: 0,
            width: { xs: "100%", md: "auto" },
            textAlign: "center",
            "&:hover": {
              bgcolor: current.btnHover,
              boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            },
          }}
        >
          {current.btnLabel}
        </Button>

        {bannerState.canDismiss && (
          <IconButton
            size="small"
            onClick={handleDismiss}
            title="Fechar aviso"
            sx={{
              color: current.closeColor,
              position: { xs: "absolute", md: "static" },
              top: { xs: 10, md: "auto" },
              right: { xs: 10, md: "auto" },
              p: 0.75,
              borderRadius: "50%",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.06)",
              },
            }}
          >
            <X size={16} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
