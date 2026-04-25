import { Box, Typography, Skeleton, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ShoppingCart, Clock } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { getOpenInvoices } from "../../api/services/appointments";
import AppointmentDetailsModal from "../appointments/AppointmentDetailsModal";
import { applyAppointmentAction } from "../../api/services/appointments";
import type { Appointment, AppointmentAction } from "../appointments/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

export default function OpenInvoices() {
  const navigate = useNavigate();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["open-invoices"],
    queryFn: getOpenInvoices,
    refetchInterval: 60_000, // refresh every minute
  });

  const handleAction = async (appointment: Appointment, action: AppointmentAction) => {
    try {
      setLoadingAction(action);
      await applyAppointmentAction(appointment.id, action);
      refetch();
      setSelectedAppointment(null);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt size={20} />
          <Typography variant="h6" fontWeight={600}>
            Comandas em Aberto
          </Typography>
        </Box>
        {!isLoading && appointments.length > 0 && (
          <Chip
            label={appointments.length}
            color="warning"
            size="small"
            sx={{ fontWeight: 700, minWidth: 28 }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <CustomCard key={i} sx={{ p: 1.5 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </CustomCard>
          ))
        ) : appointments.length === 0 ? (
          <CustomCard sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              🎉 Nenhuma comanda em aberto!
            </Typography>
          </CustomCard>
        ) : (
          appointments.map((apt) => {
            const totalFormatted = (getAppointmentTotal(apt) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
            const petNames = apt.items.map((i) => i.pet.name).join(", ");
            const serviceNames = apt.items
              .flatMap((i) => i.services.filter((s) => !s.is_package_covered).map((s) => s.name))
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(" · ");
            const when = dayjs(apt.scheduled_at).fromNow();

            return (
              <CustomCard
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 4,
                  },
                }}
              >
                {/* Top row: client + amount */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      {apt.client.name}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {petNames}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ whiteSpace: "nowrap", ml: 1 }}>
                    {totalFormatted}
                  </Typography>
                </Box>

                {/* Bottom row: services + time */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
                  {serviceNames && (
                    <Typography variant="caption" color="text.primary" noWrap sx={{ maxWidth: "65%" }}>
                      {serviceNames}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.disabled", ml: "auto" }}>
                    <Clock size={11} />
                    <Typography variant="caption">{when}</Typography>
                  </Box>
                </Box>

                {/* Quick POS button */}
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box
                    onClick={() => navigate("/pos", { state: { pullAppointment: apt } })}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 1,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      transition: "opacity 0.15s",
                      "&:hover": { opacity: 0.85 },
                    }}
                  >
                    <ShoppingCart size={13} />
                    Cobrar
                  </Box>
                </Box>
              </CustomCard>
            );
          })
        )}
      </Box>

      {selectedAppointment && (
        <AppointmentDetailsModal
          open={!!selectedAppointment}
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          handleAction={handleAction}
          loadingAction={loadingAction}
          onEdit={() => {}} // read-only from here
        />
      )}
    </Box>
  );
}
