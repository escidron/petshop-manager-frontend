import { Box, Typography, Button as MuiButton } from "@mui/material";
import dayjs from "dayjs";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../../components/Button/Button";

interface Props {
  qrCode: string;
  qrCodeUrl?: string;
  expiresAt: string;
  onClose: () => void;
}

const PixQrCode = ({ qrCode, expiresAt, onClose }: Props) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode);
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h6" mb={1}>
        Pague com PIX
      </Typography>
      <Typography variant="body2" color="text.primary" mb={2}>
        Escaneie o QR Code ou copie o código abaixo. Expira em{" "}
        {dayjs(expiresAt).format("DD/MM/YYYY HH:mm")}.
      </Typography>

      {qrCode && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <QRCodeSVG value={qrCode} size={200} />
        </Box>
      )}

      <Box
        sx={{
          bgcolor: "grey.100",
          borderRadius: 2,
          p: 1.5,
          mb: 2,
          wordBreak: "break-all",
          fontSize: 12,
          fontFamily: "monospace",
          textAlign: "left",
        }}
      >
        {qrCode}
      </Box>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button onClick={handleCopy}>Copiar código PIX</Button>
        <MuiButton variant="text" onClick={onClose}>Fechar</MuiButton>
      </Box>
    </Box>
  );
};

export default PixQrCode;
