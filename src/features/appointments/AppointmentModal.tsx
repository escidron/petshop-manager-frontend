import { useEffect, useState } from "react";
import { useClient } from "../../hooks/useClient";
import { useClients } from "../../hooks/useClients";
import {
  fetchServices,
  type Service,
} from "../../api/services/tenant_services";
import type { Dayjs } from "dayjs";
import type { Client } from "../../pages/ClientsPage";
import type { Pet } from "../../pages/PetsPage";
import { createAppointment } from "../../api/services/appointments";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AppointmentForm from "./AppointmentForm";
import { Button } from "../../components/Button/Button";

type Props = {
  open: boolean;
  selectedClient?: Client;
  selectedPet?: Pet;
  onClientSelect: (client: Client) => void;
  onPetSelect: (pet: Pet) => void;
  onCreateClient: () => void;
  onCreatePet: () => void;
  onClose: () => void;
};

export default function AppointmentModal({
  open,
  selectedClient,
  selectedPet,
  onClientSelect,
  onPetSelect,
  onCreateClient,
  onCreatePet,
  onClose,
}: Props) {
  const { clients } = useClients();
  const { pets } = useClient();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  const handleSave = async () => {
    if (!selectedClient || !selectedPet || !date || !time) return;

    const scheduled_at = date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .toISOString();

    await createAppointment({
      client_id: selectedClient.id,
      pet_id: selectedPet.id,
      scheduled_at,
      service_ids: selectedServices,
      notes,
    });

    onClose();
  };

  const handleToggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };
  const handleCreateClient = () => {
    // só dispara a intenção
    onCreateClient();
  };

  const handleCreatePet = () => {
    onCreatePet();
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Novo Agendamento</DialogTitle>

      <DialogContent>
        <AppointmentForm
          clients={clients}
          pets={pets}
          services={services}
          selectedClient={selectedClient ?? null}
          selectedPet={selectedPet ?? null}
          selectedServices={selectedServices}
          onClientChange={onClientSelect}
          onPetChange={onPetSelect}
          onServiceToggle={handleToggleService}
          onDateChange={setDate}
          onTimeChange={setTime}
          onNotesChange={setNotes}
          onCreateClient={handleCreateClient}
          onCreatePet={handleCreatePet}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancelar
        </Button>
        <Button onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
