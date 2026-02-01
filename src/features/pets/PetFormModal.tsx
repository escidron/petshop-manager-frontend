import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";

import { Button } from "../../components/Button/Button";
import PetForm, { type PetFormData } from "./PetForm";
import { DEFAULT_PET_FORM } from "./constants";

import { createPet, updatePet } from "../../api/services/pets";
import { useClients } from "../../hooks/useClients";
import type { Pet } from "../../pages/PetsPage";
import type { Client } from "../../pages/ClientsPage";

/* =======================
   Types
======================= */

type Props = {
  open: boolean;
  mode: "create" | "edit";
  pet?: Pet;
  client?: Client;
  petForm: PetFormData;
  setPetForm: (data: PetFormData) => void;
  onClose: () => void;
  onSuccess: (pet: Pet) => void; // 👈 mudou aqui
};

export default function PetFormModal({
  open,
  mode,
  pet,
  client,
  petForm,
  setPetForm,
  onClose,
  onSuccess,
}: Props) {
  const { clients } = useClients();
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (mode === "edit" && pet) {
      setPetForm({
        name: pet.name,
        species: pet.species,
        gender: pet.gender,
        breed: pet.breed,
        age: pet.age,
        ageUnit: pet.ageUnit,
      });
      const owner = clients.find((client) => client.id === pet?.client_id);
      setSelectedClient(owner ?? null);
    }

    if (mode === "create" && client) {
      setPetForm({ ...DEFAULT_PET_FORM, owner_name: client.name });
      setSelectedClient(client ?? null);
    }
  }, [clients, mode, pet, client, setPetForm]);

  const handleSave = async () => {
    if (!petForm.name.trim()) return;

    try {
      setSaving(true);

      if (mode === "create") {
        const resolvedClientId = client?.id ?? selectedClient?.id;

        if (!resolvedClientId) return;

        const createdPet = await createPet({
          ...petForm,
          client_id: resolvedClientId,
        });

        onSuccess(createdPet);
      }

      if (mode === "edit" && pet) {
        const updated = await updatePet(pet.id, petForm);
        onSuccess(updated);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Cadastrar pet" : "Editar pet"}
      </DialogTitle>

      <DialogContent>
        <PetForm
          pet={petForm}
          onChange={setPetForm}
          clients={clients}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
        />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button variant="text" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button onClick={handleSave} loading={saving}>
          {mode === "create" ? "Salvar" : "Atualizar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
