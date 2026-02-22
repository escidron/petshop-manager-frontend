import { Box, Divider, Typography } from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import { Check } from "lucide-react";
import { Button } from "../../components/Button/Button";
import type { PlanCode } from "./types";

type Props = {
  onSubmit: (plan_code: PlanCode) => void;
};

const PlanForm = ({ onSubmit }: Props) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 2, width: "50%" }}>
        <CustomCard
          sx={{
            p: 0,
            height: "500px",
            minWidth: "370px",
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              color: "text.secondary",
              width: "100%",
              borderRadius: "8px 8px 0px 0px",
              p: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5">Teste Gratuito</Typography>
          </Box>
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "90%",
            }}
          >
            <Typography variant="h4" color="primary.main">
              14 Dias Gratis
            </Typography>
            <Divider sx={{ my: 1, width: "100%" }} />
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, my: 2 }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Acesso completo por 14 dias</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Sem necessidade de cartão</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Configure seu petshop em minutos</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Suporte incluso</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Cancele quando quiser</Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              sx={{ width: "100%", mt: "auto" }}
              onClick={() => onSubmit("FREE_TRIAL")}
            >
              Começar Grátis
            </Button>
          </Box>
        </CustomCard>
        <CustomCard
          sx={{
            p: 0,
            height: "500px",
            border: "2px solid",
            borderColor: "primary.main",
            minWidth: "370px",
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              color: "text.secondary",
              width: "100%",
              borderRadius: "4px 4px 0px 0px",
              p: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5">Plano Mensal</Typography>
          </Box>
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "90%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography color="primary.main">R$</Typography>
              <Typography variant="h4" color="primary.main">
                99,90
              </Typography>
              <Typography color="primary.main" sx={{ mt: 1 }}>
                /més
              </Typography>
            </Box>
            <Divider sx={{ my: 1, width: "100%" }} />
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, my: 2 }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Acesso completo à plataforma</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Gestão de clientes e pets ilimitados</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>
                  Agenda inteligente e controle financeiro
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Relatórios e métricas do negócio</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Suporte prioritário</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Cancelamento simples e imediato</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Check />
                <Typography>Atualizações contínuas</Typography>
              </Box>
            </Box>
            <Button
              sx={{ width: "100%", mt: "auto" }}
              onClick={() => onSubmit("MONTHLY")}
            >
              Assinar Agora
            </Button>
          </Box>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default PlanForm;
