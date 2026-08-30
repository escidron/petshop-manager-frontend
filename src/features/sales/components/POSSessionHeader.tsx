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
  rightAction?: React.ReactNode;
}

export default function POSSessionHeader({
  client,
  clientPets,
  onBack,
  rightAction,
}: POSSessionHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: { xs: 0.75, sm: 2 },
        px: { xs: 1, sm: 2.5 },
        py: { xs: 1, sm: 1.5 },
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      {/* Back / Trocar button */}
      <IconButton
        onClick={onBack}
        size="small"
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          gap: 0.5,
          px: { xs: 1, sm: 1.5 },
          py: 0.5,
          height: "auto",
          color: "text.primary",
          flexShrink: 0,
          "&:hover": { color: "text.primary", bgcolor: "action.selected" },
        }}
      >
        <ArrowLeft size={16} />
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
          Trocar
        </Typography>
      </IconButton>

      {/* Client info and pet chips */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.25 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 800, color: "primary.main", fontSize: { xs: "0.95rem", sm: "1.1rem" }, lineHeight: 1.2 }}
          noWrap
        >
          {client.name}
        </Typography>

        {clientPets.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", maxWidth: "100%" }}>
            {clientPets.map((pet) => (
              <Chip
                key={pet.id}
                label={pet.name}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Right Actions & End session button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {rightAction}
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            color: "text.disabled",
            flexShrink: 0,
            "&:hover": {
              color: "error.main",
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <X size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
