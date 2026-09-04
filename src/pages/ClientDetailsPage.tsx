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
    queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
    queryClient.invalidateQueries({ queryKey: ["client-packages"] });
    queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
    queryClient.invalidateQueries({ queryKey: ["pos-client"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
    queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["unpaid-packages"] });
  }, [queryClient]);

  const toast = useToast();

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;
    try {
      setDeleting(true);
      await deletePet(petToDelete.id);
      toast.success("Pet excluído com sucesso");
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
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
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: { xs: 3, md: 3.5, lg: 4 },
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", lg: "60%" },
            minWidth: { xs: "unset", lg: "550px" },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2.5, sm: 3 },
          }}
        >
          <ClientePersonalInfo 
            client={client} 
            onEdit={() => setClientModal({ open: true })}
          />

          {/* Pets */}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="text.primary">
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

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pets.map((pet) => (
                <PetDetailsCard
                  key={pet.id}
                  pet={pet}
                  onEdit={(p) => setPetModal({ open: true, mode: "edit", pet: p })}
                  onDelete={(p) => setPetToDelete(p)}
                  onPhotoUploadSuccess={refetchPets}
                  onViewPhotos={(p) => {
                    setSelectedPetForPhotos(p);
                    setPhotosModalOpen(true);
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Pacotes Ativos */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
              }}
            >
              <ShoppingBag size={20} />
              <Typography variant="h6" fontWeight={700}>
                Pacotes
              </Typography>
            </Box>
            <PetPackageCredits
              packages={clientPackages.filter((p) => p.is_active)}
              clientPhone={client.phone}
              onRefresh={fetchClientPackages}
            />
          </Box>
        </Box>

        <Box sx={{ width: { xs: "100%", lg: "40%" } }}>
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
          await queryClient.invalidateQueries({ queryKey: ["pets"] });
          await queryClient.invalidateQueries({ queryKey: ["clients"] });
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
