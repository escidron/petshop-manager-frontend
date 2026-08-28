import { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, DialogActions, Typography, Alert } from "@mui/material";
import { X } from "lucide-react";

import { createAppointment, updateAppointment } from "../../api/services/appointments";
import { useClients } from "../../hooks/useClients";
import { useServices } from "../../hooks/useServices";
import { useClient } from "../../hooks/useClient";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";

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
  initialDate?: string;
  prefill?: Partial<AppointmentFormData>;
};

export default function AppointmentModal({
  open,
  mode,
  appointment,
  selectedClient,
  selectedPet,
  onClose,
  onSuccess,
  initialDate,
  prefill,
}: Props) {
  const toast = useToast();
  const defaultValues: AppointmentFormData = appointment
    ? appointmentToFormData(appointment)!
    : { ...DEFAULT_APPOINTMENT_FORM, ...prefill };
  const initialClientId =
    selectedClient?.id ||
    (typeof defaultValues.client_id === "number" && defaultValues.client_id > 0
      ? defaultValues.client_id
      : undefined);

  const { clients, getClients } = useClients();
  const { services, getServices } = useServices();
  const { pets, setClientId, refetchPets, loadedClientId } = useClient(initialClientId);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editRecurrenceConfirmOpen, setEditRecurrenceConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);

  const executeSubmit = async (data: AppointmentFormData, updateAllFuture: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createAppointment(data);
      } else {
        await updateAppointment(appointment!.id, {
          ...data,
          update_all_future: updateAllFuture,
        });
      }

      toast.success(
        mode === "create"
          ? "Agendamento criado com sucesso"
          : updateAllFuture
          ? "Agendamento e recorrências futuras atualizados com sucesso"
          : "Agendamento atualizado com sucesso",
      );
      setEditRecurrenceConfirmOpen(false);
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (data: AppointmentFormData) => {
    if (mode === "edit" && appointment?.recurrence_id) {
      setPendingFormData(data);
      setEditRecurrenceConfirmOpen(true);
      return;
    }
    executeSubmit(data, false);
  };

  const handleClientCreated = async (client: Client) => {
    await getClients();
    setClientId(client.id);
    setAutoSelectClientId(client.id);
  };

  const handleClientCreatedAndAddPet = async (client: Client) => {
    await handleClientCreated(client);
    setPetModal({ open: true, index: 0, clientId: client.id });
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
        slotProps={{
          paper: {
            sx: {
              width: { xs: "96vw", sm: "720px" },
              maxWidth: "100%",
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: "92vh", sm: "90vh" },
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", pr: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}>
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
            mode={mode}
            isSubmitting={isSubmitting}
            onCreateClient={() => setClientModalOpen(true)}
            onCreatePet={(index, clientId) => setPetModal({ open: true, index, clientId })}
            onCreateService={(index) => setServiceModal({ open: true, index })}
            autoSelectClientId={autoSelectClientId}
            autoSelectPet={autoSelectPet}
            autoSelectService={autoSelectService}
            initialDate={initialDate}
            loadedClientId={loadedClientId}
          />
        </DialogContent>
      </Dialog>

      <ClientFormModal
        open={clientModalOpen}
        mode="create"
        onClose={() => setClientModalOpen(false)}
        onSuccess={handleClientCreated}
        onSuccessAndAddPet={handleClientCreatedAndAddPet}
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

      <Dialog
        open={editRecurrenceConfirmOpen}
        onClose={() => !isSubmitting && setEditRecurrenceConfirmOpen(false)}
      >
        <DialogTitle>Alterar Agendamento Recorrente</DialogTitle>
        <DialogContent>
          <Typography>
            Este agendamento faz parte de uma recorrência. Como deseja aplicar as alterações?
          </Typography>
          <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
            Você pode alterar apenas este agendamento ou aplicar as novas informações (horário, serviços, observações) para este e todos os agendamentos futuros da série.
          </Alert>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => pendingFormData && executeSubmit(pendingFormData, false)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Alterar apenas este
          </Button>

          <Button
            variant="outlined"
            onClick={() => setEditRecurrenceConfirmOpen(false)}
            disabled={isSubmitting}
          >
            Voltar
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => pendingFormData && executeSubmit(pendingFormData, true)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Alterar este e TODOS os futuros
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
