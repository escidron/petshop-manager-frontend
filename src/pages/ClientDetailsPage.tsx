import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/Button/Button";
import ClientePersonalInfo from "../features/clients/ClientePersonalInfo";
import PetDetailsCard from "../features/pets/PetDetailsCard";
import { ShoppingBag, Plus } from "lucide-react";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import { useClient } from "../hooks/useClient";
import { deletePet } from "../api/services/pets";
import PetFormModal from "../features/pets/PetFormModal";
import PetPhotosModal from "../features/pets/PetPhotosModal";
import type { Pet } from "../features/pets/types";
import type { ClientPackage } from "../features/client_packages/types";
import {
  listClientPackagesByClient,
} from "../api/services/client_packages";
import PetPackageCredits from "../features/client_packages/PetPackageCredits";
import { useToast } from "../hooks/useToast";
import axios from "axios";
import ClientHistory from "../features/clients/ClientHistory";
import ClientFormModal from "../features/clients/ClientFormModal";

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { client, pets, loading, refetchPets, refetchClient } = useClient(parseInt(id!));

  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pet?: Pet;
  }>({ open: false, mode: "create" });

  const [clientModal, setClientModal] = useState({ open: false });
  const [refreshHistoryTrigger] = useState(0);
  const [selectedPetForPhotos, setSelectedPetForPhotos] = useState<Pet | null>(null);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);

  const clientId = parseInt(id!);
  const queryClient = useQueryClient();

  const { data: clientPackages = [] } = useQuery<ClientPackage[]>({
    queryKey: ["clientPackages", clientId],
    queryFn: () => listClientPackagesByClient(clientId),
    enabled: !!id,
  });

  const fetchClientPackages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clientPackages", clientId] });
  }, [queryClient, clientId]);

  const toast = useToast();

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;
    try {
      setDeleting(true);
      await deletePet(petToDelete.id);
      toast.success("Pet excluído com sucesso");
      await refetchPets();
      setPetToDelete(null);
    } catch (error: unknown) {
      let message = "Erro ao excluir pet";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail || message;
      }
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !client) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1400px",
        mx: "auto",
        p: 3,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ gap: 4 }}>
        <Box sx={{ width: "60%", minWidth: "550px" }}>
          <ClientePersonalInfo 
            client={client} 
            onEdit={() => setClientModal({ open: true })}
          />

          {/* Pacotes Ativos */}
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <ShoppingBag size={20} />
              <Typography variant="h6" fontWeight={600}>
                Pacotes
              </Typography>
            </Box>
            <PetPackageCredits
              packages={clientPackages.filter((p) => p.is_active)}
              clientPhone={client.phone}
              onRefresh={fetchClientPackages}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 4,
            }}
          >
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mt: 1 }}>
              Pets
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setPetModal({ open: true, mode: "create" })}
            >
              Novo Pet
            </Button>
          </Box>

          {pets.map((pet) => (
            <Box key={pet.id}>
              <PetDetailsCard
                pet={pet}
                onEdit={(p) => setPetModal({ open: true, mode: "edit", pet: p })}
                onDelete={(p) => setPetToDelete(p)}
                onPhotoUploadSuccess={refetchPets}
                onViewPhotos={(p) => {
                  setSelectedPetForPhotos(p);
                  setPhotosModalOpen(true);
                }}
              />

            </Box>
          ))}

        </Box>

        <Box sx={{ width: "40%" }}>
          <ClientHistory
            clientId={parseInt(id!)}
            refreshTrigger={refreshHistoryTrigger}
          />
        </Box>
      </Box>

      <PetFormModal
        open={petModal.open}
        mode={petModal.mode}
        pet={petModal.pet}
        client={client}
        onClose={() => setPetModal({ open: false, mode: "create" })}
        onSuccess={async () => {
          await refetchPets();
          setPetModal({ open: false, mode: "create" });
        }}
      />

      {petToDelete && (
        <PetDeleteModal
          open={!!petToDelete}
          pet={petToDelete}
          loading={deleting}
          onCancel={() => setPetToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <ClientFormModal
        open={clientModal.open}
        mode="edit"
        client={client}
        onClose={() => setClientModal({ open: false })}
        onSuccess={async () => {
          await refetchClient();
          setClientModal({ open: false });
        }}
      />

      {selectedPetForPhotos && (
        <PetPhotosModal
          pet={pets.find((p) => p.id === selectedPetForPhotos.id) || selectedPetForPhotos}
          open={photosModalOpen}
          onClose={() => {
            setPhotosModalOpen(false);
            setSelectedPetForPhotos(null);
          }}
          onRefresh={refetchPets}
        />
      )}
    </Box>
  );
}
