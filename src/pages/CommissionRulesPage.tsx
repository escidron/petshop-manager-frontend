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
  Chip,
  Skeleton,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import { useServices } from "../hooks/useServices";
import CommissionRuleFormModal from "../features/commissions/CommissionRuleFormModal";
import CommissionRuleDeleteModal from "../features/commissions/CommissionRuleDeleteModal";
import { deleteCommissionRule, getCommissionRules } from "../api/services/commissions";
import { useToast } from "../hooks/useToast";
import type { CommissionRule } from "../features/commissions/types";
import { Button } from "../components/Button/Button";
import { formatServiceLabel } from "../utils/formatServiceLabel";

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
  const [ruleToDelete, setRuleToDelete] = useState<CommissionRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const serviceById = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s])),
    [services],
  );

  const filteredRows = useMemo(() => {
    if (!search) return rules;
    return rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [rules, search]);

  const handleDeleteClick = (rule: CommissionRule) => {
    setRuleToDelete(rule);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCommissionRule(ruleToDelete.id);
      toast.success("Regra excluída!");
      loadRules();
      setRuleToDelete(null);
    } catch {
      toast.error("Erro ao excluir regra.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1400px" }}>
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
              <TableCell sx={headerCellSx}>Abrangência</TableCell>
              <TableCell sx={headerCellSx}>Status</TableCell>
              <TableCell align="right" sx={headerCellSx} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  transition: "opacity 0.2s ease",
                  opacity: row.is_active ? 1 : 0.5,
                }}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.employee_id ? (employeeMap[row.employee_id] ?? "-") : <em style={{ color: "gray" }}>Qualquer</em>}</TableCell>
                <TableCell>
                  {row.service_ids?.length
                    ? row.service_ids.map((id) => {
                        const svc = serviceById[id];
                        return svc ? (
                          <Chip key={id} label={formatServiceLabel(svc)} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
                        ) : null;
                      })
                    : <em style={{ color: "gray" }}>Qualquer</em>}
                </TableCell>
                <TableCell>
                  {row.commission_type === "percentage"
                    ? `${Number(row.value).toFixed(2)}%`
                    : `R$ ${Number(row.value).toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {row.employee_id && row.service_ids?.length
                    ? "Funcionário + Serviços"
                    : row.employee_id
                    ? "Funcionário"
                    : row.service_ids?.length
                    ? "Serviços"
                    : "Global"}
                </TableCell>
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
                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
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
            {loading && filteredRows.length === 0 && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="rectangular" width={60} height={24} sx={{ display: "inline-block" }} /></TableCell>
                </TableRow>
              ))
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

      {ruleToDelete && (
        <CommissionRuleDeleteModal
          open={!!ruleToDelete}
          rule={ruleToDelete}
          loading={isDeleting}
          onCancel={() => setRuleToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
