import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import EmailVerificationModal from "./EmailVerificationModal";

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Don't show if user is not logged in or is already verified
  if (!user || user.email_verified) return null;

  return (
    <>
      <Box
        sx={{
          margin: "0 auto 0.75rem auto",
          width: "100%",
          maxWidth: 1400,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          px: 3,
          py: 2,
          borderRadius: 3,
          background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
          border: "1px solid #A7F3D0",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.06)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(16, 185, 129, 0.1)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#10B981",
              color: "white",
              borderRadius: "50%",
              width: 32,
              height: 32,
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={18} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#065F46", lineHeight: 1.2 }}
            >
              Confirme seu endereço de e-mail
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#047857", mt: 0.5, fontSize: "0.85rem" }}
            >
              Enviamos um código de verificação para <strong>{user.email}</strong>. Confirme sua conta para garantir segurança total.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="small"
          onClick={() => setModalOpen(true)}
          endIcon={<ArrowRight size={14} />}
          sx={{
            py: 0.8,
            px: 2,
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            bgcolor: "#059669",
            color: "white",
            boxShadow: "none",
            flexShrink: 0,
            alignSelf: { xs: "stretch", md: "auto" },
            textAlign: "center",
            "&:hover": {
              bgcolor: "#047857",
              boxShadow: "0 2px 6px rgba(4, 120, 87, 0.2)",
            },
          }}
        >
          Verificar Conta
        </Button>
      </Box>

      <EmailVerificationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
