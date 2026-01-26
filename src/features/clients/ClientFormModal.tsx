import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";
import ClientForm, { type ClientFormData } from "./ClientForm";
import { Button } from "../../components/Button/Button";
import type { Client, Pet, Step } from "../../pages/ClientsPage";
import PetForm, { type PetFormData } from "../pets/PetForm";
import { DEFAULT_CLIENT_FORM } from "./constants";
import { DEFAULT_PET_FORM } from "../pets/constants";
import { createClient, updateClient } from "../../api/services/clients";
import { createPet, updatePet } from "../../api/services/pets";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client;
  pet?: Pet;
  onClose: () => void;
  onSuccess: () => void;
  step: Step;
  setStep: (step: Step) => void;
  existingClientId?: number;
};

export default function ClientFormModal({
  open,
  mode,
  client,
  pet,
  onClose,
  onSuccess,
  step,
  setStep,
  existingClientId,
}: Props) {
  const [clientForm, setClientForm] =
    useState<ClientFormData>(DEFAULT_CLIENT_FORM);
  const [petForm, setPetForm] = useState<PetFormData>(DEFAULT_PET_FORM);
  const [clientId, setClientId] = useState<number | null>(
    existingClientId ?? null,
  );

  useEffect(() => {
    if (mode === "edit" && client) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClientForm({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
      });
    }
    if (mode === "edit" && pet) {
      setPetForm({
        name: pet.name ?? "",
        species: pet.species ?? "other",
        gender: pet.gender ?? undefined,
        breed: pet.breed,
        age: pet.age,
        ageUnit: pet.ageUnit,
      });
    }
  }, [mode, client, pet]);

  const reset = () => {
    setStep("client");
    setClientForm(DEFAULT_CLIENT_FORM);
    setPetForm(DEFAULT_PET_FORM);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saveClient = async () => {
    if (!clientForm.name.trim()) return null;

    if (mode === "create") {
      return await createClient(clientForm);
    }

    return await updateClient(client!.id.toString(), clientForm);
  };

  const savePet = async () => {
    if (!petForm.name.trim()) return null;

    if (mode === "create") {
      return createPet({
        ...petForm,
        client_id: clientId!,
      });
    }

    return updatePet(pet!.id, {
      ...petForm,
      client_id: clientId!,
      is_active: true,
    });
  };

  const handleSave = async () => {
    const saveByStep = {
      client: saveClient,
      pet: savePet,
    } as const;

    const saveFn = saveByStep[step];
    if (!saveFn) return;

    const saved = await saveFn();
    if (!saved) return;

    onSuccess();
    handleClose();
  };

  const handleSaveAndAddPet = async () => {
    const saved = await saveClient();
    if (!saved) return;
    setClientId(saved.id);
    setStep("pet");
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {step === "client"
          ? mode === "create"
            ? "Novo Cliente"
            : "Editar Cliente"
          : "Cadastrar pet"}
      </DialogTitle>

      <DialogContent>
        {step === "client" && (
          <ClientForm client={clientForm} onChange={setClientForm} />
        )}

        {step === "pet" && <PetForm pet={petForm} onChange={setPetForm} />}
      </DialogContent>

      <DialogActions
        sx={{ display: "flex", justifyContent: "space-between", p: 3 }}
      >
        <Button onClick={handleClose} variant="text">
          Cancelar
        </Button>

        {step === "client" && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" onClick={handleSave}>
              Salvar
            </Button>

            {mode === "create" && (
              <Button onClick={handleSaveAndAddPet}>
                Salvar e cadastrar pet
              </Button>
            )}
          </Box>
        )}
        {step === "pet" && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={handleSave}>Salvar</Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
