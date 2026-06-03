import { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { X } from "lucide-react";
import { useWaitingList } from "../../../hooks/useWaitingList";
import { useClients } from "../../../hooks/useClients";
import { useServices } from "../../../hooks/useServices";
import { useClient } from "../../../hooks/useClient";
import WaitingListForm from "./WaitingListForm";
import ClientFormModal from "../../clients/ClientFormModal";
import PetFormModal from "../../pets/PetFormModal";
import ServiceFormModal from "../../tenant_services/ServiceFormModal";
import type { WaitingListFormData } from "./schemas";
import type { WaitingListEntry } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEntry?: WaitingListEntry;
};

export default function WaitingListModal({ open, onClose, onSuccess, initialEntry }: Props) {
  const { createEntry, updateEntry } = useWaitingList();
  const { clients, getClients } = useClients();
  const { services, getServices } = useServices();
  
  const { pets, setClientId, refetchPets } = useClient(initialEntry?.client_id);
  const [currentClientId, setCurrentClientId] = useState<number | undefined>(initialEntry?.client_id);

  const handleClientIdChange = (id: number) => {
    setClientId(id);
    setCurrentClientId(id);
  };

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: WaitingListFormData) => {
    setIsSubmitting(true);
    try {
      if (initialEntry) {
        await updateEntry({ id: initialEntry.id, data: {
          ...data,
          status: initialEntry.status
        }});
      } else {
        await createEntry(data);
      }
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            {initialEntry ? "Editar Fila de Espera" : "Adicionar à Fila de Espera"}
          </Typography>
          <Box sx={{ cursor: "pointer" }} onClick={onClose}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <WaitingListForm
            initialData={initialEntry}
            clients={clients}
            services={services}
            pets={pets}
            onClientIdChange={handleClientIdChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCreateClient={() => setClientModalOpen(true)}
            onCreatePet={() => setPetModalOpen(true)}
            onCreateService={() => setServiceModalOpen(true)}
          />
        </DialogContent>
      </Dialog>

      <ClientFormModal
        open={clientModalOpen}
        mode="create"
        onClose={() => setClientModalOpen(false)}
        onSuccess={async (client) => {
          await getClients();
          setClientId(client.id);
        }}
      />

      <PetFormModal
        open={petModalOpen}
        mode="create"
        client={clients.find(c => c.id === currentClientId)}
        onClose={() => setPetModalOpen(false)}
        onSuccess={refetchPets}
      />

      <ServiceFormModal
        open={serviceModalOpen}
        mode="create"
        onClose={() => setServiceModalOpen(false)}
        onSuccess={getServices}
      />
    </>
  );
}
