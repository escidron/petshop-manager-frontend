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
import { X } from "lucide-react";
import axios from "axios";

import { useToast } from "../../hooks/useToast";
import {
  createDaycareModality,
  updateDaycareModality,
} from "../../api/services/daycare";
import DaycareServiceForm, {
  type DaycareModalityFormValues,
} from "./DaycareServiceForm";
import type { DaycareModality } from "./types";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  modality?: DaycareModality | null;
  onClose: () => void;
  onSuccess: (saved: DaycareModality) => void;
};

export default function DaycareServiceFormModal({
  open,
  mode,
  modality,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<DaycareModalityFormValues>(() => {
    if (!modality) {
      return {
        name: "",
        price_cents: 0,
        is_active: true,
        max_hours: null,
        species: [],
        sizes: [],
        description: "",
      };
    }

    return {
      name: modality.name || "",
      price_cents: modality.price_cents || 0,
      is_active: modality.is_active ?? true,
      max_hours: modality.max_hours ?? null,
      species: modality.species || [],
      sizes: modality.sizes || [],
      description: modality.description || "",
    };
  }, [modality]);

  const handleSubmit = async (data: DaycareModalityFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        price_cents: data.price_cents,
        is_active: data.is_active,
        billing_type: modality?.billing_type || "daily",
        max_hours: data.max_hours && data.max_hours > 0 ? data.max_hours : null,
        species: data.species && data.species.length > 0 ? data.species : null,
        sizes: data.sizes && data.sizes.length > 0 ? data.sizes : null,
        description: data.description?.trim() ? data.description.trim() : null,
      };

      const saved =
        mode === "create"
          ? await createDaycareModality(payload)
          : await updateDaycareModality(modality!.id, payload);

      toast.success(
        mode === "create"
          ? "Serviço de creche cadastrado com sucesso"
          : "Serviço de creche atualizado com sucesso",
      );

      onSuccess(saved);
      onClose();
    } catch (error: unknown) {
      let message =
        mode === "create"
          ? "Erro ao cadastrar serviço de creche."
          : "Erro ao atualizar serviço de creche.";

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
        <Typography
          variant="h5"
          sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, fontWeight: 700 }}
        >
          {mode === "create" ? "Novo Serviço de Creche" : "Editar Serviço de Creche"}
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

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
        }}
      >
        <DaycareServiceForm
          key={modality?.id ?? "create"}
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
