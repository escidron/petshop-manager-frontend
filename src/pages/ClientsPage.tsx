import { Box } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../api/apiClient";
import ClientsToolbar from "../features/clients/ClientsToolbar";
import ClientsTable from "../features/clients/ClientsTable";

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
      <ClientsToolbar search={search} onSearchChange={setSearch} />

      <ClientsTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/clients/${id}`)}
      />
    </Box>
  );
}
