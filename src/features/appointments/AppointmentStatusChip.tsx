import { Box, Typography, useTheme } from "@mui/material"
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor"
import type { AppointmentStatus } from "./types"

type Props = {
  status: AppointmentStatus
  size?: "small" | "medium"
}

export function AppointmentStatusChip({ status, size = "small" }: Props) {
  const theme = useTheme()

  const statusUI = getAppointmentStatusUI(status)
  const palette = theme.palette[statusUI.palette]

  const isSmall = size === "small"

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: palette.light,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.5 : 0.75,
        borderRadius: 1,
        color: "text.secondary",
      }}
    >
      <statusUI.icon size={isSmall ? 12 : 16} />
      <Typography
        fontSize={isSmall ? "12px" : "14px"}
        fontWeight={500}
        color="text.secondary"
      >
        {statusUI.label}
      </Typography>
    </Box>
  )
}
