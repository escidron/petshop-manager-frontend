import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import PetsTable from "../features/pets/PetsTable";
import PetDeleteModal from "../features/pets/PetDeleteModal";
import PetFormModal from "../features/pets/PetFormModal";

import { usePets } from "../hooks/usePets";
import { deletePet } from "../api/services/pets";
import PetsToolbar from "../features/pets/PetsToolbar";

export type Pet = {
  id: number;
  name: string;
  species?: "dog" | "cat" | "other";
  gender?: "male" | "female";
  breed: string;
  age: number;
  ageUnit: "year" | "month" | "day";
  owner_name?: string;
  client_id?: number;
};

export default function PetsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode?: "create" | "edit";
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
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
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

      {/* Create / Edit Modal */}
      {petModal.open && (
        <PetFormModal
          open
          mode={petModal.mode ? petModal.mode : "create"}
          pet={petModal.mode === "edit" ? petModal.pet : undefined}
          onClose={() => setPetModal({ open: false })}
          onSuccess={() => {
            setPetModal({ open: false });
            getPets();
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
