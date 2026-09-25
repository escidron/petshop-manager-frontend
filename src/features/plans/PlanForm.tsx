import { useState } from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import {
  CheckCircle2,
  Calendar,
  Gift,
  Info,
  MessageCircle,
  MessageSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import type { PlanCode } from "./types";

type Props = {
  onSubmit: (plan_code: PlanCode, packageId?: string | null) => void;
  selectedPlan?: PlanCode;
  selectedPackage?: string | null;
};

const PlanForm = ({ onSubmit, selectedPackage: initialPackage }: Props) => {
  const [selectedWaPackage, setSelectedWaPackage] = useState<string | null>(
    initialPackage ?? null
  );

  const whatsappPackages = [
    {
      id: "200",
      count: "200",
      label: "mensagens / mês",
      price: "R$ 37,90",
      priceNum: 37.9,
      period: "/mês",
      popular: false,
    },
    {
      id: "500",
      count: "500",
      label: "mensagens / mês",
      price: "R$ 69,90",
      priceNum: 69.9,
      period: "/mês",
      popular: false,
    },
    {
      id: "1000",
      count: "1.000",
      label: "mensagens / mês",
      price: "R$ 119,90",
      priceNum: 119.9,
      period: "/mês",
      popular: true,
    },
    {
      id: "2000",
      count: "2.000",
      label: "mensagens / mês",
      price: "R$ 199,90",
      priceNum: 199.9,
      period: "/mês",
      popular: false,
    },
  ];

  const selectedPkgData = whatsappPackages.find((p) => p.id === selectedWaPackage);

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleConfirm = () => {
    onSubmit("FREE_TRIAL", selectedWaPackage);
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* 2-Column Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: { xs: 3, lg: 3.5 },
          alignItems: "stretch",
          position: "relative",
        }}
      >
        {/* Left Card: Plano do Sistema */}
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "24px",
            p: { xs: 3, sm: 4, md: 4.5 },
            border: "1.5px solid #C7D2FE",
            boxShadow: "0 12px 36px -10px rgba(49, 52, 133, 0.1)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Top Badge & Icon */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Box
              sx={{
                bgcolor: "#EEF2FF",
                color: "#313485",
                px: 1.5,
                py: 0.6,
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.5px",
                border: "1px solid #C7D2FE",
              }}
            >
              PLANO DO SISTEMA
            </Box>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                bgcolor: "#EEF2FF",
                border: "1px solid #C7D2FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#313485",
              }}
            >
              <Calendar size={20} strokeWidth={2.2} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8, fontSize: { xs: "1.45rem", sm: "1.65rem" } }}>
            Data Pet Pro
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.5, mb: 2.5 }}>
            Tudo que você precisa para gerenciar seu petshop com eficiência.
          </Typography>

          {/* Price */}
          <Box sx={{ display: "flex", alignItems: "baseline", mb: 2 }}>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#0F172A", mr: 0.5 }}>
              R$
            </Typography>
            <Typography sx={{ fontSize: { xs: "2.4rem", sm: "2.85rem" }, fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
              99,90
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "#64748B", fontWeight: 600, ml: 1 }}>
              /mês
            </Typography>
          </Box>

          {/* Promo Badge */}
          <Box
            sx={{
              bgcolor: "#EEF2FF",
              color: "#313485",
              px: 1.8,
              py: 0.8,
              borderRadius: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
              width: "fit-content",
              border: "1px solid #C7D2FE",
            }}
          >
            <Gift size={18} strokeWidth={2.5} />
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>
              1º mês de teste grátis!
            </Typography>
          </Box>

          {/* Features */}
          <Stack spacing={1.6} sx={{ mb: 3.5, flexGrow: 1 }}>
            {[
              "Agenda de agendamentos inteligente",
              "Gestão de clientes e pets ilimitados",
              "Relatórios gerenciais completos",
              "Controle de caixa e financeiro",
              "Suporte especializado por e-mail",
            ].map((item, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                <CheckCircle2 size={18} color="#313485" strokeWidth={2.5} />
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Notice */}
          <Box
            sx={{
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              p: 2,
              display: "flex",
              gap: 1.2,
              alignItems: "flex-start",
              mt: "auto",
            }}
          >
            <Info size={18} color="#313485" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.84rem", color: "#475569", lineHeight: 1.45, fontWeight: 500 }}>
              Após os 30 dias de teste grátis, o plano será cobrado normalmente por R$ 99,90/mês.
            </Typography>
          </Box>
        </Box>

        {/* Plus (+) Badge in between cards */}
        <Box
          sx={{
            position: { xs: "relative", lg: "absolute" },
            left: { lg: "50%" },
            top: { lg: "50%" },
            transform: { lg: "translate(-50%, -50%)" },
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            my: { xs: -1, lg: 0 },
            gridColumn: { xs: "1 / -1", lg: "auto" },
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "white",
              border: "2px solid #E2E8F0",
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#313485",
            }}
          >
            <Plus size={24} strokeWidth={3} />
          </Box>
        </Box>

        {/* Right Card: Pacotes WhatsApp */}
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "24px",
            p: { xs: 3, sm: 4, md: 4.5 },
            border: "1.5px solid #86EFAC",
            boxShadow: "0 12px 36px -10px rgba(37, 211, 102, 0.15)",
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
              <MessageCircle size={20} strokeWidth={2.2} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A", mb: 0.8, fontSize: { xs: "1.45rem", sm: "1.65rem" } }}>
            Mensagens automáticas
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.5, mb: 2.2 }}>
            Envie lembretes de agendamentos de forma automática pelo WhatsApp.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <MessageSquare size={16} color="#16A34A" strokeWidth={2.5} />
            <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "#334155" }}>
              Pacotes opcionais. Clique para selecionar ou desmarcar:
            </Typography>
          </Box>

          {/* Package list */}
          <Stack spacing={1.5} sx={{ mb: 3, flexGrow: 1 }}>
            {whatsappPackages.map((pkg) => {
              const isSelected = selectedWaPackage === pkg.id;
              return (
                <Box
                  key={pkg.id}
                  onClick={() =>
                    setSelectedWaPackage((prev) => (prev === pkg.id ? null : pkg.id))
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.6,
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>
                      {pkg.count}
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: "#64748B", fontSize: "0.88rem" }}>
                      {pkg.label}
                    </Typography>
                    {pkg.popular && (
                      <Box
                        sx={{
                          bgcolor: "#16A34A",
                          color: "white",
                          px: 1,
                          py: 0.3,
                          borderRadius: "4px",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        Mais popular
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                    <Typography sx={{ fontWeight: 800, color: "#16A34A", fontSize: "0.95rem" }}>
                      {pkg.price}
                    </Typography>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: isSelected ? "#16A34A" : "#CBD5E1",
                        bgcolor: isSelected ? "#16A34A" : "transparent",
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
                </Box>
              );
            })}
          </Stack>

          {/* Notice */}
          <Box
            sx={{
              bgcolor: "#F0FDF4",
              border: "1px solid #DCFCE7",
              borderRadius: "14px",
              p: 2,
              display: "flex",
              gap: 1.2,
              alignItems: "flex-start",
              mt: "auto",
            }}
          >
            <Info size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.84rem", color: "#166534", lineHeight: 1.45, fontWeight: 500 }}>
              Cobrado mensalmente de forma independente do plano gratuito do sistema.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary Banner */}
      <Box
        sx={{
          bgcolor: "white",
          border: "1.5px solid #E2E8F0",
          borderRadius: "20px",
          p: { xs: 2.5, sm: 3 },
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>
            {selectedPkgData
              ? `Plano Data Pet Pro (Grátis) + ${selectedPkgData.count} msgs WhatsApp`
              : "Plano Data Pet Pro (Sem pacote WhatsApp adicional)"}
          </Typography>
          <Typography sx={{ fontSize: "0.88rem", color: "#64748B", mt: 0.4 }}>
            1º ao 6º mês:{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "#16A34A" }}>
              {selectedPkgData ? `${selectedPkgData.price}/mês` : "R$ 0,00 (Grátis)"}
            </Box>{" "}
            • A partir do 7º mês:{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "#0F172A" }}>
              R$ {selectedPkgData ? formatCurrency(99.9 + selectedPkgData.priceNum) : "99,90"}/mês
            </Box>
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleConfirm}
          endIcon={<ArrowRight size={20} />}
          sx={{
            bgcolor: "#313485",
            color: "white",
            px: 4,
            py: 1.5,
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "1rem",
            textTransform: "none",
            boxShadow: "0 8px 24px -4px rgba(49, 52, 133, 0.4)",
            whiteSpace: "nowrap",
            "&:hover": {
              bgcolor: "#24276A",
            },
          }}
        >
          Continuar para criar conta
        </Button>
      </Box>
    </Box>
  );
};

export default PlanForm;
