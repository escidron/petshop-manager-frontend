import CustomCard from "../../components/Card/CustomCard";
import { Box, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";

import type { Appointment } from "./types";
import theme from "../../theme";
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor";
import { getServiceIcons } from "../../utils/getServiceIcons";
import { useState } from "react";
import AppointmentServiceList from "./AppointmentServiceList";
import { Info, ShoppingBag, Repeat } from "lucide-react";
import { AppointmentStatusChip } from "./AppointmentStatusChip";
import AppointmentObservationList from "./AppointmentObservationList";


type Props = {
  appointment: Appointment;
  openDetails: (appointment: Appointment) => void;
};
const AppointmentListItem = ({ appointment, openDetails }: Props) => {
  const statusUI = getAppointmentStatusUI(appointment.status);
  const p = theme.palette[statusUI.palette];
  const cardBorderColor = statusUI.color || p.main;
  const allServiceNames = appointment.items.flatMap((item) =>
    item.services.map((service) => service.name),
  );

  const isRecurring = !!appointment.recurrence_id;

  const hasPetNotes = appointment.items.some(
    (item) => item.pet?.notes && item.pet.notes.trim() !== "",
  );
  const hasPackage = appointment.is_fully_package_covered || appointment.items.some(item => 
    item.services.some(s => s.is_package_covered)
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
        px: { xs: 1.25, sm: 2 },
        py: { xs: 0.85, sm: 1 },
        border: "1px solid",
        borderColor: "divider",
        borderLeft: "5px solid",
        borderLeftColor: cardBorderColor,
        width: "100%",
        opacity: appointment.status == "canceled" ? 0.5 : 1,
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: cardBorderColor,
          borderLeftColor: cardBorderColor,
        },
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
          gap: { xs: 1.25, sm: 2, md: 3, lg: 3, xl: 6 },
          flexWrap: "nowrap",
        }}
      >
        {/* Time Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: 42, sm: 50 },
            flexShrink: 0,
          }}
        >
          <Typography fontWeight={700} fontSize={{ xs: "0.85rem", sm: "0.95rem" }} lineHeight={1}>
            {dayjs(appointment.scheduled_at).format("HH:mm")}
          </Typography>
          {endTime && (
            <>
              <Box
                sx={{
                  width: "1.5px",
                  height: "6px",
                  bgcolor: "divider",
                  my: "2px",
                  borderRadius: 1,
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: "0.72rem", sm: "0.8rem" },
                  color: "text.primary",
                  opacity: 0.65,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {endTime.format("HH:mm")}
              </Typography>
            </>
          )}
        </Box>

        {/* Client & Pets Info */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <Typography
            fontSize={{ xs: "0.84rem", sm: "0.95rem" }}
            fontWeight={500}
            color="text.primary"
            noWrap
            sx={{
              maxWidth: { xs: "100%", sm: "240px", md: "340px" },
              lineHeight: 1.2,
              opacity: 0.7,
            }}
          >
            {appointment.client.name}
          </Typography>

          <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "nowrap", overflow: "hidden", mt: 0.25 }}>
            {appointment.items.map((item, index) => (
              <Box key={item.id} sx={{ display: "flex", gap: 0.5, alignItems: "center", minWidth: 0, flexShrink: index === 0 ? 0 : 1 }}>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight={700}
                  noWrap
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    maxWidth: { xs: "110px", sm: "180px" },
                  }}
                >
                  {item.pet.name}
                </Typography>
                {index < appointment.items.length - 1 && (
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.75rem" }}>
                    •
                  </Typography>
                )}
              </Box>
            ))}
            {hasAnyNotes && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.35,
                  alignItems: "center",
                  cursor: "pointer",
                  px: 0.5,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: "rgba(233, 30, 99, 0.08)",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "rgba(233, 30, 99, 0.15)" },
                }}
                onClick={handleObsClick}
              >
                <Info size={11} color={theme.palette.error.main} />
                <Typography variant="caption" color="error.main" fontWeight={700} sx={{ fontSize: "0.65rem" }}>
                  Obs
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Status Chip (Desktop only) & Service Icons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              justifyContent: "flex-end",
              minWidth: 120,
              flexShrink: 0,
            }}
          >
            <AppointmentStatusChip status={appointment.status} size="small" />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 0.6,
              alignItems: "center",
              justifyContent: "flex-end",
              width: { xs: "auto", sm: 110 },
              minWidth: { xs: "auto", sm: 110 },
              cursor: "pointer",
              borderRadius: 1,
              px: { xs: 0.75, sm: 1 },
              py: 0.5,
              flexShrink: 0,
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: "grey.100" },
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
            {hasPackage && (
              <Tooltip title="Coberto por Pacote" arrow placement="top">
                <Box sx={{ display: "flex", alignItems: "center", opacity: 0.85, color: "success.main" }}>
                  <ShoppingBag size={18} />
                </Box>
              </Tooltip>
            )}
            {isRecurring && (
              <Tooltip title="Agendamento Recorrente" arrow placement="top">
                <Box sx={{ display: "flex", alignItems: "center", opacity: 0.9, color: "#7c3aed" }}>
                  <Repeat size={17} strokeWidth={2.2} />
                </Box>
              </Tooltip>
            )}
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
