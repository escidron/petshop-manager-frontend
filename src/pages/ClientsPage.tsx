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
import type { Client } from "../features/clients/types";
import type { Pet } from "../features/pets/types";
import { usePets } from "../hooks/usePets";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { getPets } = usePets();
  const [clientModal, setClientModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    client?: Client;
  }>({ open: false, mode: "create" });

  const [petModal, setPetModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    pet?: Pet;
  }>({ open: false, mode: "create" });

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

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
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
        onClose={() =>
          setClientModal((prev) => ({
            ...prev,
            open: false,
            mode: "create",
          }))
        }
        onSuccess={async () => {
          await getClients();
          setClientModal({ open: false, mode: "create" });
        }}
        onSuccessAndAddPet={async (client) => {
          await getClients();
          setClientModal({ open: false, mode: "create", client });
          setPetModal({ open: true, mode: "create" });
        }}
      />

      {/* PET MODAL */}
      <PetFormModal
        open={petModal.open}
        mode={petModal.mode}
        pet={petModal.pet}
        client={clientModal.client}
        onClose={() => setPetModal({ open: false, mode: "create" })}
        onSuccess={async () => {
          await getPets();
          setPetModal({ open: false, mode: "create" });
        }}
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
