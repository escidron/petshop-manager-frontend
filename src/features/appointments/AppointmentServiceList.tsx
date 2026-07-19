import { Box, Divider, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { Appointment } from "./types";
import { Dot, List, X } from "lucide-react";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
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
  const totalCents = getAppointmentTotal(appointment);

  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
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
            <Typography variant="h6" color="text.secondary"> {formattedTotal}</Typography>
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
                        <Typography variant="body2">{s.name}</Typography>
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
                      {(s.price_cents / 100).toLocaleString("pt-BR", {
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
