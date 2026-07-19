import { Box, Divider, Dialog, DialogContent, DialogTitle, Typography, Chip } from "@mui/material";
import type { Appointment } from "./types";
import { useQuery } from "@tanstack/react-query";
import { listClientPackagesByClient } from "../../api/services/client_packages";
import { Dot, List, X } from "lucide-react";
import theme from "../../theme";
import CustomCard from "../../components/Card/CustomCard";
import { COAT_TYPES, PET_SIZES } from "../pets/constants";

type Props = {
  open: boolean;
  handleClose: () => void;
  appointment: Appointment;
};
const AppointmentServiceList = ({
  open,
  handleClose,
  appointment,
}: Props) => {
  const { data: clientPackages = [] } = useQuery({
    queryKey: ["clientPackages", "client", appointment.client.id],
    queryFn: () => listClientPackagesByClient(appointment.client.id),
  });

  // Calculate dynamic coverage per pet/service
  const isServiceCovered = (petId: number, serviceId: number, isAlreadyCovered: boolean = false) => {
    if (isAlreadyCovered) return true;
    return clientPackages.some(pkg => 
      pkg.is_active && 
      pkg.pets?.some(p => p.id === petId) && 
      pkg.credits.some(c => c.service_id === serviceId && c.remaining_qty > 0)
    );
  };

  // Re-calculate the total cents dynamically ignoring covered ones
  const dynamicTotalCents = appointment.items.reduce((itemsAcc, item) => {
    const itemTotal = item.services
      .filter((s) => !isServiceCovered(item.pet.id, s.id, s.is_package_covered))
      .reduce((servicesAcc, service) => servicesAcc + service.price_cents, 0);
    return itemsAcc + itemTotal;
  }, 0);

  const formattedTotal = (dynamicTotalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
        backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" } },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <List size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight={600}>Serviços à realizar</Typography>
            <Typography variant="h6" color="text.primary"> {formattedTotal}</Typography>
          </Box>
          <Box sx={{ cursor: "pointer", display: "flex" }} onClick={handleClose}>
            <X size={24} />
          </Box>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {appointment.items.map((item, index) => {
          const coatLabel = COAT_TYPES.find(c => c.value === item.pet.coat_type)?.label;
          const sizeLabel = PET_SIZES.find(s => s.value === item.pet.size)?.label;
          const details = [
            item.pet.species,
            sizeLabel ? `Porte ${sizeLabel}` : null,
            coatLabel ? `Pelagem ${coatLabel}` : null
          ].filter(Boolean).join(" • ");

          return (
            <CustomCard key={item.id} sx={{ p: 1 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>{item.pet.name}</Typography>
                {details && (
                  <Typography variant="caption" color="text.primary">
                    {details}
                  </Typography>
                )}
              </Box>
              <Box>
                {item.services.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.5,
                    }}
                  >
                    {/* Nome do serviço */}
                    <Box sx={{ display: "flex", gap: 0.5, flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", height: 20 }}>
                        <Dot color={theme.palette.text.disabled} size={16} />
                      </Box>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2">{s.name}</Typography>
                          {isServiceCovered(item.pet.id, s.id, s.is_package_covered) && (
                            <Chip
                              label="Pacote"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                bgcolor: "success.main",
                                color: "success.contrastText"
                              }}
                            />
                          )}
                        </Box>
                        {(() => {
                          const sCoatLabel = COAT_TYPES.find(c => c.value === s.coat_type)?.label;
                          const sSizeLabel = PET_SIZES.find(sz => sz.value === s.size)?.label;
                          const svcDetails = [
                            s.species,
                            sSizeLabel ? `Porte ${sSizeLabel}` : null,
                            sCoatLabel ? `Pelagem ${sCoatLabel}` : null
                          ].filter(Boolean).join(" • ");
                          
                          if (!svcDetails || svcDetails === details) return null;
                          return (
                            <Typography variant="caption" color="text.primary" sx={{ display: "block", mt: -0.5 }}>
                              {svcDetails}
                            </Typography>
                          );
                        })()}
                      </Box>
                    </Box>

                    {/* Preço */}
                    <Typography variant="body2">
                      {isServiceCovered(item.pet.id, s.id, s.is_package_covered)
                        ? "R$ 0,00"
                        : (s.price_cents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                    </Typography>
                  </Box>
                ))}

                {/* Linha separadora */}
                <Divider sx={{ my: 1 }} />

                {/* Total */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Total
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {item.services
                      .filter(s => !isServiceCovered(item.pet.id, s.id, s.is_package_covered))
                      .reduce((acc, s) => acc + s.price_cents / 100, 0)
                      .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </Typography>
                </Box>
              </Box>
              {index !== appointment.items.length - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </CustomCard>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentServiceList;
