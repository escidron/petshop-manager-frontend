import CustomCard from "../../components/Card/CustomCard";
import { Box, Divider, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  CalendarCheck,
  CircleCheck,
  Play,
  Scissors,
  ShowerHead,
  X,
} from "lucide-react";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import theme from "../../theme";
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor";

type Props = {
  appointment: Appointment;
  handleAction: (appointment: Appointment, action: AppointmentAction) => void;
};
const AppointmentListItem = ({ appointment, handleAction }: Props) => {
  const statusUI = getAppointmentStatusUI(appointment.status);
  const p = theme.palette[statusUI.palette];
  return (
    <CustomCard
      key={appointment.id}
      sx={{
        px: 2,
        py: 1,
        pb: 2,
        borderLeft: "5px solid",
        borderLeftColor: p.main,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "start",
          gap: 6,
        }}
      >
        <Box>
          <Typography fontWeight={600} fontSize={"16px"}>
            {dayjs(appointment.scheduled_at).format("HH:mm")}
          </Typography>
        </Box>
        <Box>
          <Typography fontSize={"16px"} fontWeight={600}>
            {appointment.client.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {appointment.items.map((item, index) => (
              <Box key={item.id} sx={{ display: "flex", gap: 1 }}>
                <Typography key={item.id} variant="body2" color="text.primary">
                  {item.pet.name}
                </Typography>
                {index < appointment.items.length - 1 && "•"}
              </Box>
            ))}
          </Box>
        </Box>

        {/* <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: p.light,
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <statusUI.icon size={16} />
          <Typography variant="body2">{statusUI.label}</Typography>
        </Box> */}
      </Box>
    </CustomCard>
  );
};

export default AppointmentListItem;
