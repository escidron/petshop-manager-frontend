import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import PetsTable from "../features/pets/PetsTable";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import PetFormModal from "../features/pets/PetFormModal";

import { usePets } from "../hooks/usePets";
import { deletePet } from "../api/services/pets";
import PetsToolbar from "../features/pets/PetsToolbar";
import type { Pet } from "../features/pets/types";
import { useToast } from "../hooks/useToast";

export default function PetsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const toast = useToast();
  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pet?: Pet;
  }>({ open: false, mode: "create" });
  const { pets, loading, getPets } = usePets();
  const navigate = useNavigate();

  const filteredRows = useMemo(() => {
    if (!search) return pets;

    const term = search.toLowerCase();
    return pets.filter((pet) => pet.name.toLowerCase().includes(term));
  }, [pets, search]);

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;

    try {
      setDeleting(true);
      await deletePet(petToDelete.id);
      await getPets();
      setPetToDelete(null);
      toast.success("Pet removido com sucesso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "60%", mx: "auto", p: 3,maxWidth: "1200px" }}>
      <PetsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setPetModal({ open: true, mode: "create" })}
      />

      <PetsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/pets/${id}`)}
        onEdit={(pet) => setPetModal({ open: true, mode: "edit", pet })}
        onDelete={(pet) => setPetToDelete(pet)}
      />

      {petModal.open && (
        <PetFormModal
          open={petModal.open}
          mode={petModal.mode}
          pet={petModal.pet}
          onClose={() => setPetModal({ open: false, mode: "create" })}
          onSuccess={async () => {
            await getPets();
            setPetModal({ open: false, mode: "create" });
          }}
        />
      )}

      {/* Delete Modal */}
      {petToDelete && (
        <PetDeleteModal
          open
          pet={petToDelete}
          loading={deleting}
          onCancel={() => setPetToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
