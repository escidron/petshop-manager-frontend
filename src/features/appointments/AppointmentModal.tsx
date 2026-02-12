import { useEffect, useState } from "react";
import { useClients } from "../../hooks/useClients";

import type { Dayjs } from "dayjs";
import { createAppointment, type Service } from "../../api/services/appointments";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AppointmentForm from "./AppointmentForm";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import { fetchServices } from "../../api/services/tenant_services";

type Props = {
  open: boolean;
  selectedClient?: Client;
  selectedPet?: Pet;
  currentDate?: Dayjs;
  pets?: Pet[];
  onClientSelect: (client?: Client) => void;
  onPetSelect: (pet?: Pet) => void;
  onCreateClient: () => void;
  onCreatePet: () => void;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AppointmentModal({
  open,
  selectedClient,
  selectedPet,
  currentDate,
  pets,
  onClientSelect,
  onPetSelect,
  onCreateClient,
  onCreatePet,
  onClose,
  onSuccess,
}: Props) {
  const { clients } = useClients();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState("");
  const toast = useToast();
  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  const handleSave = async () => {
    const baseDate = date ?? currentDate;
    if (!selectedClient || !selectedPet || !baseDate || !time) return;

    const scheduled_at = baseDate
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
    onSuccess();
    onClose();
    toast.success("Agendamento criado com sucesso");
  };

  const handleToggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };
  const handleCreateClient = () => {
    onCreateClient();
  };

  const handleCreatePet = () => {
    onCreatePet();
  };
  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>Novo Agendamento</DialogTitle>

      <DialogContent>
        <AppointmentForm
          clients={clients}
          pets={pets ?? []}
          services={services}
          selectedClient={selectedClient ?? null}
          selectedPet={selectedPet ?? null}
          selectedServices={selectedServices}
          date={date ?? currentDate}
          time={time ?? undefined}
          notes={notes}
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
