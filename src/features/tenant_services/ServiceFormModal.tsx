import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  useMediaQuery,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      fullScreen={isMobile}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: showAdditionalInfo ? "80%" : "500px" },
            maxWidth: { xs: "100%", md: "800px" },
            minWidth: { xs: "unset", md: showAdditionalInfo ? "650px" : "400px" },
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 3 },
            maxHeight: { xs: "100dvh", md: "90vh" },
            height: { xs: "100dvh", md: "auto" },
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
          {mode === "create" ? "Novo Serviço" : "Editar Serviço"}
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

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 } }}>
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
