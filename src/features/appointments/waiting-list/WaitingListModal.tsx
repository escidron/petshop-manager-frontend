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
      <Dialog
        open={open}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "96vw", sm: "720px" },
              maxWidth: "100%",
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: "92vh", sm: "90vh" },
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}>
            {initialEntry ? "Editar Fila de Espera" : "Adicionar à Fila de Espera"}
          </Typography>
          <Box sx={{ cursor: "pointer" }} onClick={onClose}>
            <X size={20} />
          </Box>
        </DialogTitle>
        <DialogContent>
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
