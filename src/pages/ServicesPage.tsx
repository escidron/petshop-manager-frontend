import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useToast } from "../hooks/useToast";
import { useServices } from "../hooks/useServices";
import { useQueryClient } from "@tanstack/react-query";
import ServiceDeleteModal from "../features/tenant_services/ServiceDeleteModal";
import ServiceTable from "../features/tenant_services/ServiceTable";
import ServiceFormModal from "../features/tenant_services/ServiceFormModal";
import ServiceToolbar from "../features/tenant_services/ServiceToolbar";
import type { Service } from "../features/tenant_services/types";
import { deleteService } from "../api/services/tenant_services";

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const toast = useToast();
  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    service?: Service;
  }>({ open: false, mode: "create" });
  const queryClient = useQueryClient();
  const { services, loading, getServices } = useServices();
  const navigate = useNavigate();

  const filteredRows = useMemo(() => {
    if (!search) return services;

    const term = search.toLowerCase();
    return services.filter((service) =>
      service.name.toLowerCase().includes(term),
    );
  }, [services, search]);

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setDeleting(true);
      await deleteService(serviceToDelete.id);
      await getServices();
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setServiceToDelete(null);
      toast.success("Serviço removido com sucesso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <ServiceToolbar
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setServiceModal({ open: true, mode: "create" })}
      />

      <ServiceTable
        rows={filteredRows}
        loading={loading}
        onRowClick={(id) => navigate(`/registration/pets/${id}`)}
        onEdit={(service) =>
          setServiceModal({ open: true, mode: "edit", service })
        }
        onDelete={(service) => setServiceToDelete(service)}
      />

      {serviceModal.open && (
        <ServiceFormModal
          open={serviceModal.open}
          mode={serviceModal.mode}
          service={serviceModal.service}
          onClose={() => setServiceModal({ open: false, mode: "create" })}
          onSuccess={async () => {
            await getServices();
            queryClient.invalidateQueries({ queryKey: ["services"] });
            setServiceModal({ open: false, mode: "create" });
          }}
        />
      )}

      {/* Delete Modal */}
      {serviceToDelete && (
        <ServiceDeleteModal
          open
          service={serviceToDelete}
          loading={deleting}
          onCancel={() => setServiceToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
