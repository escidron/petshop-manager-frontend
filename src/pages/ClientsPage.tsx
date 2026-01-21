import { Box } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../api/apiClient";
import ClientsToolbar from "../features/clients/ClientsToolbar";
import ClientsTable from "../features/clients/ClientsTable";
import ClientFormModal from "../features/clients/ClientFormModal";
import ClientDeleteModal from "../features/clients/ClientDeleteModal";

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; client: Client };

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleting, setDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Client[]>("/api/v1/clients/", {
        params: { tenant_id: 1 },
      });
      setRows(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const term = search.toLowerCase();
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term),
    );
  }, [search, rows]);

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/api/v1/clients/${clientToDelete.id}`, {
        params: { tenant_id: 1 },
      });
      fetchClients();
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
        onCreate={() => setModalState({ open: true, mode: "create" })}
      />

      <ClientsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/clients/${id}`)}
        onEdit={(client) => setModalState({ open: true, mode: "edit", client })}
        onDelete={(client) => setClientToDelete(client)}
      />

      <ClientFormModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : "create"}
        client={
          modalState.open && modalState.mode === "edit"
            ? modalState.client
            : undefined
        }
        onClose={() => setModalState({ open: false })}
        onSuccess={fetchClients}
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
