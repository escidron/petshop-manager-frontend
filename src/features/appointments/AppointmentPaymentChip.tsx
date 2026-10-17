import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import { AlertCircle } from "lucide-react";

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

  // Se já foi pago ou coberto por pacote, NÃO exibe chip.
  // O card fica limpo e o atendente bate o olho e vê apenas o que falta cobrar.
  if (isSettled) {
    return null;
  }

  const warningColor = theme.palette.warning.main;
  const warningText = theme.palette.warning.dark;

  return (
    <Tooltip
      title="Serviço finalizado pendente de cobrança no caixa"
      arrow
      placement="top"
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "#FFFFFF",
          border: "1.5px solid",
          borderColor: warningColor,
          px: isSmall ? 1 : 1.25,
          py: isSmall ? "2px" : "4px",
          borderRadius: 1,
          color: warningText,
          flexShrink: 0,
          cursor: "default",
          boxShadow: "0 1px 2px rgba(245, 158, 11, 0.08)",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: "#FFFBEB",
            borderColor: warningText,
          },
        }}
      >
        <AlertCircle
          size={isSmall ? 13 : 16}
          strokeWidth={2.4}
          color={warningColor}
        />
        <Typography
          fontSize={isSmall ? "12px" : "14px"}
          fontWeight={700}
          color={warningText}
          lineHeight={1.2}
        >
          A Pagar
        </Typography>
      </Box>
    </Tooltip>
  );
}
