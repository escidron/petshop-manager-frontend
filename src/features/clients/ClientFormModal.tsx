import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from "@mui/material";
import { useEffect } from "react";
import ClientForm, { type ClientFormData } from "./ClientForm";
import { Button } from "../../components/Button/Button";
import type { Client } from "../../pages/ClientsPage";
import { DEFAULT_CLIENT_FORM } from "./constants";
import { createClient, updateClient } from "../../api/services/clients";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client;
  clientForm: ClientFormData;
  setClientForm: (data: ClientFormData) => void;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  onSuccessAndAddPet?: (client: Client) => void;
};

export default function ClientFormModal({
  open,
  mode,
  client,
  clientForm,
  setClientForm,
  onClose,
  onSuccess,
  onSuccessAndAddPet,
}: Props) {
  useEffect(() => {
    if (mode === "edit" && client) {
      if (!client) return; 
      setClientForm({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
      });
    }
  }, [mode, client, setClientForm]);

  const handleSave = async () => {
    if (!clientForm.name.trim()) return;

    const saved =
      mode === "create"
        ? await createClient(clientForm)
        : await updateClient(client!.id.toString(), clientForm);
    onSuccess(saved);
    resetForm();
  };

  const handleSaveAndAddPet = async () => {
    if (!clientForm.name.trim()) return;
    const saved = await createClient(clientForm);
    onSuccessAndAddPet?.(saved);
  };

  const resetForm = () => setClientForm(DEFAULT_CLIENT_FORM);
  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Novo Cliente" : "Editar Cliente"}
      </DialogTitle>

      <DialogContent>
        <ClientForm client={clientForm} onChange={setClientForm} />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button
          variant="text"
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          Cancelar
        </Button>

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
      </DialogActions>
    </Dialog>
  );
}
