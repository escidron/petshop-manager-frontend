import CustomCard from "../../components/Card/CustomCard";
import { Box, Typography } from "@mui/material";
import { Sparkles, CalendarPlus, Scissors, Users } from "lucide-react";
import { Button } from "../../components/Button/Button";
import theme from "../../theme";
import { useNavigate } from "react-router-dom";

type Props = {
  openFlow: () => void;
};

const OnboardingFinishBanner = ({ openFlow }: Props) => {
  const navigate = useNavigate();
  return (
    <CustomCard
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: { xs: 2, md: 3 },
        background: `linear-gradient(to right bottom, #ffffff, ${theme.palette.primary.light}10)`,
        border: `1px solid ${theme.palette.primary.light}40`,
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: `${theme.palette.primary.main}15`,
          color: theme.palette.primary.main,
          mb: 1.5,
        }}
      >
        <Sparkles size={24} />
      </Box>

      <Typography
        variant="h5"
        fontWeight={700}
        textAlign="center"
        color="text.primary"
        sx={{ mb: 1 }}
      >
        Bem-vindo(a) ao Data Pet!
      </Typography>

      <Typography
        variant="body2"
        textAlign="center"
        color="text.primary"
        sx={{ maxWidth: 600, mb: 2.5, lineHeight: 1.6 }}
      >
        Sua agenda está livre por enquanto. Aqui é onde você vai visualizar e
        gerenciar todos os banhos, tosas e consultas. Que tal começarmos a
        movimentar esse calendário?
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Button
          size="small"
          startIcon={<CalendarPlus size={16} />}
          onClick={openFlow}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Primeiro Agendamento
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Scissors size={16} />}
          onClick={() => navigate("/registration/services")}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Cadastrar Serviços
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Users size={16} />}
          onClick={() => navigate("/registration/clients")}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Cadastrar Clientes
        </Button>
      </Box>
    </CustomCard>
  );
};

export default OnboardingFinishBanner;
