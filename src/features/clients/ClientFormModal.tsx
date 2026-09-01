import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import axios from "axios";
import { createClient, updateClient } from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";
import type { Client, ClientFormData } from "./types";
import ClientForm from "./ClientForm";
import { clientToFormData } from "./mapper";
import { DEFAULT_CLIENT_FORM } from "./constants";
import { X } from "lucide-react";
import { useState, useMemo } from "react";
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
  const defaultValues = useMemo(() => {
    return client ? clientToFormData(client) : DEFAULT_CLIENT_FORM;
  }, [client]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ClientFormData, action?: "addPet") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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
    } catch (error) {
      let message =
        mode === "create"
          ? "Erro ao cadastrar cliente."
          : "Erro ao atualizar cliente.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      fullScreen={isMobile}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: showAdditionalInfo ? "85%" : "500px" },
            maxWidth: { xs: "100%", sm: "1200px" },
            minWidth: { xs: "unset", sm: showAdditionalInfo ? "750px" : "450px" },
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 3 },
            maxHeight: { xs: "100dvh", sm: "90vh" },
            height: { xs: "100dvh", sm: "auto" },
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
        }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, fontWeight: 700 }}>
          {mode === "create" ? "Novo Cliente" : "Editar Cliente"}
        </Typography>
        <Box
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover", color: "text.primary" },
          }}
          onClick={onClose}
        >
          <X size={22} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <ClientForm
          open={open}
          mode={mode}
          defaultValues={defaultValues}
          showAdditionalInfo={showAdditionalInfo}
          createPetMandatory={createPetMandatory}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          setShowAdditionalInfo={setShowAdditionalInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
