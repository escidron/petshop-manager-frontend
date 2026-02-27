import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/Button/Button";
import ClientePersonalInfo from "../features/clients/ClientePersonalInfo";
import PetDetailsCard from "../features/pets/PetDetailsCard";
import { Plus } from "lucide-react";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import { useClient } from "../hooks/useClient";
import { deletePet } from "../api/services/pets";
import PetFormModal from "../features/pets/PetFormModal";
import type { Pet } from "../features/pets/types";

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { client, pets, loading, refetchPets } = useClient(parseInt(id!));

  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pet?: Pet;
  }>({ open: false, mode: "create" });

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;

    try {
      setDeleting(true);
      await deletePet(petToDelete.id);
      await refetchPets();
      setPetToDelete(null);
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
        width: "60%",
        maxWidth: "1200px",
        mx: "auto",
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <ClientePersonalInfo client={client} />
      <Divider />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ width: "60%", minWidth: "550px" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Pets
            </Typography>

            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => {
                setPetModal({ open: true, mode: "create" });
              }}
            >
              Novo Pet
            </Button>
          </Box>
          {pets.map((pet) => (
            <PetDetailsCard
              key={pet.id}
              pet={pet}
              onEdit={(pet) => {
                setPetModal({
                  open: true,
                  mode: "edit",
                  pet,
                });
              }}
              onDelete={(pet) => setPetToDelete(pet)}
            />
          ))}
        </Box>
        <Box sx={{ width: "40%" }}></Box>
      </Box>

      <PetFormModal
        open={petModal.open}
        mode={petModal.mode}
        pet={petModal.pet}
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
    </Box>
  );
}
