import { useEffect, useState } from "react";
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
} from "@mui/material";
import { ShoppingBag, Scissors, Calendar as CalendarIcon, Package } from "lucide-react";
import { listAppointmentsByClient } from "../../api/services/appointments";
import { listSales } from "../../api/services/sales";
import type { Appointment } from "../appointments/types";
import type { SaleResponse } from "../sales/schemas";
import { APPOINTMENT_STATUS_LABEL } from "../../api/services/appointments";

type Props = {
  clientId: number;
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

export default function ClientHistory({ clientId }: Props) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appts, sls] = await Promise.all([
          listAppointmentsByClient(clientId),
          listSales(undefined, undefined, clientId),
        ]);
        setAppointments(appts);
        setSales(sls);
      } catch (error) {
        console.error("Error fetching client history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

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
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CalendarIcon size={14} color="#666" />
                          <Typography variant="body2" fontWeight={700}>
                            {new Date(appt.scheduled_at).toLocaleDateString("pt-BR")}
                          </Typography>
                        </Box>
                        <Chip 
                          label={APPOINTMENT_STATUS_LABEL[appt.status] || appt.status} 
                          size="small"
                          color={appt.status === "completed" ? "success" : "default"}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
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
                </ListItem>
                {idx < productSales.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </CustomTabPanel>
    </Paper>
  );
}
