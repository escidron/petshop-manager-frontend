import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import ClientForm from "./ClientForm";
import apiClient from "../../api/apiClient";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

type ClientFormModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ClientFormModal({
  open,
  onClose,
}: ClientFormModalProps) {
  const TENANT_ID = 1;

  const handleSubmit = async (data: {
    name: string;
    email: string;
    phone: string;
  }) => {
    try {
      const payload = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        is_active: true,
      };

      await apiClient.post("/api/v1/clients/", payload, {
        params: {
          tenant_id: TENANT_ID,
        },
      });

    //   await fetchClients();
      onClose();
    } catch (err) {
      console.error("Erro ao criar cliente", err);
    }
  };
  return (
    <>
      <BootstrapDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 2 }}>Novo Cliente</DialogTitle>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "grey.500",
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent dividers sx={{ bgcolor: "background.default" }}>
          <ClientForm onSubmit={handleSubmit} />
        </DialogContent>
      </BootstrapDialog>
    </>
  );
}
