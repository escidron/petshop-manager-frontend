import { Box, Typography } from "@mui/material";

const NoAppointmentsBanner = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Typography variant="h6">Nenhum agendamento ainda</Typography>
      <Typography variant="body2" color="text.disabled">
        Clique no botão "Criar Agendamento" para começar!
      </Typography>
      <img src="/no_appointment.png" style={{ maxHeight: 280, width: "auto" }} />
    </Box>
  );
};

export default NoAppointmentsBanner;
