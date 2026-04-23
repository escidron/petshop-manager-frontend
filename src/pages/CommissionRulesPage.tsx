import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import { useServices } from "../hooks/useServices";
import CommissionRuleFormModal from "../features/commissions/CommissionRuleFormModal";
import { deleteCommissionRule, getCommissionRules } from "../api/services/commissions";
import { useToast } from "../hooks/useToast";
import type { CommissionRule } from "../features/commissions/types";
import { Button } from "../components/Button/Button";

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

export default function CommissionRulesPage() {
  const [search, setSearch] = useState("");
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<CommissionRule | undefined>(undefined);
  const { employees, getEmployees } = useEmployees();
  const { services, getServices } = useServices();
  const toast = useToast();

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await getCommissionRules();
      setRules(data);
    } catch {
      toast.error("Erro ao carregar regras de comissão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
    getEmployees();
    getServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.name])),
    [services],
  );

  const filteredRows = useMemo(() => {
    if (!search) return rules;
    return rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [rules, search]);

  const handleDelete = async (id: number) => {
    if (confirm("Deseja excluir esta regra de comissão?")) {
      try {
        await deleteCommissionRule(id);
        toast.success("Regra excluída!");
        loadRules();
      } catch {
        toast.error("Erro ao excluir regra.");
      }
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="gray" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => { setRuleToEdit(undefined); setModalOpen(true); }}
        >
          Nova Regra
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>Nome</TableCell>
              <TableCell sx={headerCellSx}>Funcionário</TableCell>
              <TableCell sx={headerCellSx}>Serviço</TableCell>
              <TableCell sx={headerCellSx}>Comissão</TableCell>
              <TableCell sx={headerCellSx}>Prioridade</TableCell>
              <TableCell sx={headerCellSx}>Status</TableCell>
              <TableCell align="right" sx={headerCellSx} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.employee_id ? (employeeMap[row.employee_id] ?? "-") : <em style={{ color: "gray" }}>Qualquer</em>}</TableCell>
                <TableCell>{row.service_id ? (serviceMap[row.service_id] ?? "-") : <em style={{ color: "gray" }}>Qualquer</em>}</TableCell>
                <TableCell>
                  {row.commission_type === "percentage"
                    ? `${Number(row.value).toFixed(2)}%`
                    : `R$ ${Number(row.value).toFixed(2)}`}
                </TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell>
                  <Chip
                    label={row.is_active ? "Ativa" : "Inativa"}
                    color={row.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => { setRuleToEdit(row); setModalOpen(true); }}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled" variant="body1">
                    Nenhuma regra de comissão cadastrada.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CommissionRuleFormModal
        open={modalOpen}
        mode={ruleToEdit ? "edit" : "create"}
        rule={ruleToEdit}
        employees={employees}
        services={services}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); loadRules(); }}
      />
    </Box>
  );
}
