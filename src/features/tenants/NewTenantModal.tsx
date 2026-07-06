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
import { X } from "lucide-react";
import TenantCreateForm from "./TenantForm";
import type { TenantFormData } from "./types";
import type { PlanCode } from "../plans/types";
import { createMyNewTenant } from "../../api/services/tenants";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Props = {
  open: boolean;
  onClose: () => void;
};

const PLANS: { code: PlanCode; label: string; description: string }[] = [
  { code: "FREE_TRIAL", label: "Teste Grátis", description: "14 dias sem cartão" },
  { code: "MONTHLY", label: "Mensal", description: "R$ 99,90/mês" },
];

const NewTenantModal = ({ open, onClose }: Props) => {
  const [planCode, setPlanCode] = useState<PlanCode>("FREE_TRIAL");
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: TenantFormData) => {
    setLoading(true);
    try {
      await createMyNewTenant(data, planCode);
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
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              Novo estabelecimento
            </Typography>
            <Typography variant="body2" color="text.primary">
              Adicione outra petshop à sua conta
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Seletor de plano compacto */}
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
          Plano
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
          {PLANS.map((plan) => (
            <Box
              key={plan.code}
              onClick={() => setPlanCode(plan.code)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                border: "2px solid",
                borderColor: planCode === plan.code ? "primary.main" : "divider",
                bgcolor: planCode === plan.code ? "primary.main" : "background.paper",
                color: planCode === plan.code ? "white" : "text.primary",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                {plan.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {plan.description}
              </Typography>
            </Box>
          ))}
        </Box>

        <TenantCreateForm onSubmit={handleSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
};

export default NewTenantModal;
