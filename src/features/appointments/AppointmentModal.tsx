import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { X } from "lucide-react";

import { createAppointment, updateAppointment } from "../../api/services/appointments";
import { useClients } from "../../hooks/useClients";
import { useServices } from "../../hooks/useServices";
import { useClient } from "../../hooks/useClient";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";

import AppointmentForm from "./AppointmentForm";
import AppointmentMobileFlow from "./mobile/AppointmentMobileFlow";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      refetchPets();
    }
  }, [open, queryClient, refetchPets]);

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
  const isSubmittingRef = useRef(false);
  const [editRecurrenceConfirmOpen, setEditRecurrenceConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<AppointmentFormData | null>(null);

  const executeSubmit = async (data: AppointmentFormData, updateAllFuture: boolean = false) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
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
      isSubmittingRef.current = false;
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
    await queryClient.invalidateQueries({ queryKey: ["pets"] });
    await refetchPets();
    setAutoSelectPet({ index: petModal.index, id: pet.id });
  };

  const handleServiceCreated = async (service: Service) => {
    await getServices();
    setAutoSelectService({ index: serviceModal.index, id: service.id });
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <>
      <Dialog
        open={open}
        fullScreen={isMobile}
        maxWidth={false}
        sx={{
          "& .MuiDialog-container": {
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "center",
          },
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: "720px" },
              maxWidth: "100%",
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: "100dvh", sm: "90vh" },
              height: { xs: "100dvh", sm: "auto" },
              borderRadius: { xs: 0, sm: 3 },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            pt: { xs: "calc(12px + env(safe-area-inset-top, 0px))", sm: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, fontWeight: 700 }}>
            {mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}
          </Typography>
          <Box
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 2,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            }}
            onClick={onClose}
          >
            <X size={22} />
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {isMobile ? (
            <AppointmentMobileFlow
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
              onClose={onClose}
            />
          ) : (
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
              isMobile={isMobile}
              onClose={onClose}
            />
          )}
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
