import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useEffect, useState } from "react";

import { Button } from "../../components/Button/Button";
import { DEFAULT_SERVICE_FORM } from "./constants";
import { useToast } from "../../hooks/useToast";
import type { Service } from "../../pages/ServicesPage";
import type { ServiceFormData } from "./ServiceForm";
import ServiceForm from "./ServiceForm";
import {
  createService,
  updateService,
} from "../../api/services/tenant_services";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  service?: Service;
  serviceForm: ServiceFormData;
  setServiceForm: (data: ServiceFormData) => void;
  onClose: () => void;
  onSuccess: (service: Service) => void;
};

export default function ServiceFormModal({
  open,
  mode,
  service,
  serviceForm,
  setServiceForm,
  onClose,
  onSuccess,
}: Props) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (mode === "edit" && service) {
      setServiceForm({
        name: service.name,
        description: service.description,
        price_cents: service.price_cents,
        duration_minutes: service.duration_minutes,
        type: service.type,
      });
    }

    if (mode === "create") {
      setServiceForm(DEFAULT_SERVICE_FORM);
    }
  }, [mode, service, setServiceForm]);

  const handleSave = async () => {
    if (!serviceForm.name.trim()) return;

    try {
      setSaving(true);

      if (mode === "create") {
        const createdService = await createService({
          ...serviceForm,
        });

        onSuccess(createdService);
        toast.success("Serviço cadastrado com sucesso");
      }

      if (mode === "edit" && service) {
        const updated = await updateService(service.id, serviceForm);
        onSuccess(updated);
        toast.success("Serviço atualizado com sucesso");
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === "create" ? "Cadastrar serviço" : "Editar serviço"}
      </DialogTitle>

      <DialogContent>
        <ServiceForm service={serviceForm} onChange={setServiceForm} />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button variant="text" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button onClick={handleSave} loading={saving}>
          {mode === "create" ? "Salvar" : "Atualizar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
