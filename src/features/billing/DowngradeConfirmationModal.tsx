import React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { X, CalendarClock, ArrowRight } from "lucide-react";
import { Button } from "../../components/Button/Button";

interface DowngradeConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentPackage: {
    name: string;
    messages: number;
    price: string;
  };
  targetPackage: {
    name: string;
    messages: number;
    price: string;
  };
  renewalDate: string;
  paymentMethod?: string | null;
  loading?: boolean;
}

export const DowngradeConfirmationModal: React.FC<DowngradeConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  currentPackage,
  targetPackage,
  renewalDate,
  paymentMethod,
  loading = false,
}) => {
  const methodLabel =
    paymentMethod === "card" || paymentMethod === "credit_card"
      ? "no seu cartão cadastrado"
      : "via PIX";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 0,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#F8FAFC",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "#FEF3C7",
              border: "1px solid #FDE68A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
            }}
          >
            <CalendarClock size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ fontSize: "1.1rem", lineHeight: 1.2 }}>
              Agendar Alteração de Pacote
            </Typography>
            <Typography variant="caption" color="#64748B" fontWeight={500}>
              Redução agendada para a próxima fatura
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: "#64748B" }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          {/* De -> Para Card */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderRadius: 3,
              bgcolor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              gap: 1.5,
            }}
          >
            {/* Atual */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>
                Pacote Atual
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                {currentPackage.messages.toLocaleString("pt-BR")} msgs
              </Typography>
              <Typography variant="caption" color="#475569" fontWeight={600} display="block">
                {currentPackage.price}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748B",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                flexShrink: 0,
              }}
            >
              <ArrowRight size={16} />
            </Box>

            {/* Novo */}
            <Box sx={{ flex: 1, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>
                Novo Pacote
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#16A34A">
                {targetPackage.messages.toLocaleString("pt-BR")} msgs
              </Typography>
              <Typography variant="caption" color="#166534" fontWeight={700} display="block">
                {targetPackage.price}
              </Typography>
            </Box>
          </Box>

          {/* Explicações Didáticas Transparentes */}
          <Box
            sx={{
              borderRadius: 3,
              border: "1.5px solid #DCFCE7",
              bgcolor: "#F0FDF4",
              p: 2.2,
            }}
          >
            <Stack spacing={1.5}>
              {/* Ponto 1: Cobrança hoje zero */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#16A34A",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.1,
                  }}
                >
                  1
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#14532D", fontSize: "0.86rem", fontWeight: 700 }}>
                    Você não paga nada hoje (R$ 0,00)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#166534", fontSize: "0.8rem", lineHeight: 1.4, display: "block" }}>
                    Como você já pagou pelo seu pacote de {currentPackage.messages.toLocaleString("pt-BR")} mensagens neste mês, nenhuma cobrança é gerada agora.
                  </Typography>
                </Box>
              </Box>

              {/* Ponto 2: Cota mantida até renovação */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#3B82F6",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.1,
                  }}
                >
                  2
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#1E3A8A", fontSize: "0.86rem", fontWeight: 700 }}>
                    Seu saldo de {currentPackage.messages.toLocaleString("pt-BR")} mensagens continua ativo
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#1E40AF", fontSize: "0.8rem", lineHeight: 1.4, display: "block" }}>
                    Você pode continuar utilizando suas mensagens atuais normalmente até o término do ciclo em <strong>{renewalDate}</strong>.
                  </Typography>
                </Box>
              </Box>

              {/* Ponto 3: Cobrança reduzida a partir da próxima renovação */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#6366F1",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    mt: 0.1,
                  }}
                >
                  3
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: "#312E81", fontSize: "0.86rem", fontWeight: 700 }}>
                    Novo valor na renovação em {renewalDate}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#3730A3", fontSize: "0.8rem", lineHeight: 1.4, display: "block" }}>
                    A partir de <strong>{renewalDate}</strong>, sua assinatura será renovada com a cota de <strong>{targetPackage.messages.toLocaleString("pt-BR")} mensagens</strong> no valor reduzido de <strong>{targetPackage.price}</strong> ({methodLabel}).
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
              sx={{ flex: 1, py: 1.4, fontWeight: 700, borderRadius: 2.5, textTransform: "none" }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={loading}
              sx={{
                flex: 1.8,
                py: 1.4,
                fontWeight: 800,
                borderRadius: 2.5,
                bgcolor: "#16A34A",
                color: "white",
                textTransform: "none",
                "&:hover": { bgcolor: "#15803D" },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "white" }} />
              ) : (
                `Confirmar Alteração para ${renewalDate}`
              )}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default DowngradeConfirmationModal;
