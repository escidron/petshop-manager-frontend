import { Box, Typography, Chip, IconButton, alpha } from "@mui/material";
import { ArrowLeft, X } from "lucide-react";
import type { Pet } from "../../pets/types";

interface ClientInfo {
  id: number;
  name: string;
}

interface POSSessionHeaderProps {
  client: ClientInfo;
  clientPets: Pet[];
  onBack: () => void;
}

export default function POSSessionHeader({
  client,
  clientPets,
  onBack,
}: POSSessionHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: "12px 12px 0 0",
        flexShrink: 0,
      }}
    >
      {/* Back button */}
      <IconButton
        onClick={onBack}
        size="small"
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          height: "auto",
          color: "text.primary",
          "&:hover": { color: "text.primary", bgcolor: "action.selected" },
        }}
      >
        <ArrowLeft size={16} />
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
          Trocar
        </Typography>
      </IconButton>

      {/* Client info */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}
        >
          {client.name}
        </Typography>

        {clientPets.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
            {clientPets.map((pet) => (
              <Chip
                key={pet.id}
                label={pet.name}
                size="small"
                sx={{
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* End session button */}
      <IconButton
        onClick={onBack}
        size="small"
        sx={{
          color: "text.disabled",
          "&:hover": {
            color: "error.main",
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
          },
        }}
      >
        <X size={18} />
      </IconButton>
    </Box>
  );
}
