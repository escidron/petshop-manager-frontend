import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  TextField,
  MenuItem,
  Select,
  Checkbox,
  Alert,
  Autocomplete,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Clock, CheckCircle2, DollarSign } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import {
  getCommissionEntries,
  payCommissionEntries,
} from "../api/services/commissions";
import { useToast } from "../hooks/useToast";
import CustomCard from "../components/Card/CustomCard";
import theme from "../theme";
import type { CommissionEntry } from "../features/commissions/types";
import SaleDetailsModal from "../features/sales/SaleDetailsModal";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Button } from "../components/Button/Button";
dayjs.locale("pt-br");

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

const CommissionCard = ({
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
  <CustomCard
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 1,
      borderTop: `4px solid ${color}`,
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" color="text.disabled" fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ color: color }}>{icon}</Box>
    </Box>
    <Typography variant="h5" fontWeight={700}>
      {value}
    </Typography>
  </CustomCard>
);

export default function CommissionReportPage() {
  const { employees, getEmployees } = useEmployees();
  const toast = useToast();

  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [filterEmployee, setFilterEmployee] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const handleOpenSaleDetails = (saleId: number) => {
    setSelectedSaleId(saleId);
    setIsSaleModalOpen(true);
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getCommissionEntries({
        employee_id: filterEmployee ? Number(filterEmployee) : undefined,
        status: filterStatus || undefined,
        from_date: filterFrom || undefined,
        to_date: filterTo || undefined,
      });
      setEntries(data);
      setSelectedIds(new Set());
    } catch {
      toast.error("Erro ao carregar relatório de comissões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEmployee, filterStatus, filterFrom, filterTo]);

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  const pendingEntries = useMemo(
    () => entries.filter((e) => e.status === "pending"),
    [entries],
  );

  const totalPending = useMemo(
    () =>
      entries
        .filter((e) => e.status === "pending")
        .reduce((acc, e) => acc + Number(e.commission_amount), 0),
    [entries],
  );

  const totalPaid = useMemo(
    () =>
      entries
        .filter((e) => e.status === "paid")
        .reduce((acc, e) => acc + Number(e.commission_amount), 0),
    [entries],
  );

  const selectedPending = useMemo(
    () => pendingEntries.filter((e) => selectedIds.has(e.id)),
    [pendingEntries, selectedIds],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingEntries.map((e) => e.id)));
    }
  };

  const handlePay = async () => {
    if (selectedPending.length === 0) return;

    const employeeIds = [...new Set(selectedPending.map((e) => e.employee_id))];
    if (employeeIds.length > 1) {
      toast.error(
        "Selecione entradas de um único funcionário por vez para pagamento.",
      );
      return;
    }

    try {
      setPaying(true);
      await payCommissionEntries({
        employee_id: employeeIds[0],
        entry_ids: selectedPending.map((e) => e.id),
      });
      toast.success(
        `${selectedPending.length} comissão(ões) marcada(s) como paga(s).`,
      );
      loadEntries();
    } catch {
      toast.error("Erro ao registrar pagamento.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1400px" }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Relatório de Comissões
      </Typography>

      {/* Summary cards */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        <CommissionCard
          icon={<Clock size={20} />}
          label="TOTAL PENDENTE"
          value={`R$ ${totalPending.toFixed(2)}`}
          color={theme.palette.warning.main}
        />
        <CommissionCard
          icon={<CheckCircle2 size={20} />}
          label="TOTAL PAGO"
          value={`R$ ${totalPaid.toFixed(2)}`}
          color={theme.palette.success.main}
        />
        <CommissionCard
          icon={<DollarSign size={20} />}
          label="TOTAL GERAL"
          value={`R$ ${(totalPending + totalPaid).toFixed(2)}`}
          color={theme.palette.primary.main}
        />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Autocomplete
            size="small"
            sx={{ minWidth: 220 }}
            options={employees}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) =>
              String(option.id) === String(value.id)
            }
            value={
              employees.find((e) => String(e.id) === filterEmployee) || null
            }
            onChange={(_, val) => setFilterEmployee(val ? String(val.id) : "")}
            renderInput={(params) => (
              <TextField {...params} placeholder="Funcionário" />
            )}
            noOptionsText="Nenhum funcionário"
          />

          <Select
            size="small"
            displayEmpty
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">
              <em>Status (Todos)</em>
            </MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="paid">Pago</MenuItem>
          </Select>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.primary" fontWeight={500}>De:</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                format="DD/MM/YYYY"
                value={filterFrom ? dayjs(filterFrom) : null}
                onChange={(newDate) => {
                  if (newDate && newDate.isValid()) {
                    setFilterFrom(newDate.format("YYYY-MM-DD"));
                  } else {
                    setFilterFrom("");
                  }
                }}
                dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: {
                    size: "small",
                    placeholder: "DD/MM/AAAA",
                    inputMode: "numeric",
                  },
                  actionBar: { actions: [] },
                }}
              />
            </LocalizationProvider>
            
            <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ ml: 1 }}>Até:</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <DatePicker
                format="DD/MM/YYYY"
                value={filterTo ? dayjs(filterTo) : null}
                onChange={(newDate) => {
                  if (newDate && newDate.isValid()) {
                    setFilterTo(newDate.format("YYYY-MM-DD"));
                  } else {
                    setFilterTo("");
                  }
                }}
                dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                  return days[day.day()];
                }}
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#3d4048 !important",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        color: "#3d4048 !important",
                        "&.Mui-selected": {
                          color: "white !important",
                        },
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#3d4048 !important",
                      },
                      "& .MuiPickersArrowSwitcher-button": {
                        color: "#3d4048 !important",
                      },
                    },
                  },
                  textField: {
                    size: "small",
                    placeholder: "DD/MM/AAAA",
                    inputMode: "numeric",
                  },
                  actionBar: { actions: [] },
                }}
              />
            </LocalizationProvider>
          </Box>

          <Button
            variant="outlined"
            onClick={() => {
              setFilterEmployee("");
              setFilterStatus("");
              setFilterFrom("");
              setFilterTo("");
            }}
            disabled={loading}
          >
            Limpar Filtros
          </Button>
        </Box>
      </Paper>

      {/* Pay action */}
      {selectedPending.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="success"
              variant="contained"
              size="small"
              onClick={handlePay}
              disabled={paying}
            >
              {paying
                ? "Processando..."
                : `Marcar ${selectedPending.length} como pago`}
            </Button>
          }
        >
          {selectedPending.length} entrada(s) selecionada(s) — total R${" "}
          {selectedPending
            .reduce((acc, e) => acc + Number(e.commission_amount), 0)
            .toFixed(2)}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx} padding="checkbox">
                <Checkbox
                  sx={{ color: "primary.main", py: 0 }}
                  disableRipple
                  indeterminate={
                    selectedIds.size > 0 &&
                    selectedIds.size < pendingEntries.length
                  }
                  checked={
                    pendingEntries.length > 0 &&
                    selectedIds.size === pendingEntries.length
                  }
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell sx={headerCellSx}>Funcionário</TableCell>
              <TableCell sx={headerCellSx}>Origem</TableCell>
              <TableCell sx={headerCellSx}>Tipo</TableCell>
              <TableCell sx={headerCellSx}>Base</TableCell>
              <TableCell sx={headerCellSx}>Taxa</TableCell>
              <TableCell sx={headerCellSx}>Comissão</TableCell>
              <TableCell sx={headerCellSx}>Data</TableCell>
              <TableCell sx={headerCellSx}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => {
              const isPending = entry.status === "pending";
              return (
                <TableRow key={entry.id} selected={selectedIds.has(entry.id)}>
                  <TableCell padding="checkbox">
                    {isPending && (
                      <Checkbox
                        sx={{ color: "primary.main", py: 0 }}
                        disableRipple
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {employeeMap[entry.employee_id] ?? `#${entry.employee_id}`}
                  </TableCell>
                  <TableCell>
                    {entry.sale_id ? (
                      <Typography
                        variant="body2"
                        color="primary"
                        fontWeight={600}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                          "&:hover": { opacity: 0.75 },
                        }}
                        onClick={() => handleOpenSaleDetails(entry.sale_id!)}
                      >
                        #{entry.sale_id}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled" fontStyle="italic">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.commission_type === "percentage"
                      ? `${Number(entry.rate).toFixed(2)}%`
                      : `R$ ${Number(entry.rate).toFixed(2)} fixo`}
                  </TableCell>
                  <TableCell>
                    R$ {Number(entry.base_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {entry.commission_type === "percentage"
                      ? `${Number(entry.rate).toFixed(2)}%`
                      : "fixo"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    R$ {Number(entry.commission_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status === "pending" ? "Pendente" : "Pago"}
                      color={entry.status === "paid" ? "success" : "warning"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {entries.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled">
                    Nenhuma comissão encontrada para os filtros selecionados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SaleDetailsModal
        open={isSaleModalOpen}
        saleId={selectedSaleId}
        onClose={() => setIsSaleModalOpen(false)}
      />
    </Box>
  );
}
