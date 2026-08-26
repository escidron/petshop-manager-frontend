import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { Box } from "@mui/material";
import { useState } from "react";
import { sellPackageToPet } from "../../api/services/client_packages";
import { useQueryClient } from "@tanstack/react-query";
import type { Pet } from "../pets/types";
import type { Package } from "../packages/types";
import ClientPackageSellForm from "./ClientPackageSellForm";
import type { ClientPackageSellFormData } from "./schemas";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pets: Pet[];
  packages: Package[];
  defaultPetId?: number;
  defaultPackageId?: number;
};

export default function ClientPackageSellModal({
  open,
  onClose,
  onSuccess,
  pets,
  packages,
  defaultPetId,
  defaultPackageId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: ClientPackageSellFormData) => {
    try {
      setLoading(true);
      await sellPackageToPet(data);
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["client-packages"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-packages"] });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 3 }}
      >
        <Typography variant="h6">Vender Pacote</Typography>
        <Box sx={{ cursor: "pointer" }} onClick={onClose}>
          <X size={20} />
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <ClientPackageSellForm
          pets={pets}
          packages={packages}
          defaultPetId={defaultPetId}
          defaultPackageId={defaultPackageId}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
