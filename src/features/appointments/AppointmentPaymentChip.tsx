import { Box, Tooltip, useTheme } from "@mui/material";
import { AlertTriangle } from "lucide-react";

type Props = {
  isPaid?: boolean;
  isFullyPackageCovered?: boolean;
  size?: "small" | "medium";
};

export function AppointmentPaymentChip({
  isPaid,
  isFullyPackageCovered,
  size = "small",
}: Props) {
  const theme = useTheme();
  const isSettled = Boolean(isPaid || isFullyPackageCovered);
  const isSmall = size === "small";

  // Se já foi pago ou coberto por pacote, NÃO exibe o indicador.
  if (isSettled) {
    return null;
  }

  const warningColor = theme.palette.warning.main;
  const warningText = theme.palette.warning.dark;

  return (
    <Tooltip
      title="Pagamento Pendente"
      arrow
      placement="top"
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: warningColor,
          flexShrink: 0,
          cursor: "default",
          transition: "transform 0.15s ease, color 0.15s ease",
          "&:hover": {
            color: warningText,
            transform: "scale(1.15)",
          },
        }}
      >
        <AlertTriangle
          size={isSmall ? 24 : 28}
          strokeWidth={2.4}
        />
      </Box>
    </Tooltip>
  );
}
