import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from "@mui/material";
import { useEffect, useState } from "react";
import ClientForm, { type ClientFormData } from "./ClientForm";
import { Button } from "../../components/Button/Button";
import type { Client } from "../../pages/ClientsPage";
import { DEFAULT_CLIENT_FORM } from "./constants";
import { createClient, updateClient } from "../../api/services/clients";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  onSuccessAndAddPet?: (client: Client) => void;
};

export default function ClientFormModal({
  open,
  mode,
  client,
  onClose,
  onSuccess,
  onSuccessAndAddPet,
}: Props) {
  const [form, setForm] = useState<ClientFormData>(DEFAULT_CLIENT_FORM);

  useEffect(() => {
    if (mode === "edit" && client) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
      });
    }
  }, [mode, client]);

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const saved =
      mode === "create"
        ? await createClient(form)
        : await updateClient(client!.id.toString(), form);

    onSuccess(saved);
  };

  const handleSaveAndAddPet = async () => {
    if (!form.name.trim()) return;
    const saved = await createClient(form);
    console.log("saved", saved);
    onSuccessAndAddPet?.(saved);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Novo Cliente" : "Editar Cliente"}
      </DialogTitle>

      <DialogContent>
        <ClientForm client={form} onChange={setForm} />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button variant="text" onClick={onClose}>
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
