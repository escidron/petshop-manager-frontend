import {
  Dialog,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Slide,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../../../components/Button/Button";
import type { Pet } from "../../pets/types";
import type { Client } from "../../clients/types";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  onClose: () => void;
  client?: Client;
  availablePets?: Pet[];
  onSelectPet: (pet: Pet) => void;
  onCreatePet?: () => void;
};

export default function PetPickerDrawer({
  open,
  onClose,
  client,
  availablePets = [],
  onSelectPet,
  onCreatePet,
}: Props) {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      PaperProps={{
        sx: {
          bgcolor: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        <IconButton
          edge="start"
          onClick={onClose}
          sx={{ color: "text.primary" }}
          aria-label="Voltar"
        >
          <ArrowLeft size={22} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: "1.05rem" }}>
            Selecionar Pet
          </Typography>
          {client?.name && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              Cliente: {client.name}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Pet List */}
      <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", p: 2 }}>
        {availablePets.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Nenhum outro pet disponível para este cliente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Deseja cadastrar um novo pet agora?
            </Typography>
            {onCreatePet && (
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => {
                  onClose();
                  onCreatePet();
                }}
              >
                Cadastrar Novo Pet
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {availablePets.map((pet) => {
              const details = [pet.breed, pet.size ? `Porte ${pet.size}` : null]
                .filter(Boolean)
                .join(" • ");

              return (
                <ListItemButton
                  key={pet.id}
                  onClick={() => {
                    onSelectPet(pet);
                    onClose();
                  }}
                  sx={{
                    bgcolor: "#FFFFFF",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 2.5,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "#F8FAFC",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "rgba(49, 52, 133, 0.1)", color: "primary.main" }}>
                      🐾
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={700} color="text.primary">
                        {pet.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {details || "Sem raça informada"}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      {/* Sticky Bottom Bar */}
      <Box
        sx={{
          p: 2,
          pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
          bgcolor: "#FFFFFF",
          borderTop: "1px solid",
          borderColor: "divider",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Plus size={18} />}
          onClick={() => {
            onClose();
            onCreatePet?.();
          }}
          sx={{
            minHeight: 48,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          Cadastrar Novo Pet
        </Button>
      </Box>
    </Dialog>
  );
}
