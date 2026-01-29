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
  clientId?: number;
  onClose: () => void;
  onSuccess: (pet: Pet) => void; // 👈 mudou aqui
};

/* =======================
   Component
======================= */

export default function PetFormModal({
  open,
  mode,
  pet,
  clientId,
  onClose,
  onSuccess,
}: Props) {
  const { clients } = useClients();

  const [form, setForm] = useState<PetFormData>(DEFAULT_PET_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  console.log("pet", clientId, pet);
  console.log("form", form);
  console.log("mode", mode);
  useEffect(() => {
    if (mode === "edit" && pet) {
      setForm({
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

    if (mode === "create") {
      setForm(DEFAULT_PET_FORM);
    }
  }, [clients, mode, pet]);

  /* =======================
     Save
  ======================= */

  const handleSave = async () => {
    if (!form.name.trim()) return;

    try {
      setSaving(true);

      if (mode === "create") {
        const resolvedClientId = clientId ?? selectedClient?.id;

        if (!resolvedClientId) return;

        const createdPet = await createPet({
          ...form,
          client_id: resolvedClientId,
        });

        onSuccess(createdPet); // 👈 agora retorna o pet
      }

      if (mode === "edit" && pet) {
        const updated = await updatePet(pet.id, form);
        onSuccess(updated);
      }

      onClose();
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     Render
  ======================= */

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Cadastrar pet" : "Editar pet"}
      </DialogTitle>

      <DialogContent>
        <PetForm
          pet={form}
          onChange={setForm}
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
