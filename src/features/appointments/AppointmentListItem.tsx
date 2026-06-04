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
  const totalDurationMinutes = appointment.items
    .flatMap((item) => item.services)
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);
  const endTime =
    totalDurationMinutes > 0
      ? dayjs(appointment.scheduled_at).add(totalDurationMinutes, "minute")
      : null;
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
        px: { xs: 1.5, sm: 2 },
        py: 1,
        borderLeft: "5px solid",
        borderLeftColor: p.main,
        width: "100%",
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
          alignItems: "center",
          gap: { xs: 1.5, sm: 2, md: 3, lg: 3, xl: 6 },
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}
      >
        {/* Time Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: { xs: 45, sm: 50 },
            order: 1,
          }}
        >
          <Typography fontWeight={700} fontSize={{ xs: "14px", sm: "15px" }} lineHeight={1}>
            {dayjs(appointment.scheduled_at).format("HH:mm")}
          </Typography>
          {endTime && (
            <>
              <Box
                sx={{
                  width: "1.5px",
                  height: "8px",
                  bgcolor: "divider",
                  my: "2px",
                  borderRadius: 1,
                }}
              />
              <Typography
                fontSize={{ xs: "12px", sm: "13px" }}
                color="text.secondary"
                fontWeight={500}
                lineHeight={1}
              >
                {endTime.format("HH:mm")}
              </Typography>
            </>
          )}
        </Box>

        {/* Client & Pet Info */}
        <Box sx={{ flex: 1, minWidth: { xs: "calc(100% - 70px)", sm: 0 }, order: { xs: 2, sm: 2 } }}>
          <Typography fontSize={{ xs: "15px", sm: "16px" }} fontWeight={600} noWrap>
            {appointment.client.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            {appointment.items.map((item, index) => (
              <Box key={item.id} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                  {item.pet.name}
                </Typography>
                {index < appointment.items.length - 1 && (
                  <Typography variant="body2" color="text.disabled">
                    •
                  </Typography>
                )}
              </Box>
            ))}
            {hasAnyNotes && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  alignItems: "center",
                  cursor: "pointer",
                  p: 0.25,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "rgba(233, 30, 99, 0.05)" },
                }}
                onClick={handleObsClick}
              >
                <Info size={12} color={theme.palette.error.main} />
                <Typography variant="caption" color="error.main" fontWeight={600}>
                  Obs
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Status and Icons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            order: { xs: 3, sm: 3 },
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
            mt: { xs: 1, sm: 0 },
            pt: { xs: 1, sm: 0 },
            borderTop: { xs: "1px solid", sm: "none" },
            borderColor: "divider",
          }}
        >
          <AppointmentStatusChip status={appointment.status} size="small" />
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              cursor: "pointer",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              "&:hover": { backgroundColor: "secondary.main" },
              ml: { sm: 1 },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
          >
            {icons.map((icon, index) => (
              <Box sx={{ display: "flex", alignItems: "center", opacity: 0.7 }} key={index}>
                {icon}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </CustomCard>
    <AppointmentServiceList
      open={open}
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
