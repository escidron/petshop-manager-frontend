import {
  Box,
  Typography,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  IconButton,
} from "@mui/material";
import { Dog, X } from "lucide-react";
import { Button } from "../../../components/Button/Button";
import type { Pet } from "../../pets/types";
import type { Service } from "../../tenant_services/types";
import { isServiceCompatibleWithPet } from "../../../utils/serviceMatcher";

interface PendingPackageItem {
  id: number;
  name: string;
  price_cents?: number;
  quantity?: number;
}

interface POSPackagePetDialogProps {
  open: boolean;
  pendingPackageItem: PendingPackageItem | null;
  clientPets: Pet[];
  packages: Array<{ id: number; items: Array<{ service_id?: number | null; product_id?: number | null }> }>;
  services: Service[];
  pendingPackagePetIds: number[];
  onTogglePet: (petId: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function POSPackagePetDialog({
  open,
  pendingPackageItem,
  clientPets,
  packages,
  services,
  pendingPackagePetIds,
  onTogglePet,
  onConfirm,
  onCancel,
}: POSPackagePetDialogProps) {
  const getIncompatibleServicesForPet = (pet: Pet): Service[] => {
    if (!pendingPackageItem) return [];
    const pkgDef = packages.find((p) => p.id === pendingPackageItem.id);
    if (!pkgDef) return [];

    const pkgServices = pkgDef.items
      .filter((item) => item.service_id)
      .map((item) => services.find((s) => s.id === item.service_id))
      .filter(Boolean) as Service[];

    return pkgServices.filter((s) => !isServiceCompatibleWithPet(s, pet));
  };

  const activePets = clientPets.filter((p) => !p.is_deceased);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          py: 1.5,
          px: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Dog size={18} />
          <Typography variant="subtitle1" fontWeight={700}>
            Para quais pets é este pacote?
          </Typography>
        </Box>
        <IconButton size="small" onClick={onCancel} sx={{ color: "white" }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {activePets.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.primary" variant="body2">
              Nenhum pet ativo encontrado para este cliente. Por favor, cadastre
              um pet antes de vender o pacote.
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {activePets.map((pet) => {
              const incompatible = getIncompatibleServicesForPet(pet);
              const hasIncompatible = incompatible.length > 0;
              const isSelected = pendingPackagePetIds.includes(pet.id);

              return (
                <ListItem
                  key={pet.id}
                  onClick={() => onTogglePet(pet.id)}
                  sx={{
                    cursor: "pointer",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    opacity: hasIncompatible ? 0.6 : 1,
                    "&:hover": { bgcolor: "action.hover" },
                    gap: 1.5,
                    px: 2,
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    disableRipple
                    sx={{ color: "primary.main", py: 0 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={hasIncompatible ? "text.disabled" : "text.primary"}
                    >
                      {pet.name}
                    </Typography>
                    <Typography variant="caption" color="text.primary" display="block">
                      {pet.species} {pet.breed ? `· ${pet.breed}` : ""}{" "}
                      {pet.size ? `· ${pet.size}` : ""}{" "}
                      {pet.coat_type ? `· ${pet.coat_type}` : ""}
                    </Typography>
                    {hasIncompatible && (
                      <Typography
                        variant="caption"
                        color="error.main"
                        sx={{ display: "block", fontWeight: 600 }}
                      >
                        Incompatível:{" "}
                        {incompatible
                          .map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`)
                          .join(", ")}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      {activePets.length > 0 && (
        <DialogActions
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            disabled={pendingPackagePetIds.length === 0}
            onClick={onConfirm}
            fullWidth
          >
            Adicionar ao Carrinho
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
