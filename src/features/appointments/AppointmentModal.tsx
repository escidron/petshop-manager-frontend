import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import type { Step } from "../../pages/Dashboard";
import AppointmentForm from "./AppointmentForm";
import { useClients } from "../../hooks/useClients";
import type { Client, Pet } from "../../pages/ClientsPage";
import { useState } from "react";
import { useClient } from "../../hooks/useClient";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  step: Step;
  setStep: (step: Step) => void;
};

const titleMap = {
  appointment: "Novo Agendamento",
  client: "Cadastrar Cliente",
  pet: "Cadastrar Pet",
};

const AppointmentModal = ({ open, mode, onClose, step }: Props) => {
  const { clients } = useClients();
  const { pets, client, setClientId } = useClient();

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  console.log("client", client);
  console.log("pets", pets);
  console.log("selectedPet", selectedPet);
  const modalTitle = titleMap[step];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{modalTitle}</DialogTitle>

      <DialogContent>
        {step === "appointment" && (
          <AppointmentForm
            clients={clients}
            pets={pets}
            setSelectedClient={(client: Client) => setClientId(client.id!)}
            setSelectedPet={(pet: Pet) => setSelectedPet(pet)}
          />
        )}
      </DialogContent>

      <DialogActions
        sx={{ display: "flex", justifyContent: "space-between", p: 3 }}
      >
        <Button onClick={onClose} variant="text">
          Cancelar
        </Button>

        {step === "client" && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" onClick={() => {}}>
              Salvar
            </Button>

            {mode === "create" && (
              <Button onClick={() => {}}>Salvar e cadastrar pet</Button>
            )}
          </Box>
        )}
        {step === "pet" && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => {}}>Salvar</Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentModal;
