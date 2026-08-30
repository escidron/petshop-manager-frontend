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
          margin: "0 auto",
          mt: { xs: 1.5, sm: 2 },
          mb: { xs: 1.5, sm: 2 },
          width: "100%",
          maxWidth: 1400,
          display: "flex",
          flexDirection: { xs: "row", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 2 },
          py: { xs: 0.75, sm: 1.25 },
          borderRadius: { xs: 2, sm: 3 },
          background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
          border: "1px solid #A7F3D0",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.06)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#10B981",
              color: "white",
              borderRadius: "50%",
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              minWidth: { xs: 28, sm: 32 },
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={16} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#065F46", fontSize: { xs: "0.78rem", sm: "0.875rem" }, lineHeight: 1.2 }}
              noWrap
            >
              Confirme seu endereço de e-mail
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#047857", display: "block", fontSize: { xs: "0.68rem", sm: "0.8rem" }, mt: 0.1 }}
              noWrap
            >
              Código enviado para <strong>{user.email}</strong>
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="small"
          onClick={() => setModalOpen(true)}
          endIcon={<ArrowRight size={13} />}
          sx={{
            py: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.25, sm: 2 },
            fontSize: { xs: "0.72rem", sm: "0.8rem" },
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            bgcolor: "#059669",
            color: "white",
            boxShadow: "none",
            flexShrink: 0,
            whiteSpace: "nowrap",
            "&:hover": {
              bgcolor: "#047857",
              boxShadow: "0 2px 6px rgba(4, 120, 87, 0.2)",
            },
          }}
        >
          Verificar
        </Button>
      </Box>

      <EmailVerificationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
