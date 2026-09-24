import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import { X, CheckCircle2 } from "lucide-react";
import TenantCreateForm from "./TenantForm";
import type { TenantFormData } from "./types";
import { createMyNewTenant } from "../../api/services/tenants";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Props = {
  open: boolean;
  onClose: () => void;
};

const NewTenantModal = ({ open, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      await createMyNewTenant(data, "FREE_TRIAL");
      await checkAuth();
      toast.success("Estabelecimento criado! Você já está acessando o novo petshop.");
      onClose();
      navigate("/dashboard");
    } catch (error) {
      let message = "Erro ao criar estabelecimento";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, maxHeight: "90vh" } }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              Novo estabelecimento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adicione outra petshop à sua conta
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Fechar">
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, overflowY: "auto" }}>
        {/* Banner informativo de 1 mês de teste grátis */}
        <Box
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(49, 52, 133, 0.05) 0%, rgba(79, 70, 229, 0.08) 100%)",
            border: "1.5px solid rgba(49, 52, 133, 0.15)",
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.3 }}>
              1º mês grátis para experimentar
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", mt: 0.3, lineHeight: 1.4 }}>
              Seu novo petshop começará automaticamente com 30 dias de teste gratuito, sem necessidade de cartão agora.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#166534", fontSize: "0.75rem", fontWeight: 700 }}>
                <CheckCircle2 size={13} strokeWidth={2.5} />
                <span>30 dias livres</span>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#166534", fontSize: "0.75rem", fontWeight: 700 }}>
                <CheckCircle2 size={13} strokeWidth={2.5} />
                <span>Sem cobrança imediata</span>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#166534", fontSize: "0.75rem", fontWeight: 700 }}>
                <CheckCircle2 size={13} strokeWidth={2.5} />
                <span>Acesso completo</span>
              </Box>
            </Box>
          </Box>
        </Box>

        <TenantCreateForm onSubmit={handleSubmit} loading={loading} sx={{ mt: 1 }} />
      </DialogContent>
    </Dialog>
  );
};

export default NewTenantModal;
