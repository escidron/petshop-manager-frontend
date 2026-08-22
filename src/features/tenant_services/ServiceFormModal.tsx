import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { DEFAULT_SERVICE_FORM } from "./constants";
import { useToast } from "../../hooks/useToast";
import {
  createService,
  updateService,
} from "../../api/services/tenant_services";
import { serviceToFormData } from "./mapper";
import { X } from "lucide-react";
import type { Service, ServiceFormData } from "./types";
import ServiceForm from "./ServiceForm";
import axios from "axios";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  service?: Service;
  onClose: () => void;
  onSuccess: (service: Service) => void;
};

export default function ServiceFormModal({
  open,
  mode,
  service,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const defaultValues = useMemo(
    () => (service ? serviceToFormData(service) : DEFAULT_SERVICE_FORM),
    [service],
  );
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ServiceFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const saved =
        mode === "create"
          ? await createService(data)
          : await updateService(service!.id, data);

      toast.success(
        mode === "create"
          ? "Serviço cadastrado com sucesso"
          : "Serviço atualizado com sucesso",
      );

      onSuccess(saved);
      onClose();
    } catch (error: unknown) {
      let message = mode === "create" 
        ? "Erro ao cadastrar serviço." 
        : "Erro ao atualizar serviço.";
        
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail || message;
      }
      
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={false} // permite ultrapassar os limites padrões
      slotProps={{
        paper: {
          sx: {
            width: showAdditionalInfo ? "80%" : "500px",
            maxWidth: "800px", // largura máxima
            minWidth: showAdditionalInfo ? "800px" : "400px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4 }}
      >
        <Typography variant="h5">
          {mode === "create" ? "Novo Serviço" : "Editar Serviço"}
        </Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <ServiceForm
          key={service?.id ?? "create"}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showAdditionalInfo={showAdditionalInfo}
          setShowAdditionalInfo={setShowAdditionalInfo}
        />
      </DialogContent>
    </Dialog>
  );
}
