import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import ClientForm, { type ClientFormData } from "./ClientForm";
import { Button } from "../../components/Button/Button";
import type { Client } from "../../pages/ClientsPage";
import PetForm from "../pets/PetForm";

type Step = "client" | "pet";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  client?: Client;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ClientFormModal({
  open,
  mode,
  client,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("client");
  const [form, setForm] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [clientId, setClientId] = useState<number | null>(null);
  console.log("clientId", clientId);
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

  const reset = () => {
    setStep("client");
    setForm({ name: "", email: "", phone: "" });
    setClientId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const saveClient = async () => {
    if (!form.name.trim()) return null;

    if (mode === "create") {
      const response = await apiClient.post<Client>(
        "/api/v1/clients/",
        { ...form, is_active: true },
        { params: { tenant_id: 1 } }
      );
      return response.data;
    }

    await apiClient.patch(
      `/api/v1/clients/${client!.id}`,
      { ...form },
      { params: { tenant_id: 1 } }
    );

    return client!;
  };

  const handleSave = async () => {
    const saved = await saveClient();
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
          <ClientForm value={form} onChange={setForm} />
        )}

        {step === "pet" && <PetForm />}
      </DialogContent>

      <DialogActions
        sx={{ display: "flex", justifyContent: "space-between", p:3 }}
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
      </DialogActions>
    </Dialog>
  );
}
