import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { X, Search, Clock, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useDebounce from "../../hooks/useDebounce";
import { getOpenInvoices } from "../../api/services/appointments";
import { listUnpaidPackages } from "../../api/services/client_packages";
import { listPackages } from "../../api/services/packages";
import CustomCard from "../../components/Card/CustomCard";
import type { Appointment } from "../appointments/types";
import type { ClientPackage } from "../client_packages/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

export default function OpenInvoicesModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(0);

  // We will accumulate items manually since we don't use useInfiniteQuery
  const [accumulatedAppointments, setAccumulatedAppointments] = useState<Appointment[]>([]);
  const [accumulatedPackages, setAccumulatedPackages] = useState<ClientPackage[]>([]);

  // Reset accumulation when search changes
  useEffect(() => {
    setPage(0);
    setAccumulatedAppointments([]);
    setAccumulatedPackages([]);
  }, [debouncedSearch]);

  const { data: appointmentsData, isFetching: isFetchingApts } = useQuery({
    queryKey: ["open-invoices", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }],
    queryFn: () => getOpenInvoices({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }),
  });

  const { data: unpaidPkgsData, isFetching: isFetchingPkgs } = useQuery({
    queryKey: ["unpaid-packages", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }],
    queryFn: () => listUnpaidPackages({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }),
  });

  useEffect(() => {
    if (appointmentsData?.items) {
      setAccumulatedAppointments((prev) => {
        // Simple deduplication based on ID
        const newItems = appointmentsData.items.filter(item => !prev.some(p => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [appointmentsData]);

  useEffect(() => {
    if (unpaidPkgsData?.items) {
      setAccumulatedPackages((prev) => {
        const newItems = unpaidPkgsData.items.filter(item => !prev.some(p => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [unpaidPkgsData]);

  const { data: allPackages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const totalApts = appointmentsData?.total || 0;
  const totalPkgs = unpaidPkgsData?.total || 0;
  const totalInvoices = totalApts + totalPkgs;
  
  const hasMore = accumulatedAppointments.length < totalApts || accumulatedPackages.length < totalPkgs;
  const isFetching = isFetchingApts || isFetchingPkgs;

  const invoices = useMemo(() => {
    const arr: Array<{ type: "appointment" | "package"; data: Appointment | ClientPackage; date: string }> = [];
    accumulatedAppointments.forEach((apt) => arr.push({ type: "appointment", data: apt, date: apt.scheduled_at }));
    accumulatedPackages.forEach((pkg) => arr.push({ type: "package", data: pkg, date: pkg.created_at }));
    return arr.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [accumulatedAppointments, accumulatedPackages]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    // If user scrolled to the bottom (with a 50px threshold)
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      if (hasMore && !isFetching) {
        setPage((prev) => prev + 1);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: "85vh", display: "flex", flexDirection: "column" }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Todas as Comandas</Typography>
          <Typography variant="caption" color="text.secondary">
            {totalInvoices} resultados encontrados
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "grey.500" }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 2, pb: 2 }}>
        <TextField
          placeholder="Buscar cliente ou pet..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#9aa0a6" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <DialogContent 
        dividers 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "grey.50" }}
      >
        {invoices.length === 0 && !isFetching && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.disabled">Nenhuma comanda encontrada.</Typography>
          </Box>
        )}

        {invoices.map(({ type, data, date }) => {
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
              sx={{ p: 1.5 }}
            >
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

              <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                <Box
                  onClick={() => {
                      if (isApt) navigate("/pos", { state: { pullAppointment: data } });
                      else navigate("/pos", { state: { pullPackage: data } });
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "opacity 0.15s",
                    "&:hover": { opacity: 0.85 },
                  }}
                >
                  <ShoppingCart size={14} />
                  Cobrar
                </Box>
              </Box>
            </CustomCard>
          );
        })}

        {isFetching && (
          <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
