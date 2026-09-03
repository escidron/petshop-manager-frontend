import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  Checkbox,
  Chip,
  Slide,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { ArrowLeft, Search, X, Plus } from "lucide-react";
import { Button } from "../../../components/Button/Button";
import type { Service } from "../../tenant_services/types";
import type { Pet } from "../../pets/types";
import { getServicesForPet } from "../../../utils/serviceMatcher";
import { formatPrice, formatServiceLabel } from "../../../utils/formatServiceLabel";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  onClose: () => void;
  pet?: Pet;
  services?: Service[];
  initialSelectedServiceIds?: number[];
  onConfirm: (serviceIds: number[]) => void;
  packageCreditsByServiceId?: Map<number, number>;
  onCreateService?: () => void;
};

export default function ServicePickerDrawer({
  open,
  onClose,
  pet,
  services = [],
  initialSelectedServiceIds = [],
  onConfirm,
  packageCreditsByServiceId = new Map(),
  onCreateService,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedServiceIds);
  const [search, setSearch] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedServiceIds);
      setSearch("");
    }
  }, [open, initialSelectedServiceIds]);

  const sortedAndFilteredServices = useMemo(() => {
    let list: Service[] = [];
    if (showAllServices || !pet) {
      list = [...services];
    } else {
      list = getServicesForPet(services, pet);
    }

    if (!search.trim()) return list;
    const term = search.toLowerCase().trim();

    return list.filter((s) => {
      const matchName = s.name.toLowerCase().includes(term);
      const matchSize = s.size ? s.size.toLowerCase().includes(term) : false;
      const matchCoat = s.coat_type ? s.coat_type.toLowerCase().includes(term) : false;
      return matchName || matchSize || matchCoat;
    });
  }, [services, pet, showAllServices, search]);

  const toggleService = (serviceId: number) => {
    setSelectedIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const subtotalCents = useMemo(() => {
    return selectedIds.reduce((acc, id) => {
      const s = services.find((serv) => serv.id === id);
      if (!s) return acc;
      const isPackage = (packageCreditsByServiceId.get(id) || 0) > 0;
      return acc + (isPackage ? 0 : s.price_cents);
    }, 0);
  }, [selectedIds, services, packageCreditsByServiceId]);

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
            Serviços para {pet?.name || "Pet"}
          </Typography>
          {pet?.breed && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {pet.breed} {pet.size ? `• Porte ${pet.size}` : ""}
            </Typography>
          )}
        </Box>
        {onCreateService && (
          <Button
            variant="text"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={() => {
              onClose();
              onCreateService();
            }}
            sx={{ minWidth: "auto", px: 1, fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            Novo
          </Button>
        )}
      </Box>

      {/* Search Input Box */}
      <Box sx={{ p: 2, pb: 1, bgcolor: "#FFFFFF", borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar serviço..."
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

        {pet && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
            <Typography
              variant="caption"
              onClick={() => setShowAllServices(!showAllServices)}
              sx={{
                cursor: "pointer",
                color: showAllServices ? "primary.main" : "text.secondary",
                fontWeight: 600,
                textDecoration: "underline",
                userSelect: "none",
              }}
            >
              {showAllServices ? "✕ Mostrar apenas compatíveis" : "+ Ver todos os serviços"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sortedAndFilteredServices.length} disponíveis
            </Typography>
          </Box>
        )}
      </Box>

      {/* Services List */}
      <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", p: 1.5 }}>
        {sortedAndFilteredServices.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              Nenhum serviço disponível
            </Typography>
            {onCreateService && (
              <Button
                variant="outlined"
                startIcon={<Plus size={18} />}
                onClick={() => {
                  onClose();
                  onCreateService();
                }}
                sx={{ mt: 2 }}
              >
                Cadastrar Novo Serviço
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sortedAndFilteredServices.map((service) => {
              const isSelected = selectedIds.includes(service.id);
              const remainingQty = packageCreditsByServiceId.get(service.id) || 0;
              const isPackage = remainingQty > 0;

              return (
                <ListItemButton
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  sx={{
                    bgcolor: isSelected ? "rgba(49, 52, 133, 0.08)" : "#FFFFFF",
                    border: "1.5px solid",
                    borderColor: isSelected ? "primary.main" : "#E2E8F0",
                    borderRadius: 2.5,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                    <Checkbox
                      checked={isSelected}
                      disableRipple
                      sx={{ p: 0, color: isSelected ? "primary.main" : "#94A3B8" }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? "primary.main" : "text.primary",
                          fontSize: "0.92rem",
                        }}
                      >
                        {formatServiceLabel(service)}
                      </Typography>
                      {service.duration_minutes && (
                        <Typography variant="caption" color="text.secondary">
                          {service.duration_minutes} min
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {isPackage ? (
                    <Chip
                      label={`Pacote (${remainingQty}x)`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{
                        height: 24,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: isSelected ? "primary.main" : "text.primary",
                        flexShrink: 0,
                      }}
                    >
                      {formatPrice(service.price_cents)}
                    </Typography>
                  )}
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
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length} {selectedIds.length === 1 ? "selecionado" : "selecionados"}
          </Typography>
          <Typography variant="body1" fontWeight={800} color="primary.main">
            Total: {formatPrice(subtotalCents)}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            onConfirm(selectedIds);
            onClose();
          }}
          sx={{
            minHeight: 48,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "0 4px 12px rgba(49, 52, 133, 0.25)",
          }}
        >
          Confirmar Serviços
        </Button>
      </Box>
    </Dialog>
  );
}
