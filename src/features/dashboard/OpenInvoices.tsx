import { Box, Typography, Skeleton, Chip, TextField, InputAdornment } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, Clock, ChevronRight, Search, Dog } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { listUnpaidPackages } from "../../api/services/client_packages";
import { listPackages } from "../../api/services/packages";
import { getOpenComandas } from "../../api/services/sales";
import type { ClientPackage } from "../client_packages/types";
import type { Package } from "../packages/types";
import type { Comanda } from "../sales/schemas";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

import useDebounce from "../../hooks/useDebounce";
import OpenInvoicesModal from "./OpenInvoicesModal";

type OpenInvoicesProps = {
  initialOpenInvoices?: any;
  initialOpenComandas?: { items: Comanda[]; total: number };
  initialUnpaidPackages?: { items: ClientPackage[]; total: number };
  packagesCatalog?: Package[];
  isFetching?: boolean;
};

export default function OpenInvoices({
  initialOpenComandas,
  initialUnpaidPackages,
  packagesCatalog,
  isFetching: propIsFetching,
}: OpenInvoicesProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSearching = debouncedSearch.trim().length > 0;

  const { data: unpaidPkgsData, isLoading: isLoadingPkgs } = useQuery({
    queryKey: ["unpaid-packages", { limit: 15, search: debouncedSearch }],
    queryFn: () => listUnpaidPackages({ limit: 15, search: debouncedSearch }),
    initialData: !isSearching && initialUnpaidPackages ? initialUnpaidPackages : undefined,
  });

  const { data: openComandasData, isLoading: isLoadingComandas } = useQuery({
    queryKey: ["open-comandas", { limit: 15, search: debouncedSearch }],
    queryFn: () => getOpenComandas({ limit: 15, search: debouncedSearch }),
    initialData: !isSearching && initialOpenComandas ? initialOpenComandas : undefined,
    staleTime: 0,
  });

  const { data: catalogData } = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages(),
    initialData: packagesCatalog,
  });

  const unpaidPkgs = unpaidPkgsData?.items || initialUnpaidPackages?.items || [];
  const openComandas = openComandasData?.items || initialOpenComandas?.items || [];
  const allPackages = catalogData || packagesCatalog || [];

  const isLoading = isSearching
    ? isLoadingPkgs || isLoadingComandas
    : (propIsFetching && !initialOpenComandas && !openComandasData) ||
      (isLoadingComandas && !openComandasData && !initialOpenComandas) ||
      (isLoadingPkgs && !unpaidPkgsData && !initialUnpaidPackages);

  const invoices = useMemo(() => {
    const arr: Array<{
      type: "comanda" | "package";
      data: Comanda | ClientPackage;
      date: string;
      displayName: string;
    }> = [];

    // Add open comandas
    openComandas.forEach((cmd) =>
      arr.push({
        type: "comanda",
        data: cmd,
        date: cmd.created_at,
        displayName: cmd.client?.name || "Cliente",
      })
    );

    // Add unpaid packages
    unpaidPkgs.forEach((pkg) =>
      arr.push({
        type: "package",
        data: pkg,
        date: pkg.created_at,
        displayName: pkg.package_name || "Pacote",
      })
    );

    return arr
      .sort((a, b) => {
        const cmp = a.displayName.localeCompare(b.displayName, "pt-BR", { sensitivity: "base" });
        if (cmp !== 0) return cmp;
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      })
      .slice(0, 15);
  }, [openComandas, unpaidPkgs]);

  const totalInvoices =
    (isSearching
      ? openComandasData?.total || 0
      : openComandasData?.total ?? initialOpenComandas?.total ?? openComandas.length) +
    (isSearching
      ? unpaidPkgsData?.total || 0
      : unpaidPkgsData?.total ?? initialUnpaidPackages?.total ?? unpaidPkgs.length);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt size={18} />
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>
            Comandas em Aberto
          </Typography>
          {!isLoading && (
            <Chip
              label={totalInvoices}
              size="small"
              color={totalInvoices > 0 ? "warning" : "default"}
              sx={{ fontWeight: 800, height: 20, fontSize: "0.72rem" }}
            />
          )}
        </Box>

        {totalInvoices > 0 && (
          <Typography
            variant="caption"
            onClick={() => setIsModalOpen(true)}
            sx={{
              color: "primary.main",
              fontWeight: 700,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Ver todas ({totalInvoices})
          </Typography>
        )}
      </Box>

      {/* Busca */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1.5,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: "background.paper",
            fontSize: "0.85rem",
          },
        }}
      />

      {/* Lista de Comandas */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: 2 }} />
          ))
        ) : invoices.length === 0 ? (
          <CustomCard
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "grey.50",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Receipt size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {isSearching ? "Nenhuma comanda encontrada para a busca." : "Nenhuma comanda em aberto no momento."}
            </Typography>
          </CustomCard>
        ) : (
          invoices.map(({ type, data, date }) => {
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
                  if (type === "comanda") navigate("/pos", { state: { pullComanda: data } });
                  else navigate("/pos", { state: { pullPackage: data } });
                }}
                sx={{
                  p: { xs: 1.2, sm: 1.35 },
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
                    sx={{ fontSize: { xs: "0.86rem", sm: "0.9rem" }, color: "text.primary" }}
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
                      sx={{ whiteSpace: "nowrap", fontSize: { xs: "0.9rem", sm: "0.96rem" } }}
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

      {isModalOpen && (
        <OpenInvoicesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Box>
  );
}
