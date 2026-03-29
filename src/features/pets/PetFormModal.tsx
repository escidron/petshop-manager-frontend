import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

import PetForm from "./PetForm";
import { DEFAULT_PET_FORM } from "./constants";

import { createPet, updatePet } from "../../api/services/pets";
import { useClients } from "../../hooks/useClients";
import { useToast } from "../../hooks/useToast";
import type { Pet, PetFormData } from "./types";
import { petToFormData } from "./mapper";
import { X } from "lucide-react";
import { brDateToISO } from "../../utils/formatDates";
import type { Client } from "../clients/types";

/* =======================
   Types
======================= */

type Props = {
  open: boolean;
  mode: "create" | "edit";
  pet?: Pet;
  onClose: () => void;
  onSuccess: (pet: Pet) => void;
  client?: Client
};

export default function PetFormModal({
  open,
  mode,
  pet,
  onClose,
  onSuccess,
  client
}: Props) {
  const toast = useToast();
  const defaultValues = pet ? petToFormData(pet) : DEFAULT_PET_FORM;
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clients } = useClients();

  const handleSubmit = async (data: PetFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        birth_date: brDateToISO(data.birth_date),
      };
      const saved =
        mode === "create"
          ? await createPet(payload)
          : await updatePet(pet!.id, payload);

      toast.success(
        mode === "create"
          ? "Pet cadastrado com sucesso"
          : "Pet atualizado com sucesso",
      );

      onSuccess(saved);
      onClose();
    } catch (error) {
      let message =
        mode === "create" ? "Erro ao cadastrar pet." : "Erro ao atualizar pet.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={false} // permite ultrapassar os limites padrões
      slotProps={{
        paper: {
          sx: {
            width: showAdditionalInfo ? "80%" : "500px",
            maxWidth: "1200px", // largura máxima
            minWidth: showAdditionalInfo ? "1000px" : "500px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Pet" : "Editar Pet"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <PetForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showAdditionalInfo={showAdditionalInfo}
          setShowAdditionalInfo={setShowAdditionalInfo}
          clients={clients}
          selectedClient={client}
        />
      </DialogContent>
    </Dialog>
  );
}
