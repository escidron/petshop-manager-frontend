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
import { X, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";

import { createAppointment, updateAppointment, getAppointmentsByDay } from "../../api/services/appointments";
import { useClients } from "../../hooks/useClients";
import { useServices } from "../../hooks/useServices";
import { useClient } from "../../hooks/useClient";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
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
  const { tenant } = useAuth();
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

  const [capacityWarningOpen, setCapacityWarningOpen] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<{
    current: number;
    newPets: number;
    total: number;
    max: number;
    time: string;
  } | null>(null);

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
        const removeRecurrence = Boolean(appointment?.recurrence_id && !data.recurrence);
        await updateAppointment(appointment!.id, {
          ...data,
          update_all_future: updateAllFuture,
          remove_recurrence: removeRecurrence,
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

  const proceedSubmit = (data: AppointmentFormData) => {
    if (mode === "edit" && (appointment?.recurrence_id || data.recurrence)) {
      setPendingFormData(data);
      setEditRecurrenceConfirmOpen(true);
      return;
    }
    executeSubmit(data, false);
  };

  const handleConfirmEncaixe = () => {
    setCapacityWarningOpen(false);
    if (pendingFormData) {
      proceedSubmit(pendingFormData);
    }
  };

  const handleSubmit = async (data: AppointmentFormData) => {
    if (tenant?.max_simultaneous_appointments && typeof tenant.max_simultaneous_appointments === "number") {
      try {
        const scheduledAt = dayjs(data.scheduled_at);
        const dayStr = scheduledAt.format("YYYY-MM-DD");
        const dayAppts = await getAppointmentsByDay(dayStr);

        let newDurationMinutes = 0;
        for (const item of data.items || []) {
          for (const sId of item.service_ids || []) {
            const s = services?.find((svc) => svc.id === sId);
            newDurationMinutes += s?.duration_minutes || 30;
          }
        }
        if (newDurationMinutes === 0) newDurationMinutes = 30;
        const newStart = scheduledAt;
        const newEnd = newStart.add(newDurationMinutes, "minute");

        // Quantidade de pets no novo agendamento
        const newPetsCount = (data.items || []).filter((i) => i.pet_id).length || 1;

        // Soma de pets já agendados com horários sobrepostos
        let overlappingPetsCount = 0;
        for (const appt of dayAppts) {
          if (mode === "edit" && appt.id === appointment?.id) continue;
          if (appt.status === "canceled") continue;

          const apptStart = dayjs(appt.scheduled_at);
          let apptDuration = 0;
          for (const item of appt.items || []) {
            for (const s of item.services || []) {
              apptDuration += s.duration_minutes || 30;
            }
          }
          if (apptDuration === 0) apptDuration = 30;
          const apptEnd = apptStart.add(apptDuration, "minute");

          if (apptStart.isBefore(newEnd) && apptEnd.isAfter(newStart)) {
            const petsInAppt = (appt.items || []).filter((i) => Boolean(i.pet)).length || (appt.items?.length || 1);
            overlappingPetsCount += petsInAppt;
          }
        }

        const totalPets = overlappingPetsCount + newPetsCount;

        if (totalPets > tenant.max_simultaneous_appointments) {
          setCapacityInfo({
            current: overlappingPetsCount,
            newPets: newPetsCount,
            total: totalPets,
            max: tenant.max_simultaneous_appointments,
            time: newStart.format("HH:mm"),
          });
          setPendingFormData(data);
          setCapacityWarningOpen(true);
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar capacidade simultânea:", err);
      }
    }

    proceedSubmit(data);
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
          {appointment?.status === "completed" && (
            <Alert
              severity="warning"
              sx={{
                mx: { xs: 2, sm: 3 },
                mt: 2,
                mb: 0.5,
                borderRadius: 2,
                fontSize: "0.82rem",
                "& .MuiAlert-icon": { alignItems: "center" },
              }}
            >
              <strong>Atenção (Modo Proprietário):</strong> Este agendamento já foi finalizado. As alterações de serviços e profissionais atualizarão automaticamente pacotes, vendas e comissões.
            </Alert>
          )}
          {appointment?.status === "in_progress" && (
            <Alert
              severity="info"
              sx={{
                mx: { xs: 2, sm: 3 },
                mt: 2,
                mb: 0.5,
                borderRadius: 2,
                fontSize: "0.82rem",
                "& .MuiAlert-icon": { alignItems: "center" },
              }}
            >
              <strong>Atendimento em andamento:</strong> Você pode adicionar novos serviços, ajustar horários, profissionais ou observações a qualquer momento.
            </Alert>
          )}
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
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Alterar Agendamento Recorrente</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Como deseja aplicar as alterações deste agendamento?
          </Typography>
          <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
            Ao escolher <b>Alterar este e TODOS os futuros</b>, as configurações de recorrência, data/horário, itens e observações serão aplicadas para este e os próximos agendamentos não finalizados da série.
          </Alert>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            p: 2.5,
            gap: 1.5,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => pendingFormData && executeSubmit(pendingFormData, true)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Alterar este e TODOS os futuros
          </Button>

          <Button
            variant="outlined"
            onClick={() => pendingFormData && executeSubmit(pendingFormData, false)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Alterar apenas este agendamento
          </Button>

          <Button
            variant="text"
            onClick={() => setEditRecurrenceConfirmOpen(false)}
            disabled={isSubmitting}
          >
            Voltar para edição
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={capacityWarningOpen}
        onClose={() => !isSubmitting && setCapacityWarningOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, color: "warning.dark" }}>
          <AlertTriangle size={22} color="#ed6c02" />
          Aviso de Capacidade (Pets)
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.primary" sx={{ mb: 1.5 }}>
            Já existem <strong>{capacityInfo?.current} pet(s)</strong> agendados para às <strong>{capacityInfo?.time}</strong>.
            {capacityInfo && capacityInfo.newPets > 1 ? (
              <> Com este agendamento (+<strong>{capacityInfo.newPets} pets</strong>), serão <strong>{capacityInfo.total} pets</strong> simultâneos.</>
            ) : (
              <> Com este agendamento (+<strong>1 pet</strong>), serão <strong>{capacityInfo?.total} pets</strong> simultâneos.</>
            )}
          </Typography>
          <Alert severity="warning" sx={{ fontSize: "0.85rem", borderRadius: 2 }}>
            A capacidade máxima da loja é de <strong>{capacityInfo?.max} pet(s) simultâneo(s)</strong>.
            <br /><br />
            Deseja confirmar e forçar o encaixe deste agendamento mesmo assim?
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
            onClick={handleConfirmEncaixe}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirmar e Forçar Encaixe
          </Button>

          <Button
            variant="outlined"
            onClick={() => setCapacityWarningOpen(false)}
            disabled={isSubmitting}
          >
            Voltar e Alterar Horário
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
