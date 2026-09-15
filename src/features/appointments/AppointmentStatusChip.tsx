import { Box, Typography, useTheme } from "@mui/material"
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor"
import type { AppointmentStatus } from "./types"

type Props = {
  status: AppointmentStatus
  size?: "small" | "medium"
}

// Cor Blue Grey 900 (#263238): grafite azulado profundo com excelente contraste e personalidade sem ser preto puro
const CHIP_TEXT_COLOR = "#263238";

export function AppointmentStatusChip({ status, size = "small" }: Props) {
  const theme = useTheme()

  const statusUI = getAppointmentStatusUI(status)
  const palette = theme.palette[statusUI.palette]

  const isSmall = size === "small"
  const chipBg = statusUI.bg ?? palette.light
  const chipTextColor = statusUI.textColor ?? CHIP_TEXT_COLOR

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: chipBg,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.5 : 0.75,
        borderRadius: 1,
        color: chipTextColor,
      }}
    >
      <statusUI.icon size={isSmall ? 12 : 16} color={chipTextColor} />
      <Typography
        fontSize={isSmall ? "12px" : "14px"}
        fontWeight={600}
        color={chipTextColor}
      >
        {statusUI.label}
      </Typography>
    </Box>
  )
}
