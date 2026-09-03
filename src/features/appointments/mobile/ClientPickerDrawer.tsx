import { useState, useMemo } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  Avatar,
  Slide,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { ArrowLeft, Search, X, Check, Plus, User as UserIcon } from "lucide-react";
import type { Client } from "../../clients/types";
import type { Pet } from "../../pets/types";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  onClose: () => void;
  clients?: Client[];
  allPets?: Pet[];
  selectedClientId?: number;
  onSelectClient: (client: Client) => void;
  onCreateClient?: () => void;
};

export default function ClientPickerDrawer({
  open,
  onClose,
  clients = [],
  allPets = [],
  selectedClientId,
  onSelectClient,
  onCreateClient,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase().trim();

    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(term);
      const matchPhone = c.phone ? c.phone.replace(/\D/g, "").includes(term) : false;
      const clientPets = allPets.filter((p) => p.client_id === c.id);
      const matchPet = clientPets.some((p) => p.name.toLowerCase().includes(term));
      return matchName || matchPhone || matchPet;
    });
  }, [clients, allPets, search]);

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
          py: 1.25,
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
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: "1.05rem" }}>
          Selecionar Cliente
        </Typography>
        {onCreateClient && (
          <IconButton
            onClick={() => {
              onClose();
              onCreateClient();
            }}
            color="primary"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 0.75,
            }}
            title="Criar Novo Cliente"
          >
            <Plus size={20} />
          </IconButton>
        )}
      </Box>

      {/* Search Input Box */}
      <Box sx={{ p: 1.5, bgcolor: "#FFFFFF", borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="Buscar por nome ou pet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748B" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: 2,
                bgcolor: "#F1F5F9",
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "transparent" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
              },
            },
          }}
        />
      </Box>

      {/* Clients List */}
      <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", p: 1.5 }}>
        {filteredClients.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Nenhum cliente encontrado
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              const clientPets = allPets.filter((p) => p.client_id === client.id);

              return (
                <ListItemButton
                  key={client.id}
                  onClick={() => {
                    onSelectClient(client);
                    onClose();
                  }}
                  sx={{
                    bgcolor: isSelected ? "rgba(49, 52, 133, 0.08)" : "#FFFFFF",
                    border: "1.5px solid",
                    borderColor: isSelected ? "primary.main" : "#E2E8F0",
                    borderRadius: 2,
                    py: 0.9,
                    px: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    minHeight: 48,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: isSelected ? "rgba(49, 52, 133, 0.1)" : "#F8FAFC",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: "0.82rem",
                      bgcolor: isSelected ? "primary.main" : "#E2E8F0",
                      color: isSelected ? "#FFFFFF" : "#475569",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {client.name ? client.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.78rem",
                        display: "block",
                        lineHeight: 1.2,
                      }}
                      noWrap
                    >
                      {client.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: isSelected ? "primary.main" : "text.primary",
                        fontSize: "0.88rem",
                        lineHeight: 1.3,
                      }}
                      noWrap
                    >
                      🐾 {clientPets.length > 0 ? clientPets.map((p) => p.name).join(", ") : "Sem pets"}
                    </Typography>
                  </Box>
                  {isSelected && <Check size={18} color="#313485" />}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Dialog>
  );
}
