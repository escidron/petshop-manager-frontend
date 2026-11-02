import { Box, Chip, CircularProgress, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";
import { useToast } from "../hooks/useToast";
import { useServices } from "../hooks/useServices";
import { useQueryClient } from "@tanstack/react-query";
import ServiceDeleteModal from "../features/tenant_services/ServiceDeleteModal";
import ServiceTable from "../features/tenant_services/ServiceTable";
import ServiceFormModal from "../features/tenant_services/ServiceFormModal";
import ServiceToolbar from "../features/tenant_services/ServiceToolbar";
import ServiceLibraryModal from "../features/tenant_services/ServiceLibraryModal";
import ServiceMigrationWizardModal from "../features/tenant_services/ServiceMigrationWizardModal";
import DaycareModalitiesSection from "../features/daycare/DaycareModalitiesSection";
import type { Service } from "../features/tenant_services/types";
import { deleteService } from "../api/services/tenant_services";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"grooming" | "daycare">("grooming");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const toast = useToast();
  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    service?: Service;
  }>({ open: false, mode: "create" });
  const queryClient = useQueryClient();
  const { services, loading, getServices } = useServices();

  const filteredRows = useMemo(() => {
    if (!search) return services;

    const term = search.toLowerCase();
    return services.filter((service) =>
      service.name.toLowerCase().includes(term)
    );
  }, [services, search]);

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setDeleting(true);
      await deleteService(serviceToDelete.id);
      await getServices();
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      setServiceToDelete(null);
      toast.success("Serviço removido com sucesso");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1200px",
      }}
    >
      {/* ABAS: BANHO E TOSA | CRECHE */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 2.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              minHeight: 44,
            },
          }}
        >
          <Tab value="grooming" label="Banho e Tosa" />
          <Tab value="daycare" label="Creche" />
        </Tabs>
      </Box>

      {activeTab === "grooming" ? (
        <>
          <ServiceToolbar
            search={search}
            onSearchChange={setSearch}
            onCreate={() =>
              setServiceModal({ open: true, mode: "create", service: undefined })
            }
            onImportLibrary={() => setIsLibraryOpen(true)}
            onOpenWizard={() => setWizardOpen(true)}
          />

          <ServiceTable
            rows={filteredRows}
            loading={loading}
            onEdit={(service) =>
              setServiceModal({ open: true, mode: "edit", service })
            }
            onDelete={(service) => setServiceToDelete(service)}
          />

          {serviceModal.open && (
            <ServiceFormModal
              open
              mode={serviceModal.mode}
              service={serviceModal.service}
              onClose={() =>
                setServiceModal((prev) => ({ ...prev, open: false }))
              }
              onSuccess={() => {
                setServiceModal((prev) => ({ ...prev, open: false }));
                getServices();
                queryClient.invalidateQueries({ queryKey: ["services"] });
                queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
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
              queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
            }}
          />

          <ServiceMigrationWizardModal
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            onJobStarted={(id) => {
              setActiveJobId(id);
              setIsLibraryOpen(true);
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
        </>
      ) : (
        <DaycareModalitiesSection />
      )}
    </Box>
  );
}
