import { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useWaitingListMutations } from "../../../hooks/useWaitingList";
import { useClients } from "../../../hooks/useClients";
import { useServices } from "../../../hooks/useServices";
import { useClient } from "../../../hooks/useClient";
import WaitingListForm from "./WaitingListForm";
import WaitingListMobileFlow from "./mobile/WaitingListMobileFlow";
import ClientFormModal from "../../clients/ClientFormModal";
import PetFormModal from "../../pets/PetFormModal";
import ServiceFormModal from "../../tenant_services/ServiceFormModal";
import type { WaitingListFormData } from "./schemas";
import type { WaitingListEntry } from "./types";
import type { Client } from "../../clients/types";
import type { Pet } from "../../pets/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEntry?: WaitingListEntry;
};

export default function WaitingListModal({ open, onClose, onSuccess, initialEntry }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const queryClient = useQueryClient();

  const { createEntry, updateEntry } = useWaitingListMutations();
  const { clients } = useClients();
  const { services } = useServices();

  const [currentClientId, setCurrentClientId] = useState<number | undefined>(initialEntry?.client_id);
  const { pets, setClientId } = useClient(currentClientId);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [petModal, setPetModal] = useState<{ open: boolean; index?: number; clientId?: number }>({
    open: false,
  });
  const [serviceModal, setServiceModal] = useState<{ open: boolean; index?: number }>({
    open: false,
  });

  const handleClientIdChange = (id: number) => {
    setCurrentClientId(id);
    setClientId(id);
  };

  const handleClientCreated = (newClient: Client) => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    handleClientIdChange(newClient.id);
  };

  const handlePetCreated = (newPet: Pet) => {
    queryClient.invalidateQueries({ queryKey: ["pets"] });
    queryClient.invalidateQueries({ queryKey: ["client", newPet.client_id] });
  };

  const handleServiceCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: WaitingListFormData) => {
    setIsSubmitting(true);
    try {
      if (initialEntry) {
        await updateEntry({
          id: initialEntry.id,
          data: {
            ...data,
            status: initialEntry.status,
          },
        });
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
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: "92vw", md: "720px" },
              maxWidth: "100%",
              m: { xs: 0, sm: 2 },
              height: { xs: "100dvh", sm: "auto" },
              maxHeight: { xs: "100dvh", sm: "90vh" },
              borderRadius: { xs: 0, sm: 3 },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            pt: { xs: "calc(12px + env(safe-area-inset-top, 0px))", sm: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, fontWeight: 700 }}>
            {initialEntry ? "Editar Fila de Espera" : "Adicionar à Fila de Espera"}
          </Typography>
          <Box
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 2,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            }}
            onClick={onClose}
          >
            <X size={20} />
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: isMobile ? 0 : 2.5,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {isMobile ? (
            <WaitingListMobileFlow
              initialData={initialEntry}
              clients={clients}
              services={services}
              pets={pets}
              onClientIdChange={handleClientIdChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCreateClient={() => setClientModalOpen(true)}
              onCreatePet={(index, clientId) => setPetModal({ open: true, index, clientId })}
              onCreateService={(index) => setServiceModal({ open: true, index })}
              onClose={onClose}
            />
          ) : (
            <WaitingListForm
              initialData={initialEntry}
              clients={clients}
              services={services}
              pets={pets}
              onClientIdChange={handleClientIdChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <ClientFormModal
        open={clientModalOpen}
        mode="create"
        onClose={() => setClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />

      <PetFormModal
        open={petModal.open}
        mode="create"
        client={clients.find((c) => c.id === petModal.clientId)}
        onClose={() => setPetModal((p) => ({ ...p, open: false }))}
        onSuccess={handlePetCreated}
      />

      <ServiceFormModal
        open={serviceModal.open}
        mode="create"
        onClose={() => setServiceModal((p) => ({ ...p, open: false }))}
        onSuccess={handleServiceCreated}
      />
    </>
  );
}
