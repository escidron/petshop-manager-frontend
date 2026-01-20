import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";
import apiClient from "../../api/apiClient";
import ClientForm, { type ClientFormData } from "./ClientForm";
import { Button } from "../../components/Button/Button";
import type { Client } from "../../pages/ClientsPage";
import PetForm from "../pets/PetForm";

type Step = "client" | "pet";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ClientFormModal({
  open,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("client");
  const [form, setForm] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
  });
  const [clientId, setClientId] = useState<number | null>(null);
  console.log("clientId", clientId);
  const reset = () => {
    setStep("client");
    setForm({ name: "", email: "", phone: "" });
    setClientId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const createClient = async () => {
    if (!form.name.trim()) return null;

    const response = await apiClient.post<Client>(
      "/api/v1/clients/",
      { ...form, is_active: true },
      { params: { tenant_id: 1 } }
    );

    return response.data;
  };

  const handleSave = async () => {
    const client = await createClient();
    if (!client) return;
    handleClose();
  };

  const handleSaveAndAddPet = async () => {
    const client = await createClient();
    if (!client) return;

    setClientId(client.id);
    setStep("pet");
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {step === "client" ? "Novo Cliente" : "Cadastrar pet"}
      </DialogTitle>

      <DialogContent>
        {step === "client" && (
          <ClientForm value={form} onChange={setForm} />
        )}

        {step === "pet" && <PetForm />}
      </DialogContent>

      <DialogActions
        sx={{ display: "flex", justifyContent: "space-between", px: 3 }}
      >
        <Button onClick={handleClose} variant="text">Cancelar</Button>

        {step === "client" && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" onClick={handleSave}>
              Salvar
            </Button>
            <Button variant="contained" onClick={handleSaveAndAddPet}>
              Salvar e cadastrar pet
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
