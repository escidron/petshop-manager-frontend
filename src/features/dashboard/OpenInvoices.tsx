import { Box, Typography, Skeleton, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ShoppingCart, Clock } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { getOpenInvoices } from "../../api/services/appointments";
import AppointmentDetailsModal from "../appointments/AppointmentDetailsModal";
import { applyAppointmentAction } from "../../api/services/appointments";
import type { Appointment, AppointmentAction } from "../appointments/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import { listUnpaidPackages } from "../../api/services/client_packages";
import { listPackages } from "../../api/services/packages";
import type { ClientPackage } from "../client_packages/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

export default function OpenInvoices() {
  const navigate = useNavigate();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);

  const { data: appointments = [], isLoading: isLoadingApts, refetch: refetchApts } = useQuery({
    queryKey: ["open-invoices"],
    queryFn: getOpenInvoices,
    refetchInterval: 60_000, // refresh every minute
  });

  const { data: unpaidPkgs = [], isLoading: isLoadingPkgs } = useQuery({
    queryKey: ["unpaid-packages"],
    queryFn: listUnpaidPackages,
    refetchInterval: 60_000,
  });

  const { data: allPackages = [], isLoading: isLoadingAllPkgs } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const isLoading = isLoadingApts || isLoadingPkgs || isLoadingAllPkgs;

  const invoices = useMemo(() => {
    const arr: Array<{ type: "appointment" | "package", data: Appointment | ClientPackage, date: string }> = [];
    appointments.forEach((apt) => arr.push({ type: "appointment", data: apt, date: apt.scheduled_at }));
    unpaidPkgs.forEach((pkg) => arr.push({ type: "package", data: pkg, date: pkg.created_at }));
    return arr.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [appointments, unpaidPkgs]);

  const handleAction = async (appointment: Appointment, action: AppointmentAction) => {
    try {
      setLoadingAction(action);
      await applyAppointmentAction(appointment.id, action);
      refetchApts();
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
        {!isLoading && invoices.length > 0 && (
          <Chip
            label={invoices.length}
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
        ) : invoices.length === 0 ? (
          <CustomCard sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              🎉 Nenhuma comanda em aberto!
            </Typography>
          </CustomCard>
        ) : (
          invoices.map(({ type, data, date }) => {
            const isApt = type === "appointment";
            let totalFormatted = "";
            let clientName = "";
            let description = "";
            let subDescription = "";

            if (isApt) {
              const apt = data as Appointment;
              totalFormatted = (getAppointmentTotal(apt) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              clientName = apt.client.name;
              description = apt.items.map((i) => i.pet.name).join(", ");
              subDescription = apt.items
                .flatMap((i) => i.services.filter((s) => !s.is_package_covered).map((s) => s.name))
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(" · ");
            } else {
              const pkg = data as ClientPackage;
              const packageDef = allPackages.find((p) => p.id === pkg.package_id);
              const price = packageDef ? packageDef.price_cents / 100 : 0;
              totalFormatted = price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              clientName = `Pacote (Pets: ${pkg.pets ? pkg.pets.map(p => p.name).join(', ') : "N/A"})`;
              description = pkg.package_name;
              subDescription = "Venda Pendente";
            }

            const when = dayjs(date).fromNow();

            return (
              <CustomCard
                key={`${type}-${data.id}`}
                onClick={() => { if (isApt) setSelectedAppointment(data as Appointment) }}
                sx={{
                  p: 1.5,
                  cursor: isApt ? "pointer" : "default",
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
                      {clientName}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {description}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ whiteSpace: "nowrap", ml: 1 }}>
                    {totalFormatted}
                  </Typography>
                </Box>

                {/* Bottom row: services + time */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
                  {subDescription && (
                    <Typography variant="caption" color="text.primary" noWrap sx={{ maxWidth: "65%" }}>
                      {subDescription}
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
                    onClick={() => {
                        if (isApt) navigate("/pos", { state: { pullAppointment: data } });
                        else navigate("/pos", { state: { pullPackage: data } });
                    }}
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
