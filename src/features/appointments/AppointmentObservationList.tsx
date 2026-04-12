import { Box, Divider, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { Appointment } from "./types";
import { Info, X } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import theme from "../../theme";

type Props = {
  open: boolean;
  anchorEl?: null | HTMLElement;
  handleClose: () => void;
  appointment: Appointment;
};
const AppointmentObservationList = ({
  open,
  handleClose,
  appointment,
}: Props) => {
  const petsWithNotes = appointment.items.filter(
    (item) => item.pet.notes && item.pet.notes.trim() !== ""
  );

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
            <Info size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight={600}>Observações</Typography>
          </Box>
          <Box sx={{ cursor: "pointer", display: "flex" }} onClick={handleClose}>
            <X size={24} />
          </Box>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {appointment.notes && appointment.notes.trim() !== "" && (
          <CustomCard sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Agendamento</Typography>
            <Typography variant="body1" color="text.primary">{appointment.notes}</Typography>
          </CustomCard>
        )}
        {petsWithNotes.map((item) => (
          <CustomCard key={item.id} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>{item.pet.name}</Typography>
            <Typography variant="body1" color="text.primary">{item.pet.notes}</Typography>
          </CustomCard>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentObservationList;
