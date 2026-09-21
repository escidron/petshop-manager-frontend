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
  Typography,
  Chip,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Pencil, User, Scissors } from "lucide-react";
import CommissionRuleFormModal from "../features/commissions/CommissionRuleFormModal";
import CommissionRuleDeleteModal from "../features/commissions/CommissionRuleDeleteModal";
import { deleteCommissionRule, getCommissionRules } from "../api/services/commissions";
import { useToast } from "../hooks/useToast";
import type { CommissionRule } from "../features/commissions/types";
import { Button } from "../components/Button/Button";
import { formatServiceLabel } from "../utils/formatServiceLabel";
import CustomTextField from "../components/Textfield/CustomTextfield";

const headerCellSx = {
  backgroundColor: "secondary.main",
  fontWeight: 600,
  color: "text.primary",
  py: 1.25,
  fontSize: "0.875rem",
};

export default function CommissionRulesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<CommissionRule | undefined>(undefined);
  const [ruleToDelete, setRuleToDelete] = useState<CommissionRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      queryClient.invalidateQueries({ queryKey: ["commissionRules"] });
      loadRules();
      setRuleToDelete(null);
    } catch {
      toast.error("Erro ao excluir regra.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCoverageLabel = (row: CommissionRule) => {
    const hasEmployees =
      (row.employees && row.employees.length > 0) ||
      (row.employee_ids && row.employee_ids.length > 0) ||
      row.employee_id;
    const hasServices = row.service_ids?.length;

    if (hasEmployees && hasServices) return "Funcionários + Serviços";
    if (hasEmployees) return "Funcionários";
    if (hasServices) return "Serviços";
    return "Global";
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1400px",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Regras de Comissão
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure regras de comissionamento por funcionários e serviços
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => {
            setRuleToEdit(undefined);
            setModalOpen(true);
          }}
          sx={{
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          Nova Regra
        </Button>
      </Box>

      {/* Toolbar com Busca */}
      <Box sx={{ mb: 2, width: { xs: "100%", sm: 340 } }}>
        <CustomTextField
          fullWidth
          icon={<Search size={18} />}
          placeholder="Buscar regra de comissão..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Visualização Mobile em Cards */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading && filteredRows.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Paper
                key={`skeleton-${i}`}
                elevation={0}
                sx={{ p: 2, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}
              >
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="rectangular" height={60} sx={{ my: 1.5, borderRadius: 2 }} />
                <Skeleton variant="text" width="40%" height={20} />
              </Paper>
            ))
          ) : filteredRows.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <Typography color="text.disabled" variant="body1">
                Nenhuma regra de comissão cadastrada.
              </Typography>
            </Paper>
          ) : (
            filteredRows.map((row) => {
              const isPercentage = row.commission_type === "percentage";
              const formattedValue = isPercentage
                ? `${Number(row.value).toFixed(2).replace(".", ",")}%`
                : `R$ ${Number(row.value).toFixed(2).replace(".", ",")}`;

              const isAllEmployees =
                (!row.employees || row.employees.length === 0) &&
                (!row.employee_ids || row.employee_ids.length === 0) &&
                !row.employee_id &&
                !row.employee_name;

              const isAllServices =
                (!row.services || row.services.length === 0) &&
                (!row.service_ids || row.service_ids.length === 0);

              const empText = isAllEmployees
                ? "Todos os funcionários"
                : row.employees?.length
                ? row.employees.map((e) => e.name).join(", ")
                : row.employee_name || "Todos os funcionários";

              const svcText = isAllServices
                ? "Todos os serviços"
                : row.services?.length
                ? row.services.map((s) => formatServiceLabel(s)).join(", ")
                : "Todos os serviços";

              return (
                <Paper
                  key={row.id}
                  elevation={0}
                  onClick={() => {
                    setRuleToEdit(row);
                    setModalOpen(true);
                  }}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    opacity: row.is_active ? 1 : 0.6,
                    transition: "all 0.15s ease",
                    "&:active": {
                      bgcolor: "action.hover",
                      transform: "scale(0.99)",
                    },
                  }}
                >
                  {/* Linha 1: Nome da Regra e Valor em Destaque */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ fontSize: "0.98rem", lineHeight: 1.3 }}
                    >
                      {row.name}
                    </Typography>

                    <Typography
                      variant="body1"
                      fontWeight={800}
                      color="primary.main"
                      sx={{ fontSize: "1.1rem", whiteSpace: "nowrap" }}
                    >
                      {formattedValue}
                    </Typography>
                  </Box>

                  {/* Linha 2: Informação de Funcionários e Serviços */}
                  <Box
                    sx={{
                      bgcolor: "#F8FAFC",
                      borderRadius: 1.5,
                      p: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <User size={13} color="#64748B" style={{ flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                        {empText}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Scissors size={13} color="#64748B" style={{ flexShrink: 0 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                        {svcText}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Linha 3: Rodapé com Ação */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 0.75,
                      borderTop: "1px dashed #E2E8F0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.6,
                        color: "text.secondary",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                      }}
                    >
                      <Pencil size={13} />
                      Toque para editar
                    </Box>

                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(row);
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      ) : (
        /* Visualização Desktop em Tabela */
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Nome</TableCell>
                <TableCell sx={headerCellSx}>Funcionário</TableCell>
                <TableCell sx={headerCellSx}>Serviço</TableCell>
                <TableCell sx={headerCellSx}>Comissão</TableCell>
                <TableCell sx={headerCellSx}>Abrangência</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell align="right" sx={headerCellSx}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    transition: "opacity 0.2s ease, background-color 0.15s ease",
                    opacity: row.is_active ? 1 : 0.5,
                    "&:hover": {
                      backgroundColor: "secondary.main",
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>
                    {row.employees?.length
                      ? row.employees.map((emp) => (
                          <Chip key={emp.id} label={emp.name} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
                        ))
                      : row.employee_name
                      ? <Chip label={row.employee_name} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
                      : <em style={{ color: "gray" }}>Todos</em>}
                  </TableCell>
                  <TableCell>
                    {row.services?.length
                      ? row.services.map((svc) => (
                          <Chip key={svc.id} label={formatServiceLabel(svc)} size="small" sx={{ mr: 0.5, mb: 0.25 }} />
                        ))
                      : <em style={{ color: "gray" }}>Todos</em>}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                    {row.commission_type === "percentage"
                      ? `${Number(row.value).toFixed(2)}%`
                      : `R$ ${Number(row.value).toFixed(2)}`}
                  </TableCell>
                  <TableCell>{getCoverageLabel(row)}</TableCell>
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
      )}

      <CommissionRuleFormModal
        open={modalOpen}
        mode={ruleToEdit ? "edit" : "create"}
        rule={ruleToEdit}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["commissionRules"] });
          loadRules();
        }}
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

