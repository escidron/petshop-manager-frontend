import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { Star, StarOff, Trash2 } from "lucide-react";
import type { PaymentMethod } from "./types";
import CardDeleteModal from "./CardDeleteModal";

const BRAND_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  visa:       { label: "VISA",   color: "#1A1F71", bg: "#DDE1F5" },
  mastercard: { label: "MASTER", color: "#A50808", bg: "#FAD7D7" },
  amex:       { label: "AMEX",   color: "#005A8E", bg: "#C8E6F7" },
  elo:        { label: "ELO",    color: "#B86000", bg: "#FDEAC8" },
  hipercard:  { label: "HIPER",  color: "#8B0000", bg: "#FAD7D7" },
};

const getBrand = (brand: string) =>
  BRAND_CONFIG[brand.toLowerCase()] ?? { label: brand.toUpperCase(), color: "#313485", bg: "#E0E0F0" };

interface Props {
  card: PaymentMethod;
  onSetDefault: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function PaymentMethodCard({ card, onSetDefault, onRemove }: Props) {
  const [settingDefault, setSettingDefault] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const brand = getBrand(card.brand);

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try { await onSetDefault(card.id); } finally { setSettingDefault(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(card.id);
      setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: "12px 16px",
        borderRadius: 3,
        border: card.is_default
          ? "1.5px solid #313485"
          : "1px solid #C5C7D4",
        bgcolor: card.is_default ? "#F0F0FA" : "#FAFAFA",
        transition: "border-color 0.2s, background-color 0.2s",
      }}
    >
      {/* Brand badge */}
      <Box
        sx={{
          minWidth: 54,
          height: 34,
          borderRadius: 1.5,
          bgcolor: brand.bg,
          border: `1px solid ${brand.color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            color: brand.color,
            letterSpacing: 0.5,
            fontSize: "0.62rem",
            lineHeight: 1,
          }}
        >
          {brand.label}
        </Typography>
      </Box>

      {/* Card info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ color: "#1A1A2E" }}
          >
            •••• •••• •••• {card.last4}
          </Typography>
          {card.is_default && (
            <Chip
              label="Padrão"
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 700,
                bgcolor: "#313485",
                color: "#fff",
                "& .MuiChip-label": { px: 0.8 },
              }}
            />
          )}
        </Stack>
        <Typography sx={{ fontSize: "0.72rem", color: "#555570", mt: 0.2 }}>
          Expira {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
        </Typography>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={0.5} flexShrink={0}>
        {!card.is_default && (
          <Tooltip title="Tornar padrão">
            <span>
              <IconButton
                size="small"
                onClick={handleSetDefault}
                disabled={settingDefault || removing}
                sx={{
                  color: "#313485",
                  bgcolor: "rgba(49,52,133,0.07)",
                  "&:hover": { bgcolor: "rgba(49,52,133,0.15)" },
                  width: 30,
                  height: 30,
                }}
              >
                {settingDefault
                  ? <CircularProgress size={14} sx={{ color: "#313485" }} />
                  : <StarOff size={15} />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        {card.is_default && (
          <Tooltip title="Cartão padrão">
            <Box
              sx={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Star size={15} color="#313485" fill="#313485" />
            </Box>
          </Tooltip>
        )}
        <Tooltip title="Remover cartão">
          <span>
            <IconButton
              size="small"
              onClick={() => setConfirmOpen(true)}
              disabled={removing || settingDefault}
              sx={{
                color: "#C0392B",
                bgcolor: "rgba(192,57,43,0.07)",
                "&:hover": { bgcolor: "rgba(192,57,43,0.15)" },
                width: 30,
                height: 30,
              }}
            >
              {removing
                ? <CircularProgress size={14} sx={{ color: "#C0392B" }} />
                : <Trash2 size={15} />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <CardDeleteModal
        open={confirmOpen}
        card={card}
        loading={removing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRemove}
      />
    </Box>
  );
}
