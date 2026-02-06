import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { deleteProduct } from "../api/services/products";
import { useToast } from "../hooks/useToast";
import type { ServiceFormData } from "../features/tenant_services/ServiceForm";
import { DEFAULT_SERVICE_FORM } from "../features/tenant_services/constants";
import { useServices } from "../hooks/useServices";
import ServiceDeleteModal from "../features/tenant_services/ServiceDeleteModal";
import ServiceTable from "../features/tenant_services/ServiceTable";
import ServiceFormModal from "../features/tenant_services/ServiceFormModal";
import ServiceToolbar from "../features/tenant_services/ServiceToolbar";


export type Service = {
  id: number;
  name: string;
  description?: string;
  duration_minutes?:number  
  price_cents?:number
  type: "BATH" | "GROOMING" | "BATH_GROOMING"
};

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] =
    useState<ServiceFormData>(DEFAULT_SERVICE_FORM);
  const toast = useToast();
  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    mode?: "create" | "edit";
    service?: Service;
  }>({ open: false, mode: "create" });
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
      await deleteProduct(serviceToDelete.id);
      await getServices();
      setServiceToDelete(null);
      toast.success("Seriço apagado com sucesso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: "60%", mx: "auto", p: 3 }}>
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

      {/* Create / Edit Modal */}
      {serviceModal.open && (
        <ServiceFormModal
          open
          mode={serviceModal.mode ? serviceModal.mode : "create"}
          service={
            serviceModal.mode === "edit" ? serviceModal.service : undefined
          }
          onClose={() => setServiceModal({ open: false })}
          onSuccess={() => {
            setServiceModal({ open: false });
            getServices();
          }}
          serviceForm={serviceForm}
          setServiceForm={setServiceForm}
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
