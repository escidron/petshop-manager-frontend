import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { Step } from "../../pages/Dashboard";
import AppointmentForm from "./AppointmentForm";
import { useClients } from "../../hooks/useClients";
import type { Client, Pet } from "../../pages/ClientsPage";
import { useEffect, useState } from "react";
import { useClient } from "../../hooks/useClient";
import {
  fetchServices,
  type Service,
} from "../../api/services/tenant_services";
import type { Dayjs } from "dayjs";
import { createAppointment } from "../../api/services/appointments";
import { DEFAULT_CLIENT_FORM } from "../clients/constants";
import type { ClientFormData } from "../clients/ClientForm";
import ClientForm from "../clients/ClientForm";
import { DEFAULT_PET_FORM } from "../pets/constants";
import type { PetFormData } from "../pets/PetForm";
import PetForm from "../pets/PetForm";
import { createClient } from "../../api/services/clients";
import { createPet } from "../../api/services/pets";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  step: Step;
  setStep: (step: Step) => void;
};

const titleMap = {
  appointment: "Novo Agendamento",
  client: "Cadastrar Cliente",
  pet: "Cadastrar Pet",
};

const AppointmentModal = ({ open, onClose, step, setStep }: Props) => {
  const { clients } = useClients();
  const { pets, setClientId } = useClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [petForm, setPetForm] = useState<PetFormData>(DEFAULT_PET_FORM);
  const [stepHistory, setStepHistory] = useState<Step[]>(["appointment"]);

  const [clientForm, setClientForm] =
    useState<ClientFormData>(DEFAULT_CLIENT_FORM);
  const modalTitle = titleMap[step];

  useEffect(() => {
    const loadServices = async () => {
      const services = await fetchServices();
      setServices(services);
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (selectedClient?.id) {
      setClientId(selectedClient.id);
    }
  }, [selectedClient, setClientId]);

  const handleToggleService = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const buildScheduledAt = () => {
    if (!date || !time) return null;

    return date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0)
      .toISOString();
  };

  const buildPayload = () => {
    const scheduled_at = buildScheduledAt();
    if (!scheduled_at || !selectedClient || !selectedPet) return null;

    return {
      client_id: selectedClient?.id,
      pet_id: selectedPet.id,
      scheduled_at,
      service_ids: selectedServices,
      notes,
    };
  };

  const submitHandlers: Record<Step, () => Promise<void>> = {
    client: async () => {
      await saveClient();
      setStep("pet");
    },
    pet: async () => {
      await savePet();
      setStep("appointment");
    },
    appointment: async () => {
      await saveAppointment();
    },
  };

  const resetForm = () => {
    setSelectedServices([]);
    setSelectedClient(null);
    setSelectedPet(null);
    setStep("appointment");
    setStepHistory(["appointment"]);
  };

  const saveAppointment = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      await createAppointment(payload);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const saveClient = async () => {
    if (!clientForm.name.trim()) return null;

    const newClient = await createClient(clientForm);
    setSelectedClient(newClient);
  };

  const savePet = async () => {
    if (!petForm.name.trim()) return null;
    if (!selectedClient) return null;
    const newPet = await createPet({
      ...petForm,
      client_id: selectedClient?.id,
    });
    setSelectedPet(newPet);
  };

  const goToStep = (next: Step) => {
    setStepHistory((prev) => [...prev, next]);
    setStep(next);
  };

  const handleCancel = () => {
    if (stepHistory.length > 1) {
      const history = [...stepHistory];
      history.pop();
      const previous = history[history.length - 1];

      setStepHistory(history);
      setStep(previous);
    } else {
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{modalTitle}</DialogTitle>

      <DialogContent>
        {step === "appointment" && (
          <AppointmentForm
            clients={clients}
            pets={pets}
            services={services}
            selectedServices={selectedServices}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            selectedPet={selectedPet}
            onPetChange={setSelectedPet}
            onServiceToggle={handleToggleService}
            onDateChange={setDate}
            onTimeChange={setTime}
            onNotesChange={setNotes}
            setStep={goToStep}
          />
        )}
        {step === "client" && (
          <ClientForm client={clientForm} onChange={setClientForm} />
        )}
        {step === "pet" && <PetForm pet={petForm} onChange={setPetForm} />}
      </DialogContent>

      <DialogActions
        sx={{ display: "flex", justifyContent: "space-between", p: 3 }}
      >
        <Button onClick={handleCancel} variant="text">
          Cancelar
        </Button>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={submitHandlers[step]}>Salvar</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentModal;
