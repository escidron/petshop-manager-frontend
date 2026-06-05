import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, Stack } from "@mui/material";
import { Store } from "lucide-react";
import { selectTenant } from "../api/services/auth";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import type { TenantOption } from "../features/tenants/types";

type LocationState = {
  selection_token: string;
  tenants: TenantOption[];
};

const SelectTenantPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();
  const toast = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const state = location.state as LocationState | null;

  if (!state?.selection_token || !state?.tenants?.length) {
    navigate("/login", { replace: true });
    return null;
  }

  const { selection_token, tenants } = state;

  const handleSelect = async (tenant: TenantOption) => {
    setLoadingId(tenant.id);
    try {
      const user = await selectTenant(selection_token, tenant.id);
      setUser(user);
      await checkAuth();
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Não foi possível acessar essa empresa. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F8FAFC",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        <Box sx={{ mb: 5, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={900} color="primary.main" gutterBottom>
            Qual empresa deseja acessar?
          </Typography>
          <Typography variant="body1" color="text.primary">
            Sua conta possui múltiplos estabelecimentos. Selecione um para continuar.
          </Typography>
        </Box>

        <Stack spacing={2}>
          {tenants.map((tenant) => (
            <Box
              key={tenant.id}
              onClick={() => loadingId === null && handleSelect(tenant)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "white",
                cursor: loadingId !== null ? "not-allowed" : "pointer",
                opacity: loadingId !== null && loadingId !== tenant.id ? 0.5 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 4px 16px rgba(49,52,133,0.12)",
                  transform: loadingId === null ? "translateY(-1px)" : "none",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Store size={22} color="white" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} color="text.primary">
                  {tenant.name}
                </Typography>
              </Box>
              {loadingId === tenant.id && (
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  Entrando...
                </Typography>
              )}
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
            onClick={() => navigate("/login")}
          >
            Voltar para o login
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SelectTenantPage;
