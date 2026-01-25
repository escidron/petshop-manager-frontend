import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/Button/Button";
import type { ModalState, Pet, Step } from "./ClientsPage";
import ClientePersonalInfo from "../features/clients/ClientePersonalInfo";
import PetDetailsCard from "../features/pets/PetDetailsCard";
import { Plus } from "lucide-react";
import ClientFormModal from "../features/clients/ClientFormModal";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import { useClient } from "../hooks/useClient";
import { deletePet } from "../api/services/pets";

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [step, setStep] = useState<Step>("client");
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { client, pets, loading, refetchPets } = useClient(parseInt(id!));

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
        maxWidth: "60%",
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
                setStep("pet");
                setModalState({ open: true, mode: "create", entity: "pet" });
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
                setStep("pet");
                setModalState({
                  open: true,
                  mode: "edit",
                  entity: "pet",
                  pet,
                });
              }}
              onDelete={(pet) => setPetToDelete(pet)}
            />
          ))}
        </Box>
        <Box sx={{ width: "40%" }}></Box>
      </Box>

      <ClientFormModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : "create"}
        client={
          modalState.open &&
          modalState.mode === "edit" &&
          modalState.entity === "client"
            ? modalState.client
            : undefined
        }
        pet={
          modalState.open &&
          modalState.mode === "edit" &&
          modalState.entity === "pet"
            ? modalState.pet
            : undefined
        }
        onClose={() => setModalState({ open: false })}
        onSuccess={refetchPets}
        step={step}
        setStep={setStep}
        existingClientId={client.id}
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
