import { Box, Chip, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useToast } from "../hooks/useToast";
import { useServices } from "../hooks/useServices";
import { useQueryClient } from "@tanstack/react-query";
import ServiceDeleteModal from "../features/tenant_services/ServiceDeleteModal";
import ServiceTable from "../features/tenant_services/ServiceTable";
import ServiceFormModal from "../features/tenant_services/ServiceFormModal";
import ServiceToolbar from "../features/tenant_services/ServiceToolbar";
import ServiceLibraryModal from "../features/tenant_services/ServiceLibraryModal";
import type { Service } from "../features/tenant_services/types";
import { deleteService } from "../api/services/tenant_services";

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
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
        onCreate={() => setServiceModal({ open: true, mode: "create", service: undefined })}
        onImportLibrary={() => setIsLibraryOpen(true)}
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
          onClose={() => setServiceModal((prev) => ({ ...prev, open: false }))}
          onSuccess={async () => {
            await getServices();
            queryClient.invalidateQueries({ queryKey: ["services"] });
            setServiceModal((prev) => ({ ...prev, open: false }));
          }}
        />
      )}

      <ServiceLibraryModal
        open={isLibraryOpen}
        activeJobId={activeJobId}
        onJobStarted={(id) => setActiveJobId(id)}
        onJobFinished={() => setActiveJobId(null)}
        onClose={() => setIsLibraryOpen(false)}
        onSuccess={async () => {
          await getServices();
          queryClient.invalidateQueries({ queryKey: ["services"] });
        }}
      />

      {/* Persistent import progress chip when modal is closed */}
      {!isLibraryOpen && activeJobId && (
        <Chip
          icon={<CircularProgress size={14} color="inherit" />}
          label="Importação em andamento — clique para ver"
          color="primary"
          onClick={() => setIsLibraryOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1400,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: 3,
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
