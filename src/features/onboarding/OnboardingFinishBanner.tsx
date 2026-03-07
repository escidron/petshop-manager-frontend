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
        p: { xs: 3, md: 5 },
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
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: `${theme.palette.primary.main}15`,
          color: theme.palette.primary.main,
          mb: 3,
        }}
      >
        <Sparkles size={30} />
      </Box>

      <Typography
        variant="h4"
        fontWeight={700}
        textAlign="center"
        color="text.primary"
        gutterBottom
      >
        Bem-vindo(a) ao Animora!
      </Typography>

      <Typography
        variant="body1"
        textAlign="center"
        color="text.primary"
        sx={{ maxWidth: 650, mb: 4, fontSize: "1.1rem", lineHeight: 1.6 }}
      >
        Sua agenda está livre por enquanto. Aqui é onde você vai visualizar e
        gerenciar todos os banhos, tosas e consultas. Que tal começarmos a
        movimentar esse calendário?
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Button
          size="medium"
          startIcon={<CalendarPlus size={20} />}
          onClick={openFlow}
          sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: "1rem" }}
        >
          Primeiro Agendamento
        </Button>
        <Button
          size="medium"
          variant="outlined"
          startIcon={<Scissors size={20} />}
          onClick={() => navigate("/registration/services")}
          sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: "1rem" }}
        >
          Cadastrar Serviços
        </Button>
        <Button
          size="medium"
          variant="outlined"
          startIcon={<Users size={20} />}
          onClick={() => navigate("/registration/clients")}
          sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: "1rem" }}
        >
          Cadastrar Clientes
        </Button>
      </Box>
    </CustomCard>
  );
};

export default OnboardingFinishBanner;
