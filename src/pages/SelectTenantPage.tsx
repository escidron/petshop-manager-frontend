import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, Stack, TextField, InputAdornment, IconButton, Card, Avatar } from "@mui/material";
import { Search, X, ArrowRight } from "lucide-react";
import { selectTenant } from "../api/services/auth";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import type { TenantOption } from "../features/tenants/types";

type LocationState = {
  selection_token: string;
  tenants: TenantOption[];
};

const AVATAR_COLORS = [
  "#4F46E5", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#3B82F6", // Blue
];

const SelectTenantPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();
  const toast = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const state = location.state as LocationState | null;

  if (!state?.selection_token || !state?.tenants?.length) {
    navigate("/login", { replace: true });
    return null;
  }

  const { selection_token, tenants } = state;

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [tenants, search]);

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (id: number) => {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
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
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "grey.200",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          bgcolor: "white",
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={900} color="primary.main" gutterBottom>
            Acessar Empresa
          </Typography>
          <Typography variant="body2" color="text.disabled" fontWeight={500}>
            Sua conta possui múltiplos estabelecimentos. Selecione um para continuar.
          </Typography>
        </Box>

        {tenants.length > 5 && (
          <TextField
            fullWidth
            placeholder="Pesquisar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "#F8FAFC",
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94A3B8" />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        <Box
          sx={{
            height: tenants.length > 5 ? "360px" : "auto",
            overflowY: "auto",
            pr: 0.5,
            mr: -0.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#CBD5E1",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#94A3B8",
            },
          }}
        >
          <Stack spacing={1.5}>
            {filteredTenants.map((tenant) => (
              <Box
                key={tenant.id}
                onClick={() => loadingId === null && handleSelect(tenant)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "grey.100",
                  bgcolor: "white",
                  cursor: loadingId !== null ? "not-allowed" : "pointer",
                  opacity: loadingId !== null && loadingId !== tenant.id ? 0.5 : 1,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(49, 52, 133, 0.02)",
                    transform: loadingId === null ? "translateX(4px)" : "none",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2.5,
                    bgcolor: getAvatarBg(tenant.id),
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0,
                  }}
                  variant="rounded"
                >
                  {getInitials(tenant.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    fontWeight={600}
                    color="text.primary"
                    noWrap
                    sx={{ fontSize: "0.95rem" }}
                  >
                    {tenant.name}
                  </Typography>
                </Box>
                {loadingId === tenant.id ? (
                  <Typography variant="caption" color="primary.main" fontWeight={600}>
                    Entrando...
                  </Typography>
                ) : (
                  <ArrowRight size={18} className="arrow-icon" style={{ opacity: 0.3, transition: "opacity 0.2s" }} />
                )}
              </Box>
            ))}

            {filteredTenants.length === 0 && (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography color="text.disabled" variant="body2">
                  Nenhum estabelecimento encontrado
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ cursor: "pointer", fontWeight: 500, "&:hover": { color: "primary.main" } }}
            onClick={() => navigate("/login")}
          >
            Voltar para o login
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default SelectTenantPage;
