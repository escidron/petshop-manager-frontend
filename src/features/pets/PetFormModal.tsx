import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useState, useMemo } from "react";
import axios from "axios";

import PetForm from "./PetForm";
import { DEFAULT_PET_FORM } from "./constants";

import { createPet, updatePet, fetchPetsByClient } from "../../api/services/pets";
import {
  listClientPackagesByPet,
  transferClientPackage,
  deactivateClientPackage,
} from "../../api/services/client_packages";
import { useClients, CLIENTS_QUERY_KEY } from "../../hooks/useClients";
import { PETS_QUERY_KEY } from "../../hooks/usePets";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import type { Pet, PetFormData } from "./types";
import { petToFormData } from "./mapper";
import { X } from "lucide-react";
import { brDateToISO } from "../../utils/formatDates";
import type { Client } from "../clients/types";
import { Button } from "../../components/Button/Button";
import {
  DialogActions,
  DialogContentText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

/* =======================
   Types
 ======================= */

type Props = {
  open: boolean;
  mode: "create" | "edit";
  pet?: Pet;
  onClose: () => void;
  onSuccess: (pet: Pet) => void;
  client?: Client
};

export default function PetFormModal({
  open,
  mode,
  pet,
  onClose,
  onSuccess,
  client
}: Props) {
  const toast = useToast();
  const defaultValues = useMemo(() => {
    return pet ? petToFormData(pet) : DEFAULT_PET_FORM;
  }, [pet]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clients } = useClients();
  const queryClient = useQueryClient();

  // Estados para transferência de pacotes
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [otherPets, setOtherPets] = useState<Pet[]>([]);
  const [selectedTargetPetId, setSelectedTargetPetId] = useState<number | "">("");
  const [pendingPetPayload, setPendingPetPayload] = useState<any>(null);

  const handleError = (error: any) => {
    let message =
      mode === "create" ? "Erro ao cadastrar pet." : "Erro ao atualizar pet.";
    if (axios.isAxiosError(error)) {
      message = error.response?.data?.detail ?? message;
    }
    toast.error(message);
  };

  const savePetAndFinish = async (payload: any) => {
    const saved =
      mode === "create"
        ? await createPet(payload)
        : await updatePet(pet!.id, payload);

    await queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["highlighted-days"] });
    await queryClient.invalidateQueries({ queryKey: ["daycare-stays"] });
    await queryClient.invalidateQueries({ queryKey: ["daycare-highlighted-days"] });
    await queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
    await queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
    await queryClient.invalidateQueries({ queryKey: ["pos-client"] });
    await queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
    await queryClient.invalidateQueries({ queryKey: ["client-packages"] });

    toast.success(
      mode === "create"
        ? "Pet cadastrado com sucesso"
        : "Pet atualizado com sucesso",
    );

    onSuccess(saved);
    onClose();
  };

  const handleConfirmTransfer = async () => {
    if (!pendingPetPayload || !pet) return;
    setIsSubmitting(true);
    try {
      if (selectedTargetPetId) {
        // Transfer all active packages to the selected pet
        for (const pkg of activePackages) {
          await transferClientPackage(pkg.id, Number(selectedTargetPetId));
        }
        toast.success("Pacotes transferidos com sucesso!");
      } else {
        // Deactivate all active packages
        for (const pkg of activePackages) {
          await deactivateClientPackage(pkg.id);
        }
        toast.success("Pacotes desativados.");
      }

      await savePetAndFinish(pendingPetPayload);
      setShowTransferDialog(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: PetFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        birth_date: brDateToISO(data.birth_date),
        gender: data.gender === "unknown" ? "other" : data.gender,
      };

      if (mode === "edit" && pet && payload.is_deceased && !pet.is_deceased) {
        const pkgs = await listClientPackagesByPet(pet.id);
        const activePkgs = pkgs.filter((p) => p.is_active);
        if (activePkgs.length > 0) {
          const clientPets = await fetchPetsByClient(pet.client_id);
          const siblingPets = clientPets.filter((p) => p.id !== pet.id && !p.is_deceased);

          setActivePackages(activePkgs);
          setOtherPets(siblingPets);
          setPendingPetPayload(payload);
          setSelectedTargetPetId("");
          setShowTransferDialog(true);
          setIsSubmitting(false);
          return;
        }
      }

      await savePetAndFinish(payload);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Dialog
        open={open}
        fullScreen={isMobile}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", md: showAdditionalInfo ? "85%" : "500px" },
              maxWidth: { xs: "100%", md: "1200px" },
              minWidth: { xs: "unset", md: showAdditionalInfo ? "750px" : "450px" },
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
            {mode === "create" ? "Novo Pet" : "Editar Pet"}
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
        <PetForm
          open={open}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          showAdditionalInfo={showAdditionalInfo}
          setShowAdditionalInfo={setShowAdditionalInfo}
          clients={clients}
          selectedClient={client}
        />
      </DialogContent>
    </Dialog>
      
      {/* Diálogo de transferência de pacotes/créditos */}
      <Dialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: "text.primary" }}>Pacotes de Serviços Ativos</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: "text.primary" }}>
            Este pet possui {activePackages.length} pacote(s) ativo(s). Como deseja proceder?
          </DialogContentText>
          {otherPets.length > 0 ? (
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel id="transfer-pet-label" sx={{ color: "text.primary" }}>Transferir para outro pet</InputLabel>
              <Select
                labelId="transfer-pet-label"
                value={selectedTargetPetId}
                label="Transferir para outro pet"
                onChange={(e) => setSelectedTargetPetId(e.target.value as number)}
                sx={{ color: "text.primary" }}
              >
                <MenuItem value="" sx={{ color: "text.primary" }}>
                  <em>Não transferir (desativar pacotes)</em>
                </MenuItem>
                {otherPets.map((p) => (
                  <MenuItem key={p.id} value={p.id} sx={{ color: "text.primary" }}>
                    {p.name} ({p.species === "Canino" ? "Cão" : p.species === "Felino" ? "Gato" : p.species})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontStyle: "italic" }}>
              Nenhum outro pet cadastrado para este tutor. Os pacotes serão desativados.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowTransferDialog(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmTransfer}
            loading={isSubmitting}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
