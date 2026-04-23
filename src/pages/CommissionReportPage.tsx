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
  FormControl,
  InputLabel,
  Checkbox,
  Button as MuiButton,
  Alert,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { useEmployees } from "../hooks/useEmployees";
import { getCommissionEntries, payCommissionEntries } from "../api/services/commissions";
import { useToast } from "../hooks/useToast";
import type { CommissionEntry } from "../features/commissions/types";

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

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
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  const pendingEntries = useMemo(() => entries.filter((e) => e.status === "pending"), [entries]);

  const totalPending = useMemo(
    () => entries.filter((e) => e.status === "pending").reduce((acc, e) => acc + Number(e.commission_amount), 0),
    [entries],
  );

  const totalPaid = useMemo(
    () => entries.filter((e) => e.status === "paid").reduce((acc, e) => acc + Number(e.commission_amount), 0),
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
      toast.error("Selecione entradas de um único funcionário por vez para pagamento.");
      return;
    }

    try {
      setPaying(true);
      await payCommissionEntries({
        employee_id: employeeIds[0],
        entry_ids: selectedPending.map((e) => e.id),
      });
      toast.success(`${selectedPending.length} comissão(ões) marcada(s) como paga(s).`);
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
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Total Pendente</Typography>
          <Typography variant="h5" color="warning.main" fontWeight={700}>
            R$ {totalPending.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Total Pago</Typography>
          <Typography variant="h5" color="success.main" fontWeight={700}>
            R$ {totalPaid.toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">Total Geral</Typography>
          <Typography variant="h5" fontWeight={700}>
            R$ {(totalPending + totalPaid).toFixed(2)}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Funcionário</InputLabel>
            <Select
              value={filterEmployee}
              label="Funcionário"
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {employees.map((e) => (
                <MenuItem key={e.id} value={String(e.id)}>{e.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="paid">Pago</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="De"
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="Até"
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <MuiButton variant="contained" onClick={loadEntries} disabled={loading}>
            Filtrar
          </MuiButton>
        </Box>
      </Paper>

      {/* Pay action */}
      {selectedPending.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <MuiButton color="success" variant="contained" size="small" onClick={handlePay} disabled={paying}>
              {paying ? "Processando..." : `Marcar ${selectedPending.length} como pago`}
            </MuiButton>
          }
        >
          {selectedPending.length} entrada(s) selecionada(s) — total R$ {selectedPending.reduce((acc, e) => acc + Number(e.commission_amount), 0).toFixed(2)}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx} padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.size > 0 && selectedIds.size < pendingEntries.length}
                  checked={pendingEntries.length > 0 && selectedIds.size === pendingEntries.length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell sx={headerCellSx}>Funcionário</TableCell>
              <TableCell sx={headerCellSx}>Venda #</TableCell>
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
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                      />
                    )}
                  </TableCell>
                  <TableCell>{employeeMap[entry.employee_id] ?? `#${entry.employee_id}`}</TableCell>
                  <TableCell>#{entry.sale_id}</TableCell>
                  <TableCell>
                    {entry.commission_type === "percentage"
                      ? `${Number(entry.rate).toFixed(2)}%`
                      : `R$ ${Number(entry.rate).toFixed(2)} fixo`}
                  </TableCell>
                  <TableCell>R$ {Number(entry.base_amount).toFixed(2)}</TableCell>
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
            {loading && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
