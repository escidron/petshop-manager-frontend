import CustomCard from "../../components/Card/CustomCard";
import { Box, Typography } from "@mui/material";
import { CircleCheck, Plus } from "lucide-react";
import { Button } from "../../components/Button/Button";
import theme from "../../theme";
import { useNavigate } from "react-router";

type Props = {
      openFlow: () => void;
}
const OnboardingFinishBanner = ({ openFlow }: Props) => {
    const navigate = useNavigate();
  return (
    <CustomCard
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <CircleCheck
          fill="green"
          color={theme.palette.text.secondary}
          size={30}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            Seu Petshop
          </Typography>
          <Typography variant="h5" fontWeight={500}>
            está pronto!
          </Typography>
        </Box>
      </Box>
      <Typography variant="body1" mt={1}>
        Comece criando seu primeiro{" "}
        <Box component="span" fontWeight={600}>
          agendamento
        </Box>{" "}
        ou cadastre outros{" "}
        <Box component="span" fontWeight={600}>
          serviços
        </Box>{" "}
        e{" "}
        <Box component="span" fontWeight={600}>
          clientes
        </Box>{" "}
        .
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
        <Button startIcon={<Plus />} onClick={openFlow}>Criar Agendamento</Button>
        <Button variant="outlined" onClick={()=>navigate("/registration/services")}>Serviços</Button>
        <Button variant="outlined" onClick={()=>navigate("/registration/clients")}>Clientes</Button>
      </Box>
    </CustomCard>
  );
};

export default OnboardingFinishBanner;
