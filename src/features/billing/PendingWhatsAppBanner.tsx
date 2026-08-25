import { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { WHATSAPP_PACKAGES } from "./BillingAddonsSection";
import CheckoutStepper from "./CheckoutStepper";
import { listPaymentMethods } from "../../api/services/subscriptions";
import type { PaymentMethod } from "./types";

export default function PendingWhatsAppBanner() {
  const { tenant, checkAuth } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);

  const pkgStatus = tenant?.subscription?.whatsapp_package_status;
  const pkgId = tenant?.subscription?.whatsapp_package_id;

  useEffect(() => {
    if (pkgStatus === "pending_payment") {
      listPaymentMethods().then(setSavedCards).catch(() => {});
    }
  }, [pkgStatus]);

  // Don't show if no pending package
  if (pkgStatus !== "pending_payment" || !pkgId) return null;

  const normalizedId = pkgId.startsWith("pkg_") ? pkgId : `pkg_${pkgId}`;
  const pkg = WHATSAPP_PACKAGES.find((p) => p.id === normalizedId) || WHATSAPP_PACKAGES[0];

  return (
    <>
      <Box
        sx={{
          margin: "0 auto 1.25rem auto",
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
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          border: "1px solid #86EFAC",
          boxShadow: "0 4px 12px rgba(37, 211, 102, 0.08)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(37, 211, 102, 0.12)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#25D366",
              color: "white",
              borderRadius: "50%",
              width: 32,
              height: 32,
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(37, 211, 102, 0.35)",
            }}
          >
            <MessageCircle size={18} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#14532D", lineHeight: 1.2 }}
            >
              Ative seu pacote de mensagens WhatsApp
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#166534", mt: 0.5, fontSize: "0.85rem" }}
            >
              Você selecionou o <strong>Pacote de {pkg.count} Mensagens ({pkg.price}/mês)</strong> no cadastro.
              Ative seu pacote para liberar o envio automático de lembretes e confirmações.
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
            bgcolor: "#16A34A",
            color: "white",
            boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
            flexShrink: 0,
            alignSelf: { xs: "stretch", md: "auto" },
            textAlign: "center",
            "&:hover": {
              bgcolor: "#15803D",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.35)",
            },
          }}
        >
          Ativar Pacote ({pkg.price})
        </Button>
      </Box>

      <CheckoutStepper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        packageCode={normalizedId}
        savedCards={savedCards}
        tenantDocument={tenant?.document}
        onSuccess={async () => {
          await checkAuth();
          setModalOpen(false);
        }}
      />
    </>
  );
}
