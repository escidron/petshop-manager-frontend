import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import {
  MessageCircle,
  MessageSquare,
  Info,
} from "lucide-react";
import { Button } from "../../components/Button/Button";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppPkg {
  id: string;
  count: string;
  label: string;
  price: string;
  period: string;
  popular?: boolean;
  features?: string[];
}

// ─── Package Catalog ──────────────────────────────────────────────────────────

const WHATSAPP_PACKAGES: WhatsAppPkg[] = [
  {
    id: "200",
    count: "200",
    label: "mensagens / mês",
    price: "R$ 37,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "500",
    count: "500",
    label: "mensagens / mês",
    price: "R$ 69,90",
    period: "/mês",
    popular: false,
  },
  {
    id: "1000",
    count: "1.000",
    label: "mensagens / mês",
    price: "R$ 119,90",
    period: "/mês",
    popular: true,
  },
  {
    id: "2000",
    count: "2.000",
    label: "mensagens / mês",
    price: "R$ 199,90",
    period: "/mês",
    popular: false,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface BillingAddonsSectionProps {
  activePackageId?: string | null;
  onSelectPackage?: (pkgId: string | null) => void;
  onHirePackage?: (pkgId: string) => void;
}

const BillingAddonsSection: React.FC<BillingAddonsSectionProps> = ({
  activePackageId = null,
  onHirePackage,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<string | null>(activePackageId);

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 4,
        p: { xs: 2.5, sm: 3.5 },
        border: "1.5px solid #86EFAC",
        boxShadow: "0 8px 30px -8px rgba(37, 211, 102, 0.12)",
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
        Envie lembretes de agendamentos e confirmações de forma automática pelo WhatsApp.
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <MessageSquare size={16} color="#16A34A" strokeWidth={2.5} />
        <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "#334155" }}>
          Pacotes opcionais. Clique para selecionar ou alterar seu pacote:
        </Typography>
      </Box>

      {/* Package list rows */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {WHATSAPP_PACKAGES.map((pkg) => {
          const isSelected = selectedPkg === pkg.id;
          const isActive = activePackageId === pkg.id;

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
                borderColor: isSelected ? "#16A34A" : "#E2E8F0",
                bgcolor: isSelected ? "#F0FDF4" : "white",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: isSelected ? "#16A34A" : "#CBD5E1",
                  bgcolor: isSelected ? "#F0FDF4" : "#F8FAFC",
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
                {isActive && (
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
                    borderColor: isSelected ? "#16A34A" : "#CBD5E1",
                    bgcolor: isSelected ? "#16A34A" : "transparent",
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
      {selectedPkg && selectedPkg !== activePackageId && (
        <Box sx={{ mb: 2.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onHirePackage?.(selectedPkg)}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              py: 1.2,
              bgcolor: "#16A34A",
              color: "white",
              fontSize: "0.95rem",
              textTransform: "none",
              "&:hover": { bgcolor: "#15803D" },
            }}
          >
            Contratar pacote ({WHATSAPP_PACKAGES.find(p => p.id === selectedPkg)?.price}/mês)
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
          Você só paga pelos pacotes que escolher. Eles são cobrados mensalmente de forma independente ou combinada com o plano PetControle Pro.
        </Typography>
      </Box>
    </Box>
  );
};

export default BillingAddonsSection;
