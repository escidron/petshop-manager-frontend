import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { createClient, updateClient } from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";
import type { Client, ClientFormData } from "./types";
import ClientForm from "./ClientForm";
import { clientToFormData } from "./mapper";
import { DEFAULT_CLIENT_FORM } from "./constants";
import { X } from "lucide-react";
import { useState } from "react";
import { brDateToISO } from "../../utils/formatDates";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client;
  createPetMandatory?: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  onSuccessAndAddPet?: (client: Client) => void;
};

export default function ClientFormModal({
  open,
  mode,
  client,
  createPetMandatory,
  onClose,
  onSuccess,
  onSuccessAndAddPet,
}: Props) {
  const toast = useToast();
  const defaultValues = client ? clientToFormData(client) : DEFAULT_CLIENT_FORM;
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const handleSubmit = async (data: ClientFormData, action?: "addPet") => {

    const payload = {
      ...data,
      birth_date: brDateToISO(data.birth_date),
    };
    const saved =
      mode === "create"
        ? await createClient(payload)
        : await updateClient(client!.id.toString(), payload);

    toast.success(
      mode === "create"
        ? "Cliente cadastrado com sucesso"
        : "Cliente atualizado com sucesso",
    );

    if (action === "addPet") {
      onSuccessAndAddPet?.(saved);
    } else {
      onSuccess(saved);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      maxWidth={false} // permite ultrapassar os limites padrões
      slotProps={{
        paper: {
          sx: {
            width: showAdditionalInfo ? "80%" : "500px",
            maxWidth: "1400px", // largura máxima
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Cliente" : "Editar Cliente"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <ClientForm
          mode={mode}
          defaultValues={defaultValues}
          showAdditionalInfo={showAdditionalInfo}
          createPetMandatory={createPetMandatory}
          onSubmit={handleSubmit}
          setShowAdditionalInfo={setShowAdditionalInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
