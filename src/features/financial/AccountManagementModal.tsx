import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Switch,
} from "@mui/material";
import { Plus, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDREAccounts,
  createDREAccount,
  updateDREAccount,
  deleteDREAccount,
  type DREGroupType,
} from "../../api/services/financial";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
  year: number;
}

const GROUP_LABELS: Record<DREGroupType, string> = {
  gross_revenue: "Receita Bruta",
  cmv: "CMV / Custos Diretos",
  fixed_expense: "Despesas Fixas",
  variable_expense: "Despesas Variáveis",
  financial_revenue: "Receitas Financeiras / Não Operacionais",
  financial_expense: "Despesas Financeiras / Não Operacionais",
  financial_result: "Resultado Financeiro",
  result: "Resultado",
};

export default function AccountManagementModal({ open, onClose, year }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DREGroupType>("fixed_expense");
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [groupType, setGroupType] = useState<DREGroupType>("fixed_expense");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["dre-accounts"],
    queryFn: listDREAccounts,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: createDREAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report", year] });
      toast.success("Conta cadastrada com sucesso!");
      setName("");
      setCode("");
      setIsCreating(false);
    },
    onError: () => {
      toast.error("Erro ao cadastrar conta.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateDREAccount(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report", year] });
      toast.success("Status da conta atualizado.");
    },
    onError: () => {
      toast.error("Erro ao atualizar conta.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDREAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report", year] });
      toast.success("Conta removida com sucesso.");
    },
    onError: () => {
      toast.error("Não foi possível excluir esta conta.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warn("Informe o nome da conta.");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      code: code.trim() || undefined,
      group_type: groupType,
    });
  };

  const filteredAccounts = accounts.filter((a) => a.group_type === activeTab);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Plano de Contas & Categorias DRE
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalize as contas operacionais e despesas que compõem o DRE do seu pet shop.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            setGroupType(val);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2.5, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="fixed_expense" label="Despesas Fixas" />
          <Tab value="variable_expense" label="Despesas Variáveis" />
          <Tab value="gross_revenue" label="Receitas" />
          <Tab value="cmv" label="Custos Diretos (CMV)" />
          <Tab value="financial_revenue" label="Receitas Financeiras" />
          <Tab value="financial_expense" label="Despesas Financeiras" />
        </Tabs>

        {/* Botão para abrir formulário de criação */}
        {!isCreating && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={() => setIsCreating(true)}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Nova Conta em {GROUP_LABELS[activeTab]}
            </Button>
          </Box>
        )}

        {/* Formulário de criação */}
        {isCreating && (
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleCreate}
            sx={{
              p: 2,
              mb: 3,
              border: "1px solid",
              borderColor: "primary.main",
              borderRadius: 2,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "primary.main" }}>
              Cadastrar Nova Conta em {GROUP_LABELS[activeTab]}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5, mb: 1.5 }}>
              <TextField
                label="Nome da Conta"
                placeholder="Ex: Clínica Veterinária Parceira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <TextField
                label="Código Contábil (Opcional)"
                placeholder="Ex: 3.16"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsCreating(false)}
                sx={{ textTransform: "none" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={createMutation.isPending}
                sx={{ textTransform: "none" }}
              >
                {createMutation.isPending ? "Salvando..." : "Salvar Conta"}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Listagem de contas */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: "100px" }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nome da Conta</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "130px" }}>Origem</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "100px", textAlign: "center" }}>Ativa</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "80px", textAlign: "right" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      Nenhuma conta cadastrada neste grupo.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((acc) => (
                    <TableRow key={acc.id} hover>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                        {acc.code || "-"}
                      </TableCell>
                      <TableCell sx={{ fontWeight: acc.is_system ? 600 : 400 }}>
                        {acc.name}
                      </TableCell>
                      <TableCell>
                        {acc.is_system ? (
                          <Chip label="Automática" size="small" color="primary" variant="outlined" />
                        ) : acc.system_source?.startsWith("payroll_") ? (
                          <Chip label="Folha (Auto)" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label="Manual" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={acc.is_active}
                          onChange={(e) =>
                            updateMutation.mutate({ id: acc.id, is_active: e.target.checked })
                          }
                          disabled={acc.is_system || Boolean(acc.system_source?.startsWith("payroll_"))}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {!acc.is_system && !acc.system_source?.startsWith("payroll_") ? (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm(`Deseja realmente excluir a conta "${acc.name}"?`)) {
                                deleteMutation.mutate(acc.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Protegida
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: "none", borderRadius: 2 }}>
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
