import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ClientsToolbar from "../features/clients/ClientsToolbar";
import ClientsTable from "../features/clients/ClientsTable";
import ClientFormModal from "../features/clients/ClientFormModal";
import ClientDeleteModal from "../features/clients/ClientDeleteModal";
import { useClients } from "../hooks/useClients";
import { deleteClient } from "../api/services/clients";
import PetFormModal from "../features/pets/PetFormModal";
import type { PetFormData } from "../features/pets/PetForm";
import { DEFAULT_PET_FORM } from "../features/pets/constants";
import type { Client } from "../features/clients/types";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [petForm, setPetForm] = useState<PetFormData>(DEFAULT_PET_FORM);

  const [clientModal, setClientModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    client?: Client;
  }>({ open: false, mode: "create" });

  const [petModal, setPetModal] = useState<{
    open: boolean;
    client?: Client;
  }>({ open: false });

  const { clients, loading, getClients } = useClients();
  const navigate = useNavigate();

  const filteredRows = useMemo(() => {
    if (!search) return clients;
    const term = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term),
    );
  }, [search, clients]);

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      await getClients();
      setClientToDelete(null);
    } finally {
      setDeleting(false);
    }
  };
  
  const resetPetForm = () => setPetForm(DEFAULT_PET_FORM);
  // const resetClientForm = () => setClientForm(DEFAULT_CLIENT_FORM);

  return (
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
      <ClientsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setClientModal({ open: true, mode: "create" })}
      />

      <ClientsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/clients/${id}`)}
        onEdit={(client) =>
          setClientModal({ open: true, mode: "edit", client })
        }
        onDelete={(client) => setClientToDelete(client)}
      />

      {/* CLIENT MODAL */}
      <ClientFormModal
        open={clientModal.open}
        mode={clientModal.mode}
        client={clientModal.client}
        onClose={() => setClientModal({ open: false, mode: "create" })}
        onSuccess={async () => {
          await getClients();
          setClientModal({ open: false, mode: "create" });
          resetPetForm();
        }}
        onSuccessAndAddPet={(client) => {
          setPetModal({ open: true, client: client });
        }}
      />

      {/* PET MODAL */}
      <PetFormModal
        open={petModal.open}
        client={petModal.client}
        onClose={() => setPetModal({ open: false })}
        onSuccess={() => {
          getClients();
          setPetModal({ open: false })
          setClientModal({ open: false, mode: "create" });
          resetPetForm();
          // resetClientForm();
        }}
        mode={"create"}
        petForm={petForm}
        setPetForm={setPetForm}
      />

      {clientToDelete && (
        <ClientDeleteModal
          open={!!clientToDelete}
          client={clientToDelete}
          loading={deleting}
          onCancel={() => setClientToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
