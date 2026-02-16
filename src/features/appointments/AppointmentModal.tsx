import { useClients } from "../../hooks/useClients";
import {
  createAppointment,
  updateAppointment,
} from "../../api/services/appointments";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import AppointmentForm from "./AppointmentForm";
import { useToast } from "../../hooks/useToast";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";

import type { Appointment, AppointmentFormData } from "./types";
import { useServices } from "../../hooks/useServices";
import { appointmentToFormData } from "./mapper";
import { DEFAULT_APPOINTMENT_FORM } from "./constants";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  appointment?: Appointment;
  selectedClient?: Client;
  selectedPet?: Pet;
  onClose: () => void;
  onSuccess: (client: Client) => void;
};

export default function AppointmentModal({
  open,
  mode,
  appointment,
  onClose,
  onSuccess,
  selectedClient,
  selectedPet,
}: Props) {
  const toast = useToast();
  const defaultValues = appointment
    ? appointmentToFormData(appointment)
    : DEFAULT_APPOINTMENT_FORM;

  const { clients } = useClients();
  const { services } = useServices();
  const handleSubmit = async (data: AppointmentFormData) => {
    const saved =
      mode === "create"
        ? await createAppointment(data)
        : await updateAppointment(appointment!.id, data);

    toast.success(
      mode === "create"
        ? "Agendamento criado com sucesso"
        : "Agendamento atualizado com sucesso",
    );

    onSuccess(saved);
    onClose();
  };
  console.log("selectedClient", selectedClient);
  return (
    <Dialog
      open={open}
      maxWidth={false} // permite ultrapassar os limites padrões
      slotProps={{
        paper: {
          sx: {
            width: "600px",
            maxWidth: "1400px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <AppointmentForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          clients={clients}
          services={services}
          selectedClient={selectedClient}
          selectedPet={selectedPet}
        />
      </DialogContent>
    </Dialog>
  );
}
