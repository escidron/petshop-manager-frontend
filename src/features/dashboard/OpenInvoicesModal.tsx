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
import { X, Search, Clock, Dog, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useDebounce from "../../hooks/useDebounce";
import { listUnpaidPackages } from "../../api/services/client_packages";
import { listPackages } from "../../api/services/packages";
import { getOpenComandas } from "../../api/services/sales";
import CustomCard from "../../components/Card/CustomCard";
import type { ClientPackage } from "../client_packages/types";
import type { Comanda } from "../sales/schemas";

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

  const [accumulatedPackages, setAccumulatedPackages] = useState<ClientPackage[]>([]);
  const [accumulatedComandas, setAccumulatedComandas] = useState<Comanda[]>([]);

  // Reset accumulation when search changes
  useEffect(() => {
    setPage(0);
    setAccumulatedPackages([]);
    setAccumulatedComandas([]);
  }, [debouncedSearch]);

  const { data: unpaidPkgsData, isFetching: isFetchingPkgs } = useQuery({
    queryKey: ["unpaid-packages", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }],
    queryFn: () => listUnpaidPackages({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }),
  });

  const { data: comandasData, isFetching: isFetchingComandas } = useQuery({
    queryKey: ["open-comandas", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }],
    queryFn: () => getOpenComandas({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (unpaidPkgsData?.items) {
      setAccumulatedPackages((prev) => {
        const newItems = unpaidPkgsData.items.filter((item) => !prev.some((p) => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [unpaidPkgsData]);

  useEffect(() => {
    if (comandasData?.items) {
      setAccumulatedComandas((prev) => {
        const newItems = comandasData.items.filter((item) => !prev.some((p) => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [comandasData]);

  const { data: allPackages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const totalPkgs = unpaidPkgsData?.total || 0;
  const totalCmds = comandasData?.total || 0;
  const totalInvoices = totalPkgs + totalCmds;

  const hasMore =
    accumulatedPackages.length < totalPkgs ||
    accumulatedComandas.length < totalCmds;

  const isFetching = isFetchingPkgs || isFetchingComandas;

  const invoices = useMemo(() => {
    const arr: Array<{
      type: "comanda" | "package";
      data: Comanda | ClientPackage;
      date: string;
      displayName: string;
    }> = [];

    accumulatedComandas.forEach((cmd) =>
      arr.push({
        type: "comanda",
        data: cmd,
        date: cmd.updated_at || cmd.created_at,
        displayName: cmd.client?.name || "Cliente",
      })
    );

    accumulatedPackages.forEach((pkg) =>
      arr.push({
        type: "package",
        data: pkg,
        date: pkg.created_at,
        displayName: pkg.package_name || "Pacote",
      })
    );

    return arr.sort((a, b) => {
      const cmp = a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
    });
  }, [accumulatedComandas, accumulatedPackages]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

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
        sx: { maxHeight: "85vh", display: "flex", flexDirection: "column" },
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
          let totalFormatted = "";
          let clientName = "";
          let petsText = "";

          if (type === "comanda") {
            const cmd = data as Comanda;
            const activeItems = (cmd.items || []).filter((i) => !i.status || i.status === "active");
            const effectiveTotal =
              cmd.items && cmd.items.length > 0
                ? Math.max(0, activeItems.reduce((acc, i) => acc + (i.subtotal || 0), 0) - (cmd.discount_amount || 0))
                : cmd.total_amount;
            totalFormatted = effectiveTotal.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
            clientName = cmd.client?.name || "Cliente";
            if (cmd.client?.pets && cmd.client.pets.length > 0) {
              const alivePets = cmd.client.pets.filter((p) => !p.is_deceased);
              petsText = alivePets.map((p) => p.name).join(", ");
            }
          } else {
            const pkg = data as ClientPackage;
            const packageDef = allPackages.find((p) => p.id === pkg.package_id);
            const price = packageDef ? packageDef.price_cents / 100 : 0;
            totalFormatted = price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
            clientName = pkg.package_name;
            if (pkg.pets && pkg.pets.length > 0) {
              const alivePets = pkg.pets.filter((p: any) => !p.is_deceased);
              petsText = alivePets.map((p) => p.name).join(", ");
            }
          }

          const when = dayjs(date).fromNow();

          return (
            <CustomCard
              key={`${type}-${data.id}`}
              onClick={() => {
                onClose();
                if (type === "comanda") navigate("/pos", { state: { pullComanda: data } });
                else navigate("/pos", { state: { pullPackage: data } });
              }}
              sx={{
                p: 1.4,
                cursor: "pointer",
                transition: "border-color 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                border: "1px solid",
                borderColor: "divider",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              {/* Lado Esquerdo: Nome da pessoa em cima, pets embaixo */}
              <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 0.35 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: "0.9rem", color: "text.primary" }}
                >
                  {clientName}
                </Typography>

                {petsText && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                    <Dog size={13} style={{ flexShrink: 0 }} />
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: "text.primary", fontSize: "0.78rem", fontWeight: 500 }}
                    >
                      {petsText}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Lado Direito: Preço em cima, tempo de abertura embaixo */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.35, flexShrink: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ whiteSpace: "nowrap", fontSize: "0.96rem" }}
                  >
                    {totalFormatted}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: "grey.100",
                      color: "primary.main",
                    }}
                  >
                    <ChevronRight size={13} strokeWidth={2.5} />
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: "text.disabled" }}>
                  <Clock size={11} />
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                    {when}
                  </Typography>
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
