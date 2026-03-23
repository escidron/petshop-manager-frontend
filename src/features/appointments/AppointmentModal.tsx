import { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { X } from "lucide-react";

import { createAppointment, updateAppointment } from "../../api/services/appointments";
import { useClients } from "../../hooks/useClients";
import { useServices } from "../../hooks/useServices";
import { useClient } from "../../hooks/useClient";
import { useToast } from "../../hooks/useToast";

import AppointmentForm from "./AppointmentForm";
import ClientFormModal from "../clients/ClientFormModal";
import PetFormModal from "../pets/PetFormModal";
import ServiceFormModal from "../tenant_services/ServiceFormModal";

import { appointmentToFormData } from "./mapper";
import { DEFAULT_APPOINTMENT_FORM } from "./constants";

import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { Appointment, AppointmentFormData } from "./types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  appointment?: Appointment;
  selectedClient?: Client;
  selectedPet?: Pet;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AppointmentModal({
  open,
  mode,
  appointment,
  selectedClient,
  selectedPet,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const defaultValues = appointment ? appointmentToFormData(appointment) : DEFAULT_APPOINTMENT_FORM;
  const initialClientId =
    selectedClient?.id ||
    (typeof defaultValues.client_id === "number" && defaultValues.client_id > 0
      ? defaultValues.client_id
      : undefined);

  const { clients, getClients } = useClients();
  const { services, getServices } = useServices();
  const { pets, setClientId, refetchPets } = useClient(initialClientId);

  // Sub-modal state
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [petModal, setPetModal] = useState<{ open: boolean; index: number; clientId: number }>({
    open: false,
    index: 0,
    clientId: 0,
  });
  const [serviceModal, setServiceModal] = useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  });

  // Auto-select after quick-create
  const [autoSelectClientId, setAutoSelectClientId] = useState<number | undefined>();
  const [autoSelectPet, setAutoSelectPet] = useState<{ index: number; id: number } | undefined>();
  const [autoSelectService, setAutoSelectService] = useState<
    { index: number; id: number } | undefined
  >();

  const handleSubmit = async (data: AppointmentFormData) => {
    const saved =
      mode === "create"
        ? await createAppointment(data)
        : await updateAppointment(appointment!.id, data);

    toast.success(
      mode === "create" ? "Agendamento criado com sucesso" : "Agendamento atualizado com sucesso",
    );
    onSuccess();
    onClose();
  };

  const handleClientCreated = async (client: Client) => {
    await getClients();
    setClientId(client.id);
    setAutoSelectClientId(client.id);
  };

  const handlePetCreated = async (pet: Pet) => {
    await refetchPets();
    setAutoSelectPet({ index: petModal.index, id: pet.id });
  };

  const handleServiceCreated = async (service: Service) => {
    await getServices();
    setAutoSelectService({ index: serviceModal.index, id: service.id });
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth={false}
        slotProps={{ paper: { sx: { width: "600px", maxWidth: "1400px" } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}>
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
            clients={clients}
            services={services}
            pets={pets}
            setClientId={setClientId}
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            onSubmit={handleSubmit}
            onCreateClient={() => setClientModalOpen(true)}
            onCreatePet={(index, clientId) => setPetModal({ open: true, index, clientId })}
            onCreateService={(index) => setServiceModal({ open: true, index })}
            autoSelectClientId={autoSelectClientId}
            autoSelectPet={autoSelectPet}
            autoSelectService={autoSelectService}
          />
        </DialogContent>
      </Dialog>

      <ClientFormModal
        open={clientModalOpen}
        mode="create"
        onClose={() => setClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />

      <PetFormModal
        open={petModal.open}
        mode="create"
        client={clients.find((c) => c.id === petModal.clientId)}
        onClose={() => setPetModal((p) => ({ ...p, open: false }))}
        onSuccess={handlePetCreated}
      />

      <ServiceFormModal
        open={serviceModal.open}
        mode="create"
        onClose={() => setServiceModal((p) => ({ ...p, open: false }))}
        onSuccess={handleServiceCreated}
      />
    </>
  );
}
