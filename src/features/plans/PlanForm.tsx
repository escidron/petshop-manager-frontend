import { Box, Divider, Typography } from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import { Check } from "lucide-react";
import { Button } from "../../components/Button/Button";
import type { PlanCode } from "./types";

type Props = {
  onSubmit: (plan_code: PlanCode) => void;
  selectedPlan?: PlanCode;
};

const PlanForm = ({ onSubmit, selectedPlan }: Props) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "center",
          gap: 4,
          width: "100%",
          alignItems: "stretch",
        }}
      >
        {/* FREE TRIAL CARD */}
        <CustomCard
          sx={{
            p: 0,
            height: "520px",
            width: { xs: "100%", lg: "360px" },
            maxWidth: { xs: "100%", lg: "360px" },
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden", // Fix rounding mismatch by clipping children
            border: "2px solid",
            borderColor: selectedPlan === "FREE_TRIAL" ? "primary.main" : "#E2E8F0", // Subtle border when not selected
            ...(selectedPlan === "FREE_TRIAL" && {
              boxShadow: "0 15px 45px rgba(49, 52, 133, 0.25)",
              transform: "translateY(-8px)",
              "&::before": {
                content: '"ATUAL"',
                position: "absolute",
                top: 18,
                right: -32,
                background: "white",
                color: "#313485",
                padding: "6px 40px",
                transform: "rotate(45deg)",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "1.5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 10,
              }
            }),
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              width: "100%",
              p: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5" fontWeight={700}>Teste Gratuito</Typography>
          </Box>
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Typography variant="h4" color="primary.main" fontWeight={800}>
              14 Dias Gratis
            </Typography>
            <Divider sx={{ my: 1, width: "100%" }} />
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, my: 2 }}
            >
              {[
                "Acesso completo por 14 dias",
                "Sem necessidade de cartão",
                "Configure seu petshop em minutos",
                "Suporte incluso",
                "Cancele quando quiser",
              ].map((text) => (
                <Box key={text} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Box sx={{ color: "primary.main", display: "flex" }}>
                    <Check size={18} strokeWidth={3} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>{text}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              variant={selectedPlan === "FREE_TRIAL" ? "contained" : "outlined"}
              sx={{ 
                width: "100%", 
                mt: "auto",
                fontWeight: 800,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem"
              }}
              onClick={() => onSubmit("FREE_TRIAL")}
            >
              {selectedPlan === "FREE_TRIAL" ? "Plano Selecionado" : "Começar Grátis"}
            </Button>
          </Box>
        </CustomCard>

        {/* MONTHLY PLAN CARD */}
        <CustomCard
          sx={{
            p: 0,
            height: "520px",
            width: { xs: "100%", lg: "360px" },
            maxWidth: { xs: "100%", lg: "360px" },
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden", // Fix rounding mismatch
            border: "2px solid",
            borderColor: "primary.main",
            ...(selectedPlan === "MONTHLY" && {
              boxShadow: "0 15px 45px rgba(49, 52, 133, 0.35)",
              transform: "translateY(-8px)",
              borderWidth: "3px",
              "&::before": {
                content: '"ATUAL"',
                position: "absolute",
                top: 18,
                right: -32,
                background: "white",
                color: "#313485",
                padding: "6px 40px",
                transform: "rotate(45deg)",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "1.5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 10,
              }
            }),
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              width: "100%",
              p: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5" fontWeight={700}>Plano Mensal</Typography>
          </Box>
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography color="primary.main" fontWeight={700}>R$</Typography>
              <Typography variant="h3" color="primary.main" fontWeight={900}>
                99,90
              </Typography>
              <Typography color="text.secondary" variant="body2" fontWeight={600}>
                /mês
              </Typography>
            </Box>
            <Divider sx={{ my: 1, width: "100%" }} />
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, my: 2 }}
            >
              {[
                "Acesso completo à plataforma",
                "Gestão de clientes e pets ilimitados",
                "Agenda inteligente e controle financeiro",
                "Relatórios e métricas do negócio",
                "Suporte prioritário",
                "Cancelamento simples e imediato",
                "Atualizações contínuas",
              ].map((text) => (
                <Box key={text} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Box sx={{ color: "primary.main", display: "flex" }}>
                    <Check size={18} strokeWidth={3} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>{text}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              sx={{ 
                width: "100%", 
                mt: "auto",
                fontWeight: 800,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem"
              }}
              variant="contained"
              onClick={() => onSubmit("MONTHLY")}
            >
              {selectedPlan === "MONTHLY" ? "Plano Selecionado" : "Assinar Agora"}
            </Button>
          </Box>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default PlanForm;
