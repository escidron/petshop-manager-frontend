import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  MessageCircle,
  MessageSquare,
  Info,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { Button } from "../../components/Button/Button";
import dayjs from "dayjs";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppPkg {
  id: string;
  count: string;
  label: string;
  price: string;
  period: string;
  popular?: boolean;
}

// ─── Package Catalog ──────────────────────────────────────────────────────────

export const WHATSAPP_PACKAGES: WhatsAppPkg[] = [
  {
    id: "pkg_200",
    count: "200",
    label: "mensagens / mês",
    price: "R$ 24,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "pkg_300",
    count: "300",
    label: "mensagens / mês",
    price: "R$ 34,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "pkg_500",
    count: "500",
    label: "mensagens / mês",
    price: "R$ 49,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "pkg_750",
    count: "750",
    label: "mensagens / mês",
    price: "R$ 69,90",
    period: "/mês",
    popular: true,
  },
  {
    id: "pkg_1000",
    count: "1.000",
    label: "mensagens / mês",
    price: "R$ 99,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "pkg_2000",
    count: "2.000",
    label: "mensagens / mês",
    price: "R$ 169,90",
    period: "/mês",
    popular: false,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface BillingAddonsSectionProps {
  activePackageId?: string | null;
  nextPackageId?: string | null;
  packageStatus?: "inactive" | "pending_payment" | "active" | "canceled";
  messagesLimit?: number;
  messagesUsed?: number;
  periodEnd?: string | null;
  onHirePackage?: (pkgId: string) => void;
  onCancelPackage?: () => void;
  onCancelScheduledDowngrade?: () => void;
}

const BillingAddonsSection: React.FC<BillingAddonsSectionProps> = ({
  activePackageId = null,
  nextPackageId = null,
  packageStatus = "inactive",
  messagesLimit = 0,
  messagesUsed = 0,
  periodEnd,
  onHirePackage,
  onCancelPackage,
  onCancelScheduledDowngrade,
}) => {
  // Normalize active package ID (e.g. "500" -> "pkg_500")
  const normalizedActiveId = activePackageId
    ? activePackageId.startsWith("pkg_")
      ? activePackageId
      : `pkg_${activePackageId}`
    : null;

  const normalizedNextId = nextPackageId
    ? nextPackageId.startsWith("pkg_")
      ? nextPackageId
      : `pkg_${nextPackageId}`
    : null;

  const [selectedPkg, setSelectedPkg] = useState<string | null>(normalizedActiveId);

  useEffect(() => {
    setSelectedPkg(normalizedActiveId);
  }, [normalizedActiveId]);

  const isActive = packageStatus === "active" && normalizedActiveId;
  const isPending = packageStatus === "pending_payment" && normalizedActiveId;
  const currentPkgData = WHATSAPP_PACKAGES.find((p) => p.id === normalizedActiveId);
  const nextPkgData = WHATSAPP_PACKAGES.find((p) => p.id === normalizedNextId);
  const selectedPkgData = WHATSAPP_PACKAGES.find((p) => p.id === selectedPkg);

  const packagePriceMap: Record<string, number> = {
    pkg_200: 2490,
    pkg_300: 3490,
    pkg_500: 4990,
    pkg_750: 6990,
    pkg_1000: 9990,
    pkg_2000: 16990,
  };

  const isSelectedDowngrade =
    isActive &&
    selectedPkg &&
    normalizedActiveId &&
    (packagePriceMap[selectedPkg] || 0) < (packagePriceMap[normalizedActiveId] || 0);

  const usagePercent = messagesLimit > 0 ? Math.min(100, Math.round((messagesUsed / messagesLimit) * 100)) : 0;

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 4,
        p: { xs: 2.5, sm: 3.5 },
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Top Badge & Icon */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box
          sx={{
            bgcolor: "#DCFCE7",
            color: "#15803D",
            px: 1.5,
            py: 0.6,
            borderRadius: "8px",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.5px",
            border: "1px solid #BBF7D0",
          }}
        >
          PACOTES DE MENSAGENS WHATSAPP
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            bgcolor: "#F0FDF4",
            border: "1px solid #DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#25D366",
          }}
        >
          <MessageCircle size={22} strokeWidth={2.2} />
        </Box>
      </Box>

      {/* Title & Description */}
      <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8, fontSize: { xs: "1.35rem", sm: "1.55rem" } }}>
        Mensagens automáticas
      </Typography>
      <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.5, mb: 2.5 }}>
        Envie lembretes de agendamentos e confirmações de forma 100% automática pelo WhatsApp.
      </Typography>

      {/* Active Package Status Card */}
      {isActive && currentPkgData && (
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: "white",
            border: "1.5px solid #E2E8F0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                Pacote Ativo: {currentPkgData.count} Mensagens/mês ({currentPkgData.price})
              </Typography>
            </Box>
            {periodEnd && (
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700 }}>
                Renova em {dayjs(periodEnd).format("DD/MM/YYYY")}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="#475569">
                Consumo do ciclo atual:
              </Typography>
              <Typography variant="caption" fontWeight={800} color="#0F172A">
                {messagesUsed} de {messagesLimit} mensagens utilizadas ({usagePercent}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={usagePercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "#F1F5F9",
                "& .MuiLinearProgress-bar": {
                  bgcolor: usagePercent > 90 ? "#EF4444" : "#16A34A",
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          {/* Banner de Downgrade Agendado */}
          {nextPkgData && (
            <Box
              sx={{
                mt: 2,
                p: 1.8,
                borderRadius: 2.5,
                bgcolor: "#FEF3C7",
                border: "1px solid #FDE68A",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <CalendarClock size={20} color="#D97706" style={{ flexShrink: 0 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#92400E", fontWeight: 800, fontSize: "0.85rem" }}>
                    Alteração agendada para a próxima renovação ({periodEnd ? dayjs(periodEnd).format("DD/MM/YYYY") : "próximo ciclo"})
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#B45309", fontSize: "0.78rem", display: "block" }}>
                    Seu pacote mudará para <strong>{nextPkgData.count} Mensagens/mês ({nextPkgData.price})</strong>. Suas {messagesLimit.toLocaleString("pt-BR")} mensagens atuais continuam liberadas para uso até a renovação.
                  </Typography>
                </Box>
              </Box>
              {onCancelScheduledDowngrade && (
                <Button
                  variant="text"
                  size="small"
                  onClick={onCancelScheduledDowngrade}
                  sx={{
                    color: "#92400E",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    textDecoration: "underline",
                    textTransform: "none",
                    p: 0,
                    minWidth: "auto",
                    "&:hover": { bgcolor: "transparent", color: "#78350F" },
                  }}
                >
                  Cancelar alteração
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
            {onCancelPackage && (
              <Button
                variant="text"
                size="small"
                color="error"
                onClick={onCancelPackage}
                sx={{ fontSize: "0.8rem", fontWeight: 700 }}
              >
                Cancelar este pacote
              </Button>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <MessageSquare size={16} color="#16A34A" strokeWidth={2.5} />
        <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "#334155" }}>
          {isActive ? "Deseja alterar seu pacote? Escolha uma opção:" : "Pacotes disponíveis:"}
        </Typography>
      </Box>

      {/* Package list rows */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {WHATSAPP_PACKAGES.map((pkg) => {
          const isSelected = selectedPkg === pkg.id;
          const isCurrentActive = normalizedActiveId === pkg.id && isActive;

          return (
            <Box
              key={pkg.id}
              onClick={() => setSelectedPkg((prev) => (prev === pkg.id ? null : pkg.id))}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: { xs: 1.5, sm: 1.8 },
                borderRadius: "14px",
                border: "1.5px solid",
                borderColor: isCurrentActive ? "#16A34A" : isSelected ? "#313485" : "#E2E8F0",
                bgcolor: isCurrentActive ? "#F0FDF4" : isSelected ? "#EEF2FF" : "white",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: isCurrentActive ? "#16A34A" : isSelected ? "#313485" : "#CBD5E1",
                  bgcolor: isCurrentActive ? "#F0FDF4" : isSelected ? "#EEF2FF" : "#F8FAFC",
                },
              }}
            >
              {/* Left: Count, Label & Popular Badge */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>
                  {pkg.count}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: "#475569", fontSize: "0.9rem" }}>
                  {pkg.label}
                </Typography>
                {pkg.popular && (
                  <Chip
                    label="Mais popular"
                    size="small"
                    sx={{
                      bgcolor: "#16A34A",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 22,
                    }}
                  />
                )}
                {isCurrentActive && (
                  <Chip
                    label="Pacote Atual"
                    size="small"
                    sx={{
                      bgcolor: "#DCFCE7",
                      color: "#15803D",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      border: "1px solid #BBF7D0",
                      height: 22,
                    }}
                  />
                )}
                {normalizedNextId === pkg.id && (
                  <Chip
                    label="Agendado p/ próxima fatura"
                    size="small"
                    sx={{
                      bgcolor: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      border: "1px solid #FDE68A",
                      height: 22,
                    }}
                  />
                )}
                {isPending && normalizedActiveId === pkg.id && (
                  <Chip
                    label="Aguardando ativação"
                    size="small"
                    sx={{
                      bgcolor: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      border: "1px solid #FDE68A",
                      height: 22,
                    }}
                  />
                )}
              </Box>

              {/* Right: Price & Radio */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3 }}>
                  <Typography sx={{ fontWeight: 800, color: "#16A34A", fontSize: "1.05rem" }}>
                    {pkg.price}
                  </Typography>
                  <Typography sx={{ fontWeight: 500, color: "#64748B", fontSize: "0.8rem" }}>
                    {pkg.period}
                  </Typography>
                </Box>

                {/* Radio Indicator */}
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: isSelected ? "#313485" : "#CBD5E1",
                    bgcolor: isSelected ? "#313485" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSelected && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "white",
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Action / Contratar button if selected */}
      {selectedPkg && (!(isActive && normalizedActiveId === selectedPkg) || isPending) && (
        <Box sx={{ mb: 2.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onHirePackage?.(selectedPkg)}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              py: 1.2,
              bgcolor: isSelectedDowngrade ? "#D97706" : "#16A34A",
              color: "white",
              fontSize: "0.95rem",
              textTransform: "none",
              "&:hover": { bgcolor: isSelectedDowngrade ? "#B45309" : "#15803D" },
            }}
          >
            {isSelectedDowngrade
              ? `Agendar alteração para ${selectedPkgData?.count} mensagens (sem cobrança hoje)`
              : isActive
              ? "Alterar para este pacote"
              : isPending && normalizedActiveId === selectedPkg
              ? `Pagar e Ativar pacote (${selectedPkgData?.price}/mês)`
              : `Contratar pacote (${selectedPkgData?.price}/mês)`}
          </Button>
        </Box>
      )}

      {/* Notice Info Box */}
      <Box
        sx={{
          bgcolor: "#F0FDF4",
          border: "1px solid #DCFCE7",
          borderRadius: "14px",
          p: 2,
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
        }}
      >
        <Info size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: "0.85rem", color: "#166534", lineHeight: 1.5, fontWeight: 500 }}>
          Cobrança unificada: se você contratar no meio do mês, paga apenas o valor proporcional (pro-rata) até a data de vencimento da sua conta.
        </Typography>
      </Box>
    </Box>
  );
};

export default BillingAddonsSection;
