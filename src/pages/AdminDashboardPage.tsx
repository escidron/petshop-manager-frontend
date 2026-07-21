import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
} from "@mui/material";
import {
  Search,
  Building,
  Users,
  PawPrint,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle,
  X,
  Shield,
  HelpCircle,
} from "lucide-react";
import apiClient from "../api/apiClient";
import dayjs from "dayjs";

interface TenantDashboardData {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  created_at: string;
  tenure: string;
  client_count: number;
  pet_count: number;
  appointment_count: number;
  sale_count: number;
  plan_name: string;
  price_cents: number;
  payment_status: string;
  current_period_end: string | null;
  onboarding_step: string;
  feature_flags?: Record<string, any>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<TenantDashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState<TenantDashboardData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<TenantDashboardData[]>("/api/v1/tenants/admin/dashboard");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (tenant: TenantDashboardData) => {
    setSelectedTenant(tenant);
  };

  const handleToggleFlag = async (flagName: string, enabled: boolean) => {
    if (!selectedTenant) return;
    setIsUpdating(true);
    try {
      const currentFlags = selectedTenant.feature_flags || {};
      const newFlags = { ...currentFlags, [flagName]: enabled };

      await apiClient.patch(`/api/v1/tenants/${selectedTenant.id}/admin`, {
        feature_flags: newFlags,
      });

      // Update local state
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedTenant.id
            ? { ...item, feature_flags: newFlags }
            : item
        )
      );
      setSelectedTenant((prev) => (prev ? { ...prev, feature_flags: newFlags } : null));
    } catch (error) {
      console.error("Error updating tenant feature flags:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format phone helper
  const formatPhone = (phoneNum: string) => {
    const clean = phoneNum.replace(/\D/g, "");
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phoneNum;
  };

  // Filter plans dynamically
  const uniquePlans = useMemo(() => {
    const plans = new Set(data.map((item) => item.plan_name));
    return Array.from(plans);
  }, [data]);

  // Metric aggregates
  const stats = useMemo(() => {
    const totalTenants = data.length;
    const totalClients = data.reduce((sum, item) => sum + (item.client_count || 0), 0);
    const totalPets = data.reduce((sum, item) => sum + (item.pet_count || 0), 0);
    const overdueCount = data.filter((item) => item.payment_status === "overdue").length;
    
    // Sum active plan prices to estimate MRR
    const estimatedMRRCents = data.reduce(
      (sum, item) => (item.payment_status === "paid" ? sum + (item.price_cents || 0) : sum),
      0
    );
    const estimatedMRR = estimatedMRRCents / 100;

    return { totalTenants, totalClients, totalPets, overdueCount, estimatedMRR };
  }, [data]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.email && item.email.toLowerCase().includes(search.toLowerCase())) ||
        item.phone.includes(search);

      const matchesPayment = paymentFilter === "all" || item.payment_status === paymentFilter;
      const matchesPlan = planFilter === "all" || item.plan_name === planFilter;

      return matchesSearch && matchesPayment && matchesPlan;
    });
  }, [data, search, paymentFilter, planFilter]);

  const getPaymentStatusChip = (status: string) => {
    switch (status) {
      case "paid":
        return <Chip label="Em Dia" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case "trial":
        return <Chip label="Teste" color="info" size="small" sx={{ fontWeight: 600 }} />;
      case "overdue":
        return <Chip label="Atrasado" color="error" size="small" sx={{ fontWeight: 600 }} />;
      case "canceled":
        return <Chip label="Cancelado" color="default" size="small" sx={{ fontWeight: 600 }} />;
      case "no_subscription":
      default:
        return <Chip label="Sem Plano" color="warning" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  const getActivationStatusChip = (appointmentCount: number) => {
    if ((appointmentCount || 0) > 0) {
      return (
        <Chip
          icon={<CheckCircle size={14} />}
          label="Ativo"
          color="success"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        icon={<Activity size={14} />}
        label="Pendente"
        color="warning"
        variant="outlined"
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={50} color="secondary" />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1500px" }}>
      {/* Page Title & Refresh */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Painel do Administrador
          </Typography>
          <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
            Monitore a saúde do seu SaaS, assinaturas, pagamentos e volumes de dados.
          </Typography>
        </Box>
        <Tooltip title="Atualizar Dados">
          <IconButton onClick={fetchData} sx={{ bgcolor: "background.paper", boxShadow: 1, p: 1.5 }}>
            <RefreshCw size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600 }}>
                Total de Empresas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "primary.main" }}>
                {stats.totalTenants}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "primary.light", color: "text.secondary", width: 52, height: 52 }}>
              <Building size={24} />
            </Avatar>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600 }}>
                Total de Clientes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "success.main" }}>
                {stats.totalClients}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#e8f5e9", color: "success.main", width: 52, height: 52 }}>
              <Users size={24} />
            </Avatar>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600 }}>
                Total de Pets
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "info.main" }}>
                {stats.totalPets}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#e0f7fa", color: "info.main", width: 52, height: 52 }}>
              <PawPrint size={24} />
            </Avatar>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600 }}>
                MRR Estimado
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "primary.main" }}>
                {stats.estimatedMRR.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "primary.main", color: "text.secondary", width: 52, height: 52 }}>
              <TrendingUp size={24} />
            </Avatar>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.1)" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 600 }}>
                Faturas Atrasadas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "error.main" }}>
                {stats.overdueCount}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#ffebee", color: "error.main", width: 52, height: 52 }}>
              <AlertTriangle size={24} />
            </Avatar>
          </Card>
        </Grid>
      </Grid>

      {/* Filters & Search Toolbar */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome da empresa, email, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <Select
                labelId="payment-filter-label"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <MenuItem value="all">Todos Pagamentos</MenuItem>
                <MenuItem value="paid">Em Dia</MenuItem>
                <MenuItem value="trial">Teste</MenuItem>
                <MenuItem value="overdue">Atrasado</MenuItem>
                <MenuItem value="no_subscription">Sem Plano</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <Select
                labelId="plan-filter-label"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <MenuItem value="all">Todos Planos</MenuItem>
                {uniquePlans.map((plan) => (
                  <MenuItem key={plan} value={plan}>
                    {plan}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tenants Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Empresa</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contatos</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tempo Conosco</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Clientes / Pets</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Uso do Sistema</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ativação</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Plano</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    Nenhum tenant encontrado com os filtros aplicados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    transition: "background-color 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  {/* Name & ID */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700, width: 38, height: 38 }}>
                        {row.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{row.name}</Typography>
                        <Typography variant="caption" sx={{ color: "text.primary" }}>
                          ID: #{row.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {row.email && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.primary" }}>
                          <Mail size={14} style={{ opacity: 0.7 }} />
                          <Typography variant="body2">{row.email}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.primary" }}>
                        <Phone size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="body2">{formatPhone(row.phone)}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Tenure */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Calendar size={14} style={{ opacity: 0.6 }} />
                      <Box>
                        <Typography variant="body2">{row.tenure}</Typography>
                        <Typography variant="caption" sx={{ color: "text.primary" }}>
                          Desde: {dayjs(row.created_at).format("DD/MM/YYYY")}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Counts */}
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.client_count || 0} clientes
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.primary" }}>
                      {row.pet_count || 0} pets
                    </Typography>
                  </TableCell>

                  {/* Usage */}
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.appointment_count || 0} agend.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.primary" }}>
                      {row.sale_count || 0} vendas
                    </Typography>
                  </TableCell>

                  {/* Onboarding / Ativação */}
                  <TableCell>{getActivationStatusChip(row.appointment_count)}</TableCell>

                  {/* Plan */}
                  <TableCell>
                    <Chip
                      label={row.plan_name}
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderColor: row.plan_name !== "Nenhum" ? "primary.main" : "divider",
                        color: row.plan_name !== "Nenhum" ? "primary.main" : "text.primary",
                      }}
                    />
                  </TableCell>

                  {/* Payment Status */}
                  <TableCell>{getPaymentStatusChip(row.payment_status)}</TableCell>

                  {/* Period End */}
                  <TableCell>
                    {row.current_period_end ? (
                      dayjs(row.current_period_end).format("DD/MM/YYYY")
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.primary" }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Detalhes e Configurações */}
      <Dialog
        open={Boolean(selectedTenant)}
        onClose={() => setSelectedTenant(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.15)",
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "primary.main", color: "white" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Building size={24} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Gerenciar Empresa
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedTenant(null)} sx={{ color: "white" }} disabled={isUpdating}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Header com Nome e ID */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                {selectedTenant?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.6 }}>
                ID da Empresa: #{selectedTenant?.id}
              </Typography>
            </Box>

            {/* Informações Gerais Card */}
            <Box sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.02)"
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 2, letterSpacing: 1.1, textTransform: "uppercase", fontSize: "11px" }}>
                Informações Gerais
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Shield size={16} style={{ opacity: 0.6 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>Plano Atual</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {selectedTenant?.plan_name}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Mail size={16} style={{ opacity: 0.6 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>E-mail</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {selectedTenant?.email || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Feature Flags Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 2, letterSpacing: 1.1, textTransform: "uppercase", fontSize: "11px" }}>
                Sinalizadores de Funcionalidades
              </Typography>
              
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}>
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.04)"
                  }
                }}>
                  <Box display="flex" alignItems="flex-start" gap={2} sx={{ pr: 2 }}>
                    <Box sx={{ mt: 0.5, p: 1, borderRadius: 2, bgcolor: "rgba(25, 118, 210, 0.08)", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <HelpCircle size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Canal de Suporte
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.primary", opacity: 0.7, mt: 0.5 }}>
                        Habilita o canal de suporte técnico e ajuda diretamente no menu lateral deste inquilino.
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={!!selectedTenant?.feature_flags?.support}
                    onChange={(e) => handleToggleFlag("support", e.target.checked)}
                    disabled={isUpdating}
                    color="primary"
                  />
                </Box>

                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "success.main",
                    boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.04)"
                  }
                }}>
                  <Box display="flex" alignItems="flex-start" gap={2} sx={{ pr: 2 }}>
                    <Box sx={{ mt: 0.5, p: 1, borderRadius: 2, bgcolor: "rgba(46, 125, 50, 0.08)", color: "success.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Acesso de Piloto (Isenção de Cobrança)
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.primary", opacity: 0.7, mt: 0.5 }}>
                        Ao ativar, a empresa terá acesso total ao sistema independentemente do status da assinatura. Ideal para clientes beta.
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={!!selectedTenant?.feature_flags?.free_access}
                    onChange={(e) => handleToggleFlag("free_access", e.target.checked)}
                    disabled={isUpdating}
                    color="success"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "background.default", borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            onClick={() => setSelectedTenant(null)}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 800, px: 4, py: 1, borderRadius: 2.5 }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
