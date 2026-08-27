import { Box, Typography, Skeleton, Chip } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, Clock, ChevronRight } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { getOpenInvoices } from "../../api/services/appointments";
import AppointmentDetailsModal from "../appointments/AppointmentDetailsModal";
import { applyAppointmentAction } from "../../api/services/appointments";
import type { Appointment, AppointmentAction } from "../appointments/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import { listUnpaidPackages } from "../../api/services/client_packages";
import type { ClientPackage } from "../client_packages/types";
import type { Package } from "../packages/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

import useDebounce from "../../hooks/useDebounce";
import { TextField, InputAdornment } from "@mui/material";
import { Search } from "lucide-react";
import OpenInvoicesModal from "./OpenInvoicesModal";

type OpenInvoicesProps = {
  initialOpenInvoices?: { items: Appointment[]; total: number };
  initialUnpaidPackages?: { items: ClientPackage[]; total: number };
  packagesCatalog?: Package[];
  isFetching?: boolean;
};

export default function OpenInvoices({
  initialOpenInvoices,
  initialUnpaidPackages,
  packagesCatalog,
  isFetching: propIsFetching,
}: OpenInvoicesProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSearching = debouncedSearch.trim().length > 0;

  const { data: searchAppointmentsData, isLoading: isLoadingSearchApts } = useQuery({
    queryKey: ["open-invoices", { limit: 15, search: debouncedSearch }],
    queryFn: () => getOpenInvoices({ limit: 15, search: debouncedSearch }),
    enabled: isSearching,
  });

  const { data: searchUnpaidPkgsData, isLoading: isLoadingSearchPkgs } = useQuery({
    queryKey: ["unpaid-packages", { limit: 15, search: debouncedSearch }],
    queryFn: () => listUnpaidPackages({ limit: 15, search: debouncedSearch }),
    enabled: isSearching,
  });

  const appointments = isSearching
    ? searchAppointmentsData?.items || []
    : initialOpenInvoices?.items || [];

  const unpaidPkgs = isSearching
    ? searchUnpaidPkgsData?.items || []
    : initialUnpaidPackages?.items || [];

  const allPackages = packagesCatalog || [];

  const totalInvoices = isSearching
    ? (searchAppointmentsData?.total || 0) + (searchUnpaidPkgsData?.total || 0)
    : (initialOpenInvoices?.total || 0) + (initialUnpaidPackages?.total || 0);

  const isLoading = isSearching
    ? isLoadingSearchApts || isLoadingSearchPkgs
    : propIsFetching && !initialOpenInvoices;

  const invoices = useMemo(() => {
    const arr: Array<{ type: "appointment" | "package", data: Appointment | ClientPackage, date: string }> = [];
    appointments.forEach((apt) => arr.push({ type: "appointment", data: apt, date: apt.scheduled_at }));
    unpaidPkgs.forEach((pkg) => arr.push({ type: "package", data: pkg, date: pkg.created_at }));
    return arr.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 15);
  }, [appointments, unpaidPkgs]);

  const handleAction = async (appointment: Appointment, action: AppointmentAction) => {
    try {
      setLoadingAction(action);
      await applyAppointmentAction(appointment.id, action);
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
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
        {!isLoading && totalInvoices > 0 && (
          <Chip
            label={totalInvoices}
            color="warning"
            size="small"
            sx={{ fontWeight: 700, minWidth: 28 }}
          />
        )}
      </Box>

      <TextField
        placeholder="Buscar cliente ou pet..."
        size="small"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} color="#9aa0a6" />
            </InputAdornment>
          ),
        }}
      />

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
                onClick={() => {
                  if (isApt) navigate("/pos", { state: { pullAppointment: data } });
                  else navigate("/pos", { state: { pullPackage: data } });
                }}
                sx={{
                  p: { xs: 1.1, sm: 1.25 },
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.4,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 3,
                    "& .chevron-icon": {
                      transform: "translateX(2px)",
                      bgcolor: "primary.main",
                      color: "white",
                    },
                  },
                }}
              >
                {/* Linha 1: Nome do cliente e pets na esquerda | Preço e seta na direita */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, overflow: "hidden" }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ fontSize: { xs: "0.85rem", sm: "0.88rem" }, lineHeight: 1.2 }}
                    >
                      {clientName}
                    </Typography>
                    {description && (
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ color: "text.primary", opacity: 0.6, fontSize: "0.74rem" }}
                      >
                        • {description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      color="primary.main"
                      sx={{ whiteSpace: "nowrap", fontSize: { xs: "0.85rem", sm: "0.92rem" } }}
                    >
                      {totalFormatted}
                    </Typography>
                    <Box
                      className="chevron-icon"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: "grey.100",
                        color: "primary.main",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </Box>
                  </Box>
                </Box>

                {/* Linha 2: Serviços na esquerda | Tempo decorrido no final à direita */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: "text.primary", opacity: 0.7, fontSize: "0.72rem", minWidth: 0, flex: 1 }}
                  >
                    {subDescription || "Agendamento"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.35,
                      color: "text.disabled",
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={11} />
                    <Typography variant="caption" sx={{ fontSize: "0.68rem" }}>
                      {when}
                    </Typography>
                  </Box>
                </Box>
              </CustomCard>
            );
          })
        )}

        {!isLoading && invoices.length > 0 && totalInvoices > invoices.length && (
          <Box
            onClick={() => setIsModalOpen(true)}
            sx={{
              p: 1.5,
              mt: 1,
              textAlign: "center",
              bgcolor: "grey.100",
              color: "primary.main",
              borderRadius: 1,
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            Ver todas as {totalInvoices} comandas
          </Box>
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

      {isModalOpen && (
        <OpenInvoicesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Box>
  );
}
