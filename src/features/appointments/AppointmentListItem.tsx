import CustomCard from "../../components/Card/CustomCard";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

import type { Appointment } from "./types";
import theme from "../../theme";
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor";
import { getServiceIcons } from "../../utils/getServiceIcons";
import { useState } from "react";
import AppointmentServiceList from "./AppointmentServiceList";
import { Info } from "lucide-react";
import { AppointmentStatusChip } from "./AppointmentStatusChip";
import AppointmentObservationList from "./AppointmentObservationList";

type Props = {
  appointment: Appointment;
  openDetails: (appointment: Appointment) => void;
};
const AppointmentListItem = ({ appointment, openDetails }: Props) => {
  const statusUI = getAppointmentStatusUI(appointment.status);
  const p = theme.palette[statusUI.palette];
  const allServiceNames = appointment.items.flatMap((item) =>
    item.services.map((service) => service.name),
  );
  const hasPetNotes = appointment.items.some(
    (item) => item.pet?.notes && item.pet.notes.trim() !== "",
  );
  const hasAnyNotes = hasPetNotes || (appointment.notes && appointment.notes.trim() !== "");
  const icons = getServiceIcons(allServiceNames);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [obsAnchorEl, setObsAnchorEl] = useState<null | HTMLElement>(null);
  const openObs = Boolean(obsAnchorEl);
  const handleObsClick = (
    event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => {
    event.stopPropagation();
    setObsAnchorEl(event.currentTarget);
  };
  const handleObsClose = () => {
    setObsAnchorEl(null);
  };
  return (
    <>
      <CustomCard
        key={appointment.id}
      sx={{
        px: 2,
        py: 1,
        borderLeft: "5px solid",
        borderLeftColor: p.main,
        minWidth: 700,
        opacity: appointment.status == "canceled" ? 0.5 : 1,
        cursor: "pointer",
      }}
      onClick={() => {
        if (open) return;
        openDetails(appointment);
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
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={"16px"} fontWeight={600}>
            {appointment.client.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {appointment.items.map((item, index) => (
              <Box key={item.id} sx={{ display: "flex", gap: 1,alignItems: "center"  }}>
                <Typography key={item.id} variant="body2" color="text.primary">
                  {item.pet.name}
                </Typography>
                {index < appointment.items.length - 1 && "•"}
              </Box>
            ))}
            {hasAnyNotes && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  cursor: "pointer",
                  p: 0.5,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(233, 30, 99, 0.1)" },
                }}
                onClick={handleObsClick}
              >
                <Info size={14} color={theme.palette.error.main} />
                <Typography variant="body2" color="error.main">
                  Possui observações
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <AppointmentStatusChip status={appointment.status} />
        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: 96,
            flexShrink: 0,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(e);
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              "&:hover": { backgroundColor: "secondary.main" },
            }}
          >
            {icons.map((icon, index) => (
              <Box sx={{ display: "flex", alignItems: "center" }} key={index}>
                {icon}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </CustomCard>
    <AppointmentServiceList
      open={open}
      anchorEl={anchorEl}
      handleClose={handleClose}
      appointment={appointment}
    />
    <AppointmentObservationList
      open={openObs}
      anchorEl={obsAnchorEl}
      handleClose={handleObsClose}
      appointment={appointment}
    />
    </>
  );
};

export default AppointmentListItem;
