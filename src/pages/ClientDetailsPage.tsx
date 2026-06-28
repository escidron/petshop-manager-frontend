import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/Button/Button";
import ClientePersonalInfo from "../features/clients/ClientePersonalInfo";
import PetDetailsCard from "../features/pets/PetDetailsCard";
import { Package, Plus } from "lucide-react";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import { useClient } from "../hooks/useClient";
import { deletePet } from "../api/services/pets";
import PetFormModal from "../features/pets/PetFormModal";
import PetPhotosModal from "../features/pets/PetPhotosModal";
import type { Pet } from "../features/pets/types";
import type { Package as PkgTemplate } from "../features/packages/types";
import type { ClientPackage } from "../features/client_packages/types";
import {
  listClientPackagesByPet,
} from "../api/services/client_packages";
import { listPackages } from "../api/services/packages";
import PetPackageCredits from "../features/client_packages/PetPackageCredits";
import ClientPackageSellModal from "../features/client_packages/ClientPackageSellModal";
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

  const [packageTemplates, setPackageTemplates] = useState<PkgTemplate[]>([]);
  const [petPackages, setPetPackages] = useState<Record<number, ClientPackage[]>>({});
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const [sellModal, setSellModal] = useState<{ open: boolean; petId?: number; packageId?: number }>({
    open: false,
  });
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [selectedPetForPhotos, setSelectedPetForPhotos] = useState<Pet | null>(null);

  useEffect(() => {
    listPackages().then(setPackageTemplates).catch(() => {});
  }, []);

  const fetchPetPackages = useCallback(async (petList: Pet[]) => {
    const entries = await Promise.all(
      petList.map(async (pet) => {
        const pkgs = await listClientPackagesByPet(pet.id).catch(() => []);
        return [pet.id, pkgs] as [number, ClientPackage[]];
      }),
    );
    setPetPackages(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    if (pets.length > 0) fetchPetPackages(pets);
  }, [pets, fetchPetPackages]);

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

  const handlePackageSellSuccess = () => {
    if (sellModal.petId) {
      listClientPackagesByPet(sellModal.petId)
        .then((pkgs) =>
          setPetPackages((prev) => ({ ...prev, [sellModal.petId!]: pkgs })),
        )
        .catch(() => {});
    }
    setRefreshHistoryTrigger((prev) => prev + 1);
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 4,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
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

              {/* Pacotes do pet */}
              <Box
                sx={{
                  mt: 1,
                  mb: 2,
                  pl: 1,
                  borderLeft: "3px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Package size={14} />
                    <Typography variant="body2" fontWeight={600}>
                      Pacotes ativos
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={13} />}
                    sx={{ height: 28 }}
                    onClick={() => setSellModal({ open: true, petId: pet.id })}
                  >
                    Vender Pacote
                  </Button>
                </Box>

                <PetPackageCredits
                  packages={petPackages[pet.id] ?? []}
                  clientPhone={client.phone}
                  onRefresh={() =>
                    listClientPackagesByPet(pet.id)
                      .then((pkgs) =>
                        setPetPackages((prev) => ({ ...prev, [pet.id]: pkgs })),
                      )
                      .catch(() => {})
                  }
                />
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ width: "40%" }}>
          <ClientHistory
            clientId={parseInt(id!)}
            refreshTrigger={refreshHistoryTrigger}
            onSellPackage={(petId, packageId) => setSellModal({ open: true, petId, packageId })}
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

      <ClientPackageSellModal
        open={sellModal.open}
        onClose={() => setSellModal({ open: false })}
        onSuccess={handlePackageSellSuccess}
        pets={pets}
        packages={packageTemplates}
        defaultPetId={sellModal.petId}
        defaultPackageId={sellModal.packageId}
      />

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
