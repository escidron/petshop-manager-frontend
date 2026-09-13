import { useState } from "react";
import {
  Box,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ShoppingBag, Scissors, Calendar as CalendarIcon, Package, Receipt, MessageCircle, Repeat, Pencil } from "lucide-react";
import { listAppointmentsByClient } from "../../api/services/appointments";
import { listSales } from "../../api/services/sales";
import { listClientPackagesByClient } from "../../api/services/client_packages";
import { fetchClientById } from "../../api/services/clients";
import type { Appointment } from "../appointments/types";
import type { SaleResponse } from "../sales/schemas";
import type { ClientPackage } from "../client_packages/types";
import { APPOINTMENT_STATUS_LABEL } from "../../api/services/appointments";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SaleReceiptModal from "../sales/SaleReceiptModal";
import AppointmentModal from "../appointments/AppointmentModal";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { sharePackageViaWhatsApp } from "../client_packages/packageWhatsAppMessage";
import { Button } from "../../components/Button/Button";

type Props = {
  clientId: number;
  refreshTrigger?: number;
  clientPhone?: string | null;
  clientName?: string | null;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ClientHistory({
  clientId,
  clientPhone,
  clientName,
}: Props) {
  const [tabValue, setTabValue] = useState(0);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<SaleResponse | null>(null);
  const toast = useToast();
  const { tenant } = useAuth();

  // If clientPhone is not provided, fetch client as fallback
  const { data: fetchedClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClientById(clientId),
    enabled: !clientPhone,
  });

  const resolvedPhone = clientPhone ?? fetchedClient?.phone ?? null;
  const resolvedName = clientName ?? fetchedClient?.name ?? null;

  const handleShareWhatsApp = (pkg: ClientPackage) => {
    const result = sharePackageViaWhatsApp(
      pkg,
      resolvedPhone,
      tenant?.name,
      resolvedName || pkg.client?.name,
    );
    if (!result.success && result.error) {
      toast.warning(result.error);
    }
  };

  const { data: appointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ["appointments", "client", clientId],
    queryFn: () => listAppointmentsByClient(clientId),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery<SaleResponse[]>({
    queryKey: ["sales", "client", clientId],
    queryFn: () => listSales(undefined, undefined, clientId),
  });

  // Shares cache with ClientDetailsPage — no double fetch!
  const { data: clientPackages = [], isLoading: loadingPkgs } = useQuery<ClientPackage[]>({
    queryKey: ["clientPackages", clientId],
    queryFn: () => listClientPackagesByClient(clientId),
  });

  const loading = loadingAppts || loadingSales || loadingPkgs;
  const queryClient = useQueryClient();

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  const handleOpenEditAppointment = (appt: Appointment) => {
    setEditingAppointment(appt);
    setAppointmentModalOpen(true);
  };

  const handleAppointmentSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Filter sales to show only products
  const productSales = sales.filter(sale => 
    sale.items.some(item => item.item_type === "product")
  );

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        Histórico
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            icon={<Scissors size={18} />} 
            iconPosition="start" 
            label="Serviços" 
            sx={{ 
              minHeight: "48px", 
              textTransform: "none", 
              fontWeight: 600,
              color: "text.disabled",
              "&.Mui-selected": { color: "primary.main" }
            }}
          />
          <Tab 
            icon={<ShoppingBag size={18} />} 
            iconPosition="start" 
            label="Produtos" 
            sx={{ 
              minHeight: "48px", 
              textTransform: "none", 
              fontWeight: 600,
              color: "text.disabled",
              "&.Mui-selected": { color: "primary.main" }
            }}
          />
          <Tab 
            icon={<ShoppingBag size={18} />} 
            iconPosition="start" 
            label="Pacotes" 
            sx={{ 
              minHeight: "48px", 
              textTransform: "none", 
              fontWeight: 600,
              color: "text.disabled",
              "&.Mui-selected": { color: "primary.main" }
            }}
          />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        {appointments.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 4 }}>
            Nenhum serviço realizado ainda.
          </Typography>
        ) : (
          <List disablePadding>
            {appointments.map((appt, idx) => (
              <Box key={appt.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                  onClick={() => handleOpenEditAppointment(appt)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                          <CalendarIcon size={14} color="#666" />
                          <Typography variant="body2" fontWeight={700}>
                            {new Date(appt.scheduled_at).toLocaleDateString("pt-BR")}
                          </Typography>
                          {appt.recurrence_id && (
                            <Tooltip title={`Recorrência ${appt.recurrence_frequency === 'monthly' ? 'Mensal' : appt.recurrence_frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}`}>
                              <Chip
                                icon={<Repeat size={11} />}
                                label={appt.recurrence_frequency === 'monthly' ? 'Mensal' : appt.recurrence_frequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, "& .MuiChip-label": { px: 0.6 }, "& .MuiChip-icon": { ml: 0.4, mr: -0.2 } }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip 
                            label={APPOINTMENT_STATUS_LABEL[appt.status] || appt.status} 
                            size="small"
                            color={appt.status === "completed" ? "success" : "default"}
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              p: 0.5,
                              color: "text.secondary",
                              "&:hover": { color: "primary.main" },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAppointment(appt);
                            }}
                          >
                            <Pencil size={13} />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {appt.items.map((item, iIdx) => (
                          <Box key={iIdx} sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ display: "block" }}>
                              {item.pet?.name || "Pet"}
                            </Typography>
                            <Typography variant="caption" color="text.primary">
                              {item.services.map(s => s.name).join(", ")}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
                {idx < appointments.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        {productSales.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 4 }}>
            Nenhum produto comprado ainda.
          </Typography>
        ) : (
          <List disablePadding>
            {productSales.map((sale, idx) => (
              <Box key={sale.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          R$ {sale.total_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {sale.items
                          .filter(item => item.item_type === "product" || item.item_type === "package")
                          .map((item, iIdx) => (
                            <Box key={iIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Package size={12} color="#999" />
                              <Typography variant="caption" color="text.primary">
                                {item.quantity}x {item.name}
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    }
                  />
                  <Tooltip title="Ver Comprovante / Enviar WhatsApp">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedReceiptSale(sale)}
                      sx={{
                        ml: 1.5,
                        alignSelf: "center",
                        color: "#313485",
                        bgcolor: "#EEF2FF",
                        p: 0.75,
                        "&:hover": { bgcolor: "#E0E7FF" },
                      }}
                    >
                      <Receipt size={16} />
                    </IconButton>
                  </Tooltip>
                </ListItem>
                {idx < productSales.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        {clientPackages.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 4 }}>
            Nenhum pacote contratado ainda.
          </Typography>
        ) : (
          <List disablePadding sx={{ maxHeight: 650, overflowY: "auto" }}>
            {clientPackages.map((pkg, idx) => {
              const isExpired = pkg.expires_at ? new Date(pkg.expires_at) < new Date() : false;
              
              // Determine status label and color
              let statusLabel = "Ativo";
              let statusColor: "success" | "default" | "error" | "info" = "success";
              
              if (!pkg.is_active) {
                const totalCredits = pkg.credits.reduce((acc, c) => acc + c.total_qty, 0);
                const usedCredits = pkg.credits.reduce((acc, c) => acc + c.used_qty, 0);
                if (usedCredits >= totalCredits) {
                  statusLabel = "Finalizado";
                  statusColor = "default";
                } else {
                  statusLabel = "Cancelado";
                  statusColor = "error";
                }
              } else if (isExpired) {
                statusLabel = "Expirado";
                statusColor = "error";
              }

              return (
                <Box key={pkg.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", mb: 0.5, flexWrap: "wrap", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {pkg.package_name}
                        </Typography>
                        <Chip 
                          label={statusLabel} 
                          size="small"
                          color={statusColor}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      </Box>
                      <Tooltip
                        title={
                          resolvedPhone
                            ? "Compartilhar por WhatsApp"
                            : "Telefone do cliente não cadastrado"
                        }
                      >
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<MessageCircle size={14} />}
                            onClick={() => handleShareWhatsApp(pkg)}
                            disabled={!resolvedPhone}
                            sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}
                          >
                            Enviar pacote
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5, width: "100%" }}>
                      <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                        Pets: <strong>{pkg.pets ? pkg.pets.map(p => p.name).join(', ') : "N/A"}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                        Comprado em: {new Date(pkg.created_at).toLocaleDateString("pt-BR")}
                      </Typography>
                      {pkg.expires_at && (
                        <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                          Vence em: {new Date(pkg.expires_at).toLocaleDateString("pt-BR")}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1, pl: 1, borderLeft: "2px solid", borderColor: "grey.300" }}>
                        {pkg.credits.map((credit, cIdx) => (
                          <Typography key={cIdx} variant="caption" display="block" color="text.primary">
                            • {credit.service_name}: {credit.used_qty}/{credit.total_qty} consumidos
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </ListItem>
                  {idx < clientPackages.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        )}
      </CustomTabPanel>

      {selectedReceiptSale && (
        <SaleReceiptModal
          open={!!selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
          sale={selectedReceiptSale}
          clientName={selectedReceiptSale.client?.name || selectedReceiptSale.appointment?.client?.name}
          clientPhone={selectedReceiptSale.client?.phone || selectedReceiptSale.appointment?.client?.phone}
        />
      )}

      {editingAppointment && (
        <AppointmentModal
          open={appointmentModalOpen}
          mode="edit"
          appointment={editingAppointment}
          onClose={() => {
            setAppointmentModalOpen(false);
            setEditingAppointment(null);
          }}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </Paper>
  );
}
