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
import { useToast } from "../hooks/useToast";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import ImportClientsModal from "../features/clients/ImportClientsModal";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
  const queryClient = useQueryClient();

  const { clients, loading, getClients } = useClients();
  const navigate = useNavigate();

  const filteredRows = useMemo(() => {
    if (!search) return clients;
    const term = search.toLowerCase();
    const normalizedTerm = term.replace(/\D/g, "");

    return clients.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(term);
      const emailMatch = c.email?.toLowerCase().includes(term);

      const normalizedPhone = c.phone?.replace(/\D/g, "") || "";
      const phoneMatch = normalizedTerm
        ? normalizedPhone.includes(normalizedTerm)
        : false;

      return (
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        c.phone?.toLowerCase().includes(term)
      );
    });
  }, [search, clients]);

  const toast = useToast();

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      toast.success("Cliente excluído com sucesso");
      await getClients();
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setClientToDelete(null);
    } catch (error: unknown) {
      let message = "Erro ao excluir cliente";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail || message;
      }
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <ClientsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setClientModal({ open: true, mode: "create", client: undefined })}
        onImport={() => setImportOpen(true)}
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
          }))
        }
        onSuccess={async () => {
          await getClients();
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          setClientModal((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        onSuccessAndAddPet={async (client) => {
          await getClients();
          queryClient.invalidateQueries({ queryKey: ["clients"] });
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

      <ImportClientsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={async () => {
          await getClients();
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </Box>
  );
}
