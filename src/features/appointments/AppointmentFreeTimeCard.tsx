import { Box, Typography } from "@mui/material";
import type { TimelineBlock } from "./types";

type Props = {
    block: TimelineBlock;
    openFlow: () => void
}
const AppointmentFreeTimeCard = ({ block, openFlow }: Props) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
        py: 0.5,
        px: 2,
        borderRadius: 2,
        backgroundColor: "#d6fff0e2",
        border: `1px solid #B7E4C7`,
        cursor: "pointer",
      }}
      onClick={() => openFlow()}
    >
      <Typography variant="body2" fontWeight={600}>
        {block.start.format("HH:mm")} - {block.end.format("HH:mm")}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        Horario sem agendamento
      </Typography>
    </Box>
  );
};

export default AppointmentFreeTimeCard;
