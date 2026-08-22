import { useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { X } from "lucide-react";
import { useWaitingListMutations } from "../../../hooks/useWaitingList";
import { useClients } from "../../../hooks/useClients";
import { useServices } from "../../../hooks/useServices";
import { useClient } from "../../../hooks/useClient";
import WaitingListForm from "./WaitingListForm";
import type { WaitingListFormData } from "./schemas";
import type { WaitingListEntry } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEntry?: WaitingListEntry;
};

export default function WaitingListModal({ open, onClose, onSuccess, initialEntry }: Props) {
  const { createEntry, updateEntry } = useWaitingListMutations();
  const { clients } = useClients();
  const { services } = useServices();
  
  const { pets, setClientId } = useClient(initialEntry?.client_id);

  const handleClientIdChange = (id: number) => {
    setClientId(id);
  };



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
          <Typography variant="h6" component="div">
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
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
