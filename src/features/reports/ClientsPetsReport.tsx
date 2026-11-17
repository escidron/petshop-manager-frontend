import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  PawPrint,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  exportClientsPetsReport,
  fetchClientsPetsReport,
  type ClientPetReportItem,
} from "../../api/services/pets";

const headerCellSx = {
  backgroundColor: "#F1F5F9",
  fontWeight: 700,
  color: "#334155",
  py: 1.5,
  fontSize: "0.85rem",
  whiteSpace: "nowrap",
};

const formatGender = (genderLabel?: string | null) => {
  if (!genderLabel) return "Não informado";
  const g = genderLabel.toLowerCase().trim();
  if (g === "male" || g === "macho") return "Macho";
  if (g === "female" || g === "femea" || g === "fêmea") return "Fêmea";
  if (g === "other" || g === "outro" || g === "outros") return "Outro";
  if (g === "unknown" || g === "não informado" || g === "nao informado") return "Não informado";
  return genderLabel;
};

const formatSize = (size?: string | null) => {
  if (!size || size.trim() === "" || size === "-") return "Porte não informado";
  return `Porte ${size.toUpperCase()}`;
};

const formatSpecies = (speciesLabel?: string | null) => {
  if (!speciesLabel) return "Outros";
  const s = speciesLabel.toLowerCase().trim();
  if (s === "dog" || s === "canino") return "Canino";
  if (s === "cat" || s === "felino") return "Felino";
  if (s === "bird" || s === "ave") return "Ave";
  if (s === "other" || s === "outro" || s === "outros") return "Outros";
  return speciesLabel;
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

const ReportCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 2,
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "#FFFFFF",
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        bgcolor: `${color}15`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: "#0F172A" }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default function ClientsPetsReport() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [exporting, setExporting] = useState(false);

  const isActiveParam =
    statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["clients-pets-report", search, statusFilter, page, rowsPerPage],
    queryFn: () =>
      fetchClientsPetsReport({
        search: search.trim() || undefined,
        is_active: isActiveParam,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportClientsPetsReport({
        search: search.trim() || undefined,
        is_active: isActiveParam,
      });
    } catch (err) {
      console.error("Erro ao exportar relatório:", err);
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* KPI Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ReportCard
            icon={<PawPrint size={22} />}
            label="Total de Pets"
            value={data?.total ?? "-"}
            color="#313485"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ReportCard
            icon={<CheckCircle2 size={22} />}
            label="Pets Ativos"
            value={data?.total_active_pets ?? "-"}
            color="#16A34A"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ReportCard
            icon={<Users size={22} />}
            label="Clientes / Tutores"
            value={data?.total_unique_clients ?? "-"}
            color="#0284C7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ReportCard
            icon={<Calendar size={22} />}
            label="Com Atendimento no Filtro"
            value={items.filter((i: ClientPetReportItem) => !!i.last_service_date).length}
            color="#EA580C"
          />
        </Grid>
      </Grid>

      {/* Toolbar: Busca, Filtro e Exportação */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "#FFFFFF",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            flex: 1,
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por pet, dono, raça ou telefone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{
              minWidth: { xs: "100%", sm: 300, md: 360 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "#FAFAFA",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
          />

          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={{
              minWidth: 160,
              borderRadius: 2,
              bgcolor: "#FAFAFA",
              fontSize: "0.875rem",
            }}
          >
            <MenuItem value="all">Todos os Status</MenuItem>
            <MenuItem value="active">Apenas Ativos</MenuItem>
            <MenuItem value="inactive">Apenas Inativos</MenuItem>
          </Select>
        </Box>

        <Button
          variant="contained"
          onClick={handleExport}
          disabled={exporting || total === 0}
          startIcon={
            exporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <FileSpreadsheet size={18} />
            )
          }
          sx={{
            bgcolor: "#166534",
            "&:hover": { bgcolor: "#14532D" },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            py: 1,
            whiteSpace: "nowrap",
          }}
        >
          {exporting ? "Gerando Excel..." : "Exportar Excel"}
        </Button>
      </Paper>

      {/* Tabela de Clientes & Pets */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
        }}
      >
        <TableContainer sx={{ maxHeight: 680 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Cliente (Tutor)</TableCell>
                <TableCell sx={{ ...headerCellSx, minWidth: 160, whiteSpace: "nowrap" }}>
                  Telefone
                </TableCell>
                <TableCell sx={headerCellSx}>Pet</TableCell>
                <TableCell sx={headerCellSx}>Espécie / Raça</TableCell>
                <TableCell sx={headerCellSx}>Porte / Sexo</TableCell>
                <TableCell sx={headerCellSx} align="center">
                  Castrado
                </TableCell>
                <TableCell sx={headerCellSx} align="center">
                  Status
                </TableCell>
                <TableCell sx={headerCellSx}>Último Serviço</TableCell>
                <TableCell sx={headerCellSx}>Data do Serviço</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#313485" }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Carregando relatório de clientes e pets...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <PawPrint size={40} color="#CBD5E1" />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1.5, color: "#475569" }}>
                      Nenhum pet encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros de busca ou status acima.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row: ClientPetReportItem) => {
                  const lastServiceFormatted = row.last_service_date
                    ? dayjs(row.last_service_date).format("DD/MM/YYYY HH:mm")
                    : "-";

                  return (
                    <TableRow
                      key={row.pet_id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        bgcolor: row.is_active ? "inherit" : "#FAFAFA",
                      }}
                    >
                      {/* Cliente */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {row.client_name}
                        </Typography>
                      </TableCell>

                      {/* Telefone */}
                      <TableCell sx={{ py: 1.25, whiteSpace: "nowrap", minWidth: 160 }}>
                        {row.client_phone ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
                            <Phone size={13} color="#64748B" />
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              {formatPhone(row.client_phone)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Pet */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={700} color="#1E293B">
                            {row.pet_name}
                          </Typography>
                          {row.is_deceased && (
                            <Chip
                              label="Falecido"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                bgcolor: "#FEE2E2",
                                color: "#B91C1C",
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* Espécie / Raça */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography variant="body2" color="#334155">
                          {formatSpecies(row.species_label || row.species)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.breed || "SRD / Não informada"}
                        </Typography>
                      </TableCell>

                      {/* Porte / Sexo */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography variant="body2" color="#334155">
                          {formatSize(row.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatGender(row.gender_label || row.gender)}
                        </Typography>
                      </TableCell>

                      {/* Castrado */}
                      <TableCell align="center" sx={{ py: 1.25 }}>
                        {row.is_neutered === true ? (
                          <Chip
                            label="Sim"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: "#DCFCE7",
                              color: "#15803D",
                            }}
                          />
                        ) : row.is_neutered === false ? (
                          <Chip
                            label="Não"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              bgcolor: "#F1F5F9",
                              color: "#64748B",
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center" sx={{ py: 1.25 }}>
                        <Chip
                          label={row.is_active ? "Ativo" : "Inativo"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: row.is_active ? "#DCFCE7" : "#F1F5F9",
                            color: row.is_active ? "#166534" : "#64748B",
                          }}
                        />
                      </TableCell>

                      {/* Último Serviço */}
                      <TableCell sx={{ py: 1.25 }}>
                        {row.last_service_name ? (
                          <Typography variant="body2" fontWeight={600} color="#0F172A">
                            {row.last_service_name}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Sem atendimentos
                          </Typography>
                        )}
                      </TableCell>

                      {/* Data do Serviço */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography variant="body2" color="text.secondary">
                          {lastServiceFormatted}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        />
      </Paper>
    </Box>
  );
}
