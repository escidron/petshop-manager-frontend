import {  Box, Typography } from "@mui/material";

const NoAppointmentsBanner = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="h5">Nenhum agendamento ainda</Typography>
      <Typography variant="body1">
        Você ainda não possui agendamentos marcados.
      </Typography>
      <img src="/no_appointment.png" />
      <Typography variant="body1" color="text.disabled">
        Clique no botão "Criar Agendamento" para começar!
      </Typography>
    </Box>
  );
};

export default NoAppointmentsBanner;
