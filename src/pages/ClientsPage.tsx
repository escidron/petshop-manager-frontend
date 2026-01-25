import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ClientsToolbar from "../features/clients/ClientsToolbar";
import ClientsTable from "../features/clients/ClientsTable";
import ClientFormModal from "../features/clients/ClientFormModal";
import ClientDeleteModal from "../features/clients/ClientDeleteModal";
import { useClients } from "../hooks/useClients";
import { deleteClient } from "../api/services/clients";

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

export type Pet = {
  id: number;
  name: string;
  species: "dog" | "cat" | "other" | undefined;
  gender: "male" | "female" | undefined;
  breed: string;
  age: number;
  ageUnit: "year" | "month" | "day";
};

export type ModalState =
  | { open: false }
  | { open: true; mode: "create"; entity: "client" | "pet" }
  | { open: true; mode: "edit"; entity: "client"; client: Client }
  | { open: true; mode: "edit"; entity: "pet"; pet: Pet };

export type Step = "client" | "pet";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [step, setStep] = useState<Step>("client");
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
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
      <ClientsToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() =>
          setModalState({ open: true, mode: "create", entity: "client" })
        }
      />

      <ClientsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/clients/${id}`)}
        onEdit={(client) =>
          setModalState({ open: true, mode: "edit", entity: "client", client })
        }
        onDelete={(client) => setClientToDelete(client)}
      />

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
        onSuccess={getClients}
        step={step}
        setStep={setStep}
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
